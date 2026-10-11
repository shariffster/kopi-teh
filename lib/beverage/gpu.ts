export type Uniform = number | number[] | Float32Array | WebGLTexture;
export interface Target {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  size: number;
}
export interface Pair {
  read: Target;
  write: Target;
  swap(): void;
}
const VERTEX = `#version 300 es
precision highp float;
out vec2 uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  uv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/** Small, explicit fullscreen-pass wrapper; no scene graph or 3D overhead. */
export class GPU {
  readonly gl: WebGL2RenderingContext;
  private programs: WebGLProgram[] = [];
  private targets: Target[] = [];
  private textures: WebGLTexture[] = [];
  private uniforms = new Map<
    WebGLProgram,
    Map<string, { location: WebGLUniformLocation; type: number }>
  >();
  private vao: WebGLVertexArrayObject;
  constructor(readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      // Presentation writes opaque, photo-matched pixels. Browser clipping owns
      // the outer boundary, so WebKit never has to interpret straight-alpha RGB.
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
      // The settled photograph is retained without redrawing on every idle frame.
      preserveDrawingBuffer: true,
    });
    if (!gl || !gl.getExtension('EXT_color_buffer_float'))
      throw new Error('Interactive coffee needs WebGL 2. Try another browser.');
    this.gl = gl;
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  }
  program(fragment: string): WebGLProgram {
    const gl = this.gl;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error ?? 'Shader compilation failed');
      }
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(
      gl.FRAGMENT_SHADER,
      `#version 300 es\nprecision highp float;\nin vec2 uv;\nout vec4 fragColor;\n${fragment}`,
    );
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program) ?? 'Shader link failed');
    const locations = new Map<
      string,
      { location: WebGLUniformLocation; type: number }
    >();
    for (
      let i = 0;
      i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      i++
    ) {
      const u = gl.getActiveUniform(program, i)!;
      locations.set(u.name.replace('[0]', ''), {
        location: gl.getUniformLocation(program, u.name)!,
        type: u.type,
      });
    }
    this.uniforms.set(program, locations);
    this.programs.push(program);
    return program;
  }
  texture(image: HTMLImageElement): WebGLTexture {
    const gl = this.gl,
      texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    this.parameters(gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    this.textures.push(texture);
    return texture;
  }
  private parameters(filter: number) {
    const gl = this.gl;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  target(size: number, float = true): Target {
    const gl = this.gl,
      texture = gl.createTexture()!,
      framebuffer = gl.createFramebuffer()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    this.parameters(gl.LINEAR);
    // RGBA16F deliberately favors portable float renderability over narrow formats.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      float ? gl.RGBA16F : gl.RGBA8,
      size,
      size,
      0,
      gl.RGBA,
      float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE,
      null,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(texture);
      throw new Error('This device cannot allocate the coffee surface.');
    }
    const target = { texture, framebuffer, size };
    this.targets.push(target);
    this.clear(target);
    return target;
  }
  pair(size: number, float = true): Pair {
    return {
      read: this.target(size, float),
      write: this.target(size, float),
      swap() {
        [this.read, this.write] = [this.write, this.read];
      },
    };
  }
  clear(target: Target) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  draw(
    program: WebGLProgram,
    target: Target | null,
    values: Record<string, Uniform>,
  ) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target?.framebuffer ?? null);
    gl.viewport(
      0,
      0,
      target?.size ?? this.canvas.width,
      target?.size ?? this.canvas.height,
    );
    gl.useProgram(program);
    gl.bindVertexArray(this.vao);
    let unit = 0;
    for (const [name, value] of Object.entries(values)) {
      const u = this.uniforms.get(program)?.get(name);
      if (!u) continue;
      if (u.type === gl.SAMPLER_2D) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, value as WebGLTexture);
        gl.uniform1i(u.location, unit++);
      } else if (typeof value === 'number') {
        if (u.type === gl.INT) gl.uniform1i(u.location, value);
        else gl.uniform1f(u.location, value);
      } else {
        const v = value as Float32List;
        if (u.type === gl.FLOAT_VEC2) gl.uniform2fv(u.location, v);
        else if (u.type === gl.FLOAT_VEC3) gl.uniform3fv(u.location, v);
        else if (u.type === gl.FLOAT_VEC4) gl.uniform4fv(u.location, v);
        else gl.uniform1fv(u.location, v);
      }
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  release(target: Target) {
    this.gl.deleteFramebuffer(target.framebuffer);
    this.gl.deleteTexture(target.texture);
    this.targets = this.targets.filter((t) => t !== target);
  }
  dispose() {
    for (const target of this.targets) this.release(target);
    for (const texture of this.textures) this.gl.deleteTexture(texture);
    for (const program of this.programs) this.gl.deleteProgram(program);
    this.gl.deleteVertexArray(this.vao);
  }
}
