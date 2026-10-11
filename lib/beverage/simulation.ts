import { GPU, type Pair, type Target } from './gpu';
import {
  LATTE_CONFIG as config,
  type Quality,
  type Splat,
  type SurfaceContact,
} from './config';
import * as shaders from './shaders';
import { EMPTY_CUP_COLOR } from './mixing';

export class BeverageSimulation {
  readonly programs: Record<keyof typeof shaders, WebGLProgram>;
  flow!: Pair;
  pigment!: Pair;
  foam!: Pair;
  private foamForward!: Target;
  private pressure!: Pair;
  private divergence!: Target;
  private forward!: Target;
  private means: Target[] = [];
  private referenceMean!: Target;
  private foamMeans: Target[] = [];
  private foamReference!: Target;
  private steps = 0;
  private inspectionTarget?: Target;
  private inspectionProgram?: WebGLProgram;
  quality: Quality;
  private allocated: Target[] = [];
  private seedColor: number[] = [...EMPTY_CUP_COLOR];
  constructor(
    readonly gpu: GPU,
    quality: Quality,
    readonly photo: WebGLTexture,
    readonly crop: number[],
  ) {
    this.quality = quality;
    this.programs = Object.fromEntries(
      Object.entries(shaders).map(([name, source]) => [
        name,
        gpu.program(source),
      ]),
    ) as Record<keyof typeof shaders, WebGLProgram>;
    this.allocate(quality);
    this.reset();
  }
  private allocate(quality: Quality) {
    const res = config.resolution[quality];
    this.flow = this.gpu.pair(res.flow);
    this.pressure = this.gpu.pair(res.flow);
    this.divergence = this.gpu.target(res.flow);
    // Float pigment avoids 8-bit quantization freezing slow sub-pixel motion.
    this.pigment = this.gpu.pair(res.pigment);
    this.forward = this.gpu.target(res.pigment);
    this.foam = this.gpu.pair(res.foam);
    this.foamForward = this.gpu.target(res.foam);
    this.means = [64, 32, 16, 8, 4, 2, 1].map((size) => this.gpu.target(size));
    this.referenceMean = this.gpu.target(1);
    this.foamMeans = [64, 32, 16, 8, 4, 2, 1].map((size) =>
      this.gpu.target(size),
    );
    this.foamReference = this.gpu.target(1);
    this.allocated = [
      this.flow.read,
      this.flow.write,
      this.pressure.read,
      this.pressure.write,
      this.divergence,
      this.pigment.read,
      this.pigment.write,
      this.forward,
      this.foam.read,
      this.foam.write,
      this.foamForward,
      ...this.means,
      this.referenceMean,
      ...this.foamMeans,
      this.foamReference,
    ];
  }
  reset(color: readonly number[] = this.seedColor) {
    this.seedColor = [...color];
    for (const target of this.allocated) this.gpu.clear(target);
    this.gpu.draw(this.programs.DRINK_SEED, this.pigment.read, {
      baseColor: this.seedColor,
    });
    this.updateMean();
    this.gpu.draw(this.programs.COPY, this.referenceMean, {
      source: this.means[6].texture,
    });
    this.gpu.draw(this.programs.COPY, this.foamReference, {
      source: this.foamMeans[6].texture,
    });
    this.steps = 0;
  }
  resetOriginal() {
    for (const target of this.allocated) this.gpu.clear(target);
    this.gpu.draw(this.programs.SEED, this.pigment.read, {
      photograph: this.photo,
      crop: this.crop,
    });
    this.gpu.draw(this.programs.FOAM_SEED, this.foam.read, {
      photograph: this.photo,
      crop: this.crop,
    });
    this.updateMean();
    this.gpu.draw(this.programs.COPY, this.referenceMean, {
      source: this.means[6].texture,
    });
    this.gpu.draw(this.programs.COPY, this.foamReference, {
      source: this.foamMeans[6].texture,
    });
    this.steps = 0;
  }
  shapeFroth(x: number, y: number, design = 0, designScale = 1) {
    this.gpu.draw(this.programs.FROTH_SHAPE, this.pigment.write, {
      source: this.pigment.read.texture,
      centre: [x, y],
      design,
      designScale,
      foamMode: 0,
    });
    this.pigment.swap();
    this.gpu.draw(this.programs.FROTH_SHAPE, this.foam.write, {
      source: this.foam.read.texture,
      centre: [x, y],
      design,
      designScale,
      foamMode: 1,
    });
    this.foam.swap();
    this.updateMean();
    this.gpu.draw(this.programs.COPY, this.referenceMean, {
      source: this.means[6].texture,
    });
    this.gpu.draw(this.programs.COPY, this.foamReference, {
      source: this.foamMeans[6].texture,
    });
  }
  setMaterialReference(color: readonly number[]) {
    this.gpu.draw(this.programs.MATERIAL_REFERENCE, this.referenceMean, {
      baseColor: [...color],
    });
  }
  pour(
    color: readonly number[],
    x: number,
    y: number,
    radius: number,
    strength: number,
    phase: number,
    sugar: boolean,
    preserveSurfaceColor = false,
    viscosity = 0,
    entrainment = 0,
  ) {
    this.gpu.draw(this.programs.POUR, this.pigment.write, {
      source: this.pigment.read.texture,
      currentMean: this.means[6].texture,
      ingredientColor: [...color],
      centre: [x, y],
      radius,
      strength,
      phase,
      sugar: sugar ? 1 : 0,
      viscosity,
      entrainment,
    });
    this.pigment.swap();
    // The new material is authoritative. Update current mean promptly so the
    // transport correction conserves the addition rather than the old latte.
    this.updateMean();
    if (preserveSurfaceColor) {
      this.gpu.draw(this.programs.COPY, this.referenceMean, {
        source: this.means[6].texture,
      });
    }
  }
  inspectForTest() {
    if (process.env.NODE_ENV !== 'development') return undefined;
    const gl = this.gpu.gl,
      size = 64;
    this.inspectionTarget ??= this.gpu.target(size, false);
    this.inspectionProgram ??= this.gpu.program(`
      uniform sampler2D source;
      void main() {
        vec2 n=floor(clamp(texture(source,uv).xy*.5+.5,0.0,1.0)*65535.0+.5);
        fragColor=vec4(floor(n.x/256.0),mod(n.x,256.0),floor(n.y/256.0),mod(n.y,256.0))/255.0;
      }`);
    const pixels = new Uint8Array(size * size * 4);
    this.gpu.draw(this.programs.COPY, this.inspectionTarget, {
      source: this.pigment.read.texture,
    });
    gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let count = 0,
      luma = 0,
      squares = 0,
      white = 0;
    const rgb = [0, 0, 0];
    const inCup = (i: number) =>
      Math.hypot(
        ((i % size) + 0.5) / size - 0.5,
        (Math.floor(i / size) + 0.5) / size - 0.5,
      ) < 0.45;
    for (let i = 0; i < size * size; i++) {
      if (!inCup(i)) continue;
      const r = pixels[i * 4] / 255,
        g = pixels[i * 4 + 1] / 255,
        b = pixels[i * 4 + 2] / 255;
      const y = r * 0.299 + g * 0.587 + b * 0.114;
      rgb[0] += r;
      rgb[1] += g;
      rgb[2] += b;
      luma += y;
      squares += y * y;
      count++;
      if (r > 0.82 && g > 0.76 && b > 0.6) white++;
    }
    this.gpu.draw(this.inspectionProgram, this.inspectionTarget, {
      source: this.flow.read.texture,
    });
    gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let energy = 0,
      maximum = 0;
    for (let i = 0; i < size * size; i++) {
      if (!inCup(i)) continue;
      const x = ((pixels[i * 4] * 256 + pixels[i * 4 + 1]) / 65535) * 2 - 1;
      const y = ((pixels[i * 4 + 2] * 256 + pixels[i * 4 + 3]) / 65535) * 2 - 1;
      const v = Math.hypot(x, y);
      energy += v * v;
      maximum = Math.max(maximum, v);
    }
    return {
      meanRgb: rgb.map((v) => v / count),
      luma: luma / count,
      contrast: Math.sqrt(Math.max(0, squares / count - (luma / count) ** 2)),
      whiteFraction: white / count,
      velocityRms: Math.sqrt(energy / count),
      velocityMax: maximum,
      glError: gl.getError(),
      context: gl.getContextAttributes(),
    };
  }
  private updateMean() {
    this.gpu.draw(this.programs.MEAN, this.means[0], {
      source: this.pigment.read.texture,
    });
    for (let i = 1; i < this.means.length; i++) {
      this.gpu.draw(this.programs.REDUCE, this.means[i], {
        source: this.means[i - 1].texture,
        texel: [1 / this.means[i - 1].size, 1 / this.means[i - 1].size],
      });
    }
    this.gpu.draw(this.programs.FOAM_MEAN, this.foamMeans[0], {
      source: this.foam.read.texture,
    });
    for (let i = 1; i < this.foamMeans.length; i++) {
      this.gpu.draw(this.programs.REDUCE, this.foamMeans[i], {
        source: this.foamMeans[i - 1].texture,
        texel: [1 / this.foamMeans[i - 1].size, 1 / this.foamMeans[i - 1].size],
      });
    }
  }
  get meanTexture() {
    return this.means[6].texture;
  }
  park() {
    // The smooth envelope has already removed visible momentum. Clear pressure
    // as well so its warm start cannot reintroduce motion on the next contact.
    for (const target of [
      this.flow.read,
      this.flow.write,
      this.pressure.read,
      this.pressure.write,
    ])
      this.gpu.clear(target);
    this.updateMean();
  }
  degrade() {
    if (this.quality === 'low') return;
    const old = [...this.allocated],
      oldPigment = this.pigment.read,
      oldFlow = this.flow.read,
      oldFoam = this.foam.read,
      oldFoamReference = this.foamReference,
      oldReference = this.referenceMean;
    this.quality = this.quality === 'desktop' ? 'mobile' : 'low';
    this.allocate(this.quality);
    this.gpu.draw(this.programs.COPY, this.pigment.read, {
      source: oldPigment.texture,
    });
    this.gpu.draw(this.programs.COPY, this.flow.read, {
      source: oldFlow.texture,
    });
    this.gpu.draw(this.programs.COPY, this.foam.read, {
      source: oldFoam.texture,
    });
    this.gpu.draw(this.programs.COPY, this.referenceMean, {
      source: oldReference.texture,
    });
    this.gpu.draw(this.programs.COPY, this.foamReference, {
      source: oldFoamReference.texture,
    });
    this.updateMean();
    for (const t of old) this.gpu.release(t);
  }
  step(
    dt: number,
    splats: Splat[],
    motion: {
      dissipation: number;
      curlFade: number;
      viscosity: number;
      retention: number;
    },
    contacts: SurfaceContact[] = [],
  ) {
    const gpu = this.gpu,
      r = config.resolution[this.quality],
      texel = [1 / r.flow, 1 / r.flow];
    const positions = new Float32Array(64),
      impulses = new Float32Array(64);
    for (let i = 0; i < Math.min(splats.length, 16); i++) {
      const s = splats[i];
      positions.set([s.x, s.y, s.radius, 0], i * 4);
      impulses.set([s.dx, s.dy, s.spin, s.prod], i * 4);
    }
    gpu.draw(this.programs.FLOW, this.flow.write, {
      velocity: this.flow.read.texture,
      texel,
      dt,
      dissipation: motion.dissipation,
      viscosity: motion.viscosity,
      maxSpeed: config.maxSpeed,
      count: Math.min(splats.length, 16),
      positions,
      impulses,
    });
    this.flow.swap();
    gpu.draw(this.programs.VORTICITY, this.divergence, {
      velocity: this.flow.read.texture,
      texel,
    });
    gpu.draw(this.programs.CONFINEMENT, this.flow.write, {
      velocity: this.flow.read.texture,
      vorticity: this.divergence.texture,
      texel,
      dt,
      strength: config.curl * motion.curlFade,
    });
    this.flow.swap();
    gpu.draw(this.programs.DIVERGENCE, this.divergence, {
      velocity: this.flow.read.texture,
      texel,
    });
    // Warm-start the pressure solve so large-scale correction persists between frames.
    for (let i = 0; i < r.pressure; i++) {
      gpu.draw(this.programs.PRESSURE, this.pressure.write, {
        pressure: this.pressure.read.texture,
        divergence: this.divergence.texture,
        texel,
        relaxation: i === 0 ? 0.8 : 1,
      });
      this.pressure.swap();
    }
    gpu.draw(this.programs.PROJECT, this.flow.write, {
      pressure: this.pressure.read.texture,
      velocity: this.flow.read.texture,
      texel,
      retention: motion.retention,
    });
    this.flow.swap();
    gpu.draw(this.programs.ADVECT, this.forward, {
      pigment: this.pigment.read.texture,
      velocity: this.flow.read.texture,
      dt: dt * config.transportSpeed,
    });
    gpu.draw(this.programs.CORRECT, this.pigment.write, {
      pigment: this.pigment.read.texture,
      forward: this.forward.texture,
      velocity: this.flow.read.texture,
      texel: [1 / r.pigment, 1 / r.pigment],
      currentMean: this.means[6].texture,
      referenceMean: this.referenceMean.texture,
      conservationGain: config.conservationGain,
      dt: dt * config.transportSpeed,
    });
    this.pigment.swap();
    const contactPositions = new Float32Array(8);
    const contactDirections = new Float32Array(8);
    contacts.slice(0, 2).forEach((contact, i) => {
      contactPositions.set(
        [contact.x, contact.y, contact.radius, config.foam.contactDepth],
        i * 4,
      );
      contactDirections.set(
        [contact.directionX, contact.directionY, 0, 0],
        i * 4,
      );
    });
    gpu.draw(this.programs.ADVECT, this.foamForward, {
      pigment: this.foam.read.texture,
      velocity: this.flow.read.texture,
      dt: dt * config.transportSpeed,
    });
    gpu.draw(this.programs.FOAM_EVOLVE, this.foam.write, {
      source: this.foam.read.texture,
      forward: this.foamForward.texture,
      velocity: this.flow.read.texture,
      texel: [1 / r.foam, 1 / r.foam],
      dt,
      transportSpeed: config.transportSpeed,
      relaxation: config.foam.relaxation,
      contactCount: Math.min(contacts.length, 2),
      contactPositions,
      contactDirections,
      contactFollow: config.foam.contactFollow,
      currentMean: this.foamMeans[6].texture,
      referenceMean: this.foamReference.texture,
      count: Math.min(splats.length, 16),
      positions,
      impulses,
    });
    this.foam.swap();
    // GPU-only reduction; no synchronous readback in the frame loop. This gently
    // corrects transport color drift without repopulating the original art.
    if (++this.steps % 8 === 0) this.updateMean();
  }
}
