import { loadAssets } from './assets';
import { LATTE_CONFIG as config, type Quality, type Splat } from './config';
import { GPU } from './gpu';
import { BeverageSimulation } from './simulation';
import { BeverageInput, type InputSample } from './input';
import { BeverageCompositor } from './compositor';
import { Aftermath } from './aftermath';
import {
  addMaterial,
  initialMaterial,
  materialColor,
  liquidVolume,
  pourPoint,
  pourDuration,
  INGREDIENT_COLORS,
  type DrinkBase,
  type PourIngredient,
} from './mixing';

type Pour = {
  kind: PourIngredient;
  amount: number;
  x: number;
  y: number;
  elapsed: number;
  duration: number;
  from: number[];
  to: number[];
};

export type SceneStatus = 'ready' | 'settling' | 'still';
export interface SceneCallbacks {
  onInteract: () => void;
  onError: (message: string) => void;
  onMetrics?: (message: string) => void;
  onReset?: (base: DrinkBase) => void;
}
export class LatteScene {
  private gpu: GPU | null = null;
  private sim: BeverageSimulation | null = null;
  private input: BeverageInput | null = null;
  private compositor = new BeverageCompositor();
  private frame = 0;
  private disposed = false;
  private abort = new AbortController();
  private observer: ResizeObserver | null = null;
  private previous = 0;
  private aftermath = new Aftermath();
  private motion = this.aftermath.advance(0, []);
  private resize: (() => void) | null = null;
  private disturbed = false;
  private reserveStart = -100;
  private slowFrames = 0;
  private avgMs = 16.67;
  private frameCount = 0;
  private submissionMs = 0;
  private inputObserver?: (sample: InputSample) => void;
  private base: DrinkBase = 'coffee';
  private material = initialMaterial('coffee');
  private pours: Pour[] = [];
  status: SceneStatus = 'still';
  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly photoElement: HTMLImageElement,
    readonly callbacks: SceneCallbacks,
  ) {}
  async start() {
    const assets = await loadAssets();
    await this.photoElement.decode();
    if (this.disposed) return;
    this.gpu = new GPU(this.canvas);
    const texture = this.gpu.texture(assets.liquid ?? assets.scene);
    const { center, radius } = assets.manifest.liquid;
    const crop = assets.liquid
      ? [0, 0, 1, 1]
      : [
          center[0] - radius[0],
          1 - center[1] - radius[1],
          radius[0] * 2,
          radius[1] * 2,
        ];
    const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 700;
    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;
    let quality: Quality =
      memory && memory <= 4 ? 'low' : mobile ? 'mobile' : 'desktop';
    try {
      this.sim = new BeverageSimulation(this.gpu, quality, texture, crop);
    } catch (error) {
      if (quality === 'low') throw error;
      // Retry a smaller allocation in a fresh GPU wrapper, preserving the photograph.
      this.gpu.dispose();
      this.gpu = new GPU(this.canvas);
      quality = 'low';
      this.sim = new BeverageSimulation(
        this.gpu,
        quality,
        this.gpu.texture(assets.liquid ?? assets.scene),
        crop,
      );
    }
    this.sim.reset(materialColor(this.material));
    const resize = () => {
      if (
        this.disposed ||
        !this.sim ||
        !this.gpu ||
        this.gpu.gl.isContextLost()
      )
        return;
      // Photo and clip share a CSS coordinate system. A mobile viewport change
      // cannot leave a separately positioned canvas one layout frame behind.
      const { width, height } = this.canvas.getBoundingClientRect();
      const dpr = Math.min(
        devicePixelRatio || 1,
        config.resolution[this.sim.quality].maxDpr,
      );
      const w = Math.max(1, Math.round(width * dpr)),
        h = Math.max(1, Math.round(height * dpr));
      if (this.canvas.width !== w) this.canvas.width = w;
      if (this.canvas.height !== h) this.canvas.height = h;
      this.compositor.draw(
        this.sim,
        performance.now() / 1000,
        this.disturbed ? 0 : 1,
      );
    };
    this.resize = resize;
    this.observer = new ResizeObserver(resize);
    this.observer.observe(this.canvas);
    window.addEventListener('resize', resize, { signal: this.abort.signal });
    window.visualViewport?.addEventListener('resize', resize, {
      signal: this.abort.signal,
    });
    window.addEventListener('pageshow', resize, { signal: this.abort.signal });
    this.canvas.addEventListener(
      'webglcontextlost',
      (e) => {
        e.preventDefault();
        this.fail('The coffee paused. Reset to try again.');
      },
      { signal: this.abort.signal },
    );
    this.canvas.addEventListener(
      'webglcontextrestored',
      () => {
        this.callbacks.onError('The coffee paused. Reset to try again.');
      },
      { signal: this.abort.signal },
    );
    this.input = new BeverageInput(
      this.canvas,
      this.wake,
      (x, y, s) => {
        if (liquidVolume(this.material) > 0) this.compositor.addRipple(x, y, s);
      },
      () => this.reserve(),
    );
    this.input.observer = this.inputObserver;
    resize();
    this.status = 'ready';
    this.canvas.dataset.ready = 'true';
    this.frame = requestAnimationFrame(this.tick);
  }
  private wake = () => {
    if (!liquidVolume(this.material)) return;
    this.disturbed = true;
    this.status = 'settling';
    this.callbacks.onInteract();
  };
  reserve = () => {
    const reset = this.resetDrink(this.base);
    if (reset) this.callbacks.onReset?.(this.base);
    return reset;
  };
  resetDrink(base: DrinkBase): boolean {
    if (
      !['coffee', 'tea', 'empty'].includes(base) ||
      !this.sim ||
      this.canvas.dataset.ready !== 'true'
    )
      return false;
    this.input?.cancel();
    this.base = base;
    this.material = initialMaterial(base);
    this.pours = [];
    this.compositor.reset();
    this.aftermath.reset();
    this.reserveStart = -100;
    this.disturbed = false;
    this.sim.reset(materialColor(this.material));
    this.status = 'still';
    this.canvas.dataset.state = 'still';
    this.compositor.draw(this.sim, performance.now() / 1000);
    return true;
  }
  pourIngredient(
    kind: PourIngredient,
    amount: number,
    x = 0.42,
    y = 0.55,
  ): boolean {
    if (
      !this.sim ||
      this.canvas.dataset.ready !== 'true' ||
      this.pours.length >= 24
    )
      return false;
    const next = addMaterial(this.material, kind, amount);
    if (!next) return false;
    const firstLiquid = !liquidVolume(this.material) && kind !== 'sugar';
    if (firstLiquid) {
      // The ceramic is the vessel, never a pale pigment to mix into the drink.
      // Filling the first liquid establishes its full base before local plumes.
      this.sim.reset(materialColor(next));
    }
    const [px, py] = pourPoint(x, y);
    const tail = this.pours.at(-1);
    if (tail?.kind === kind) {
      // Continuous same-ingredient input extends the current stream rather
      // than accumulating seconds of animation after the hand has stopped.
      const progress = tail.elapsed / tail.duration;
      tail.from = tail.from.map(
        (value, i) => value + (tail.to[i] - value) * progress,
      );
      tail.duration = Math.max(
        tail.duration - tail.elapsed,
        pourDuration(amount),
      );
      tail.elapsed = 0;
      tail.amount += amount;
      tail.to = materialColor(next);
      tail.x = px;
      tail.y = py;
    } else {
      this.pours.push({
        kind,
        amount,
        x: px,
        y: py,
        elapsed: 0,
        duration: pourDuration(amount),
        from: materialColor(firstLiquid ? next : this.material),
        to: materialColor(next),
      });
    }
    this.material = next;
    this.disturbed = true;
    this.status = 'settling';
    this.callbacks.onInteract();
    return true;
  }
  prod = () => this.input?.prod();
  setInputObserver(observer?: (sample: InputSample) => void) {
    this.inputObserver = observer;
    if (this.input) this.input.observer = observer;
  }
  diagnostics() {
    return {
      ready: this.canvas.dataset.ready === 'true',
      state: this.status,
      quality: this.sim?.quality,
      frameMs: this.avgMs,
      submissionMs: this.submissionMs,
      renderer:
        process.env.NODE_ENV === 'development'
          ? this.gpu?.gl.getParameter(this.gpu.gl.RENDERER)
          : undefined,
      flowSize: this.sim?.flow.read.size,
      pigmentSize: this.sim?.pigment.read.size,
      foamSize: this.sim?.foam.read.size,
      held: this.input?.held ?? false,
      disturbed: this.disturbed,
      serving: this.reserveStart >= 0,
      aftermath: this.motion,
      drink: {
        base: this.base,
        amounts: { ...this.material },
        volume: liquidVolume(this.material),
        pouring: this.pours.length > 0,
      },
    };
  }
  degradeForTest() {
    this.sim?.degrade();
    this.resize?.();
  }
  inspectForTest() {
    if (process.env.NODE_ENV === 'development')
      return this.sim?.inspectForTest();
  }
  private maskTest = false;
  maskForTest(enabled: boolean) {
    if (process.env.NODE_ENV !== 'development' || !this.gpu || !this.sim)
      return;
    this.maskTest = enabled;
    if (enabled) {
      const gl = this.gpu.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(1, 0, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    } else
      this.compositor.draw(
        this.sim,
        performance.now() / 1000,
        this.disturbed ? 0 : 1,
      );
  }
  private fail(message: string) {
    this.canvas.dataset.ready = 'false';
    cancelAnimationFrame(this.frame);
    this.input?.cancel();
    this.callbacks.onError(message);
  }
  private tick = (milliseconds: number) => {
    try {
      this.advanceFrame(milliseconds);
    } catch {
      this.fail('The coffee paused. Reset to try again.');
    }
  };
  private advanceFrame(milliseconds: number) {
    if (this.disposed || !this.sim) return;
    if (this.maskTest) {
      this.frame = requestAnimationFrame(this.tick);
      return;
    }
    const now = milliseconds / 1000;
    const elapsed = this.previous ? now - this.previous : 1 / 60;
    this.previous = now;
    if (!document.hidden) {
      // Cap simulation time instead of performing catch-up passes: doubling GPU
      // work on a late frame creates a feedback slowdown on phones.
      const dt = Math.min(elapsed, 1 / 30);
      const splats = this.input?.consume(dt) ?? [];
      // An empty ceramic well cannot be stirred or dented like a liquid.
      if (!liquidVolume(this.material)) splats.length = 0;
      const pour = this.pours[0];
      if (pour) {
        pour.elapsed = Math.min(pour.duration, pour.elapsed + dt);
        const progress = pour.elapsed / pour.duration;
        const target = pour.from.map(
          (value, i) => value + (pour.to[i] - value) * progress,
        );
        this.sim.setMaterialReference(target);
        const radius =
          pour.kind === 'sugar'
            ? 0.035
            : 0.055 + Math.min(0.08, Math.sqrt(pour.amount / 160) * 0.065);
        this.sim.pour(
          // Water carries no cream-coloured pigment into an existing beverage.
          pour.kind === 'water' ? pour.from : INGREDIENT_COLORS[pour.kind],
          pour.x,
          pour.y,
          radius,
          Math.min(0.7, dt * 16),
          progress * 5,
          pour.kind === 'sugar' || pour.kind === 'water',
        );
        const impulse: Splat = {
          x: pour.x,
          y: pour.y,
          radius: radius * 2.2,
          dx: dt * (0.2 + Math.sin(progress * 8) * 0.09),
          dy: dt * (-0.12 + Math.cos(progress * 5) * 0.06),
          spin: dt * (pour.kind === 'condensed' ? 0.07 : 0.11),
          prod: dt * 0.1,
        };
        if (liquidVolume(this.material)) {
          splats.push(impulse);
          if (
            Math.floor(pour.elapsed * 8) !== Math.floor((pour.elapsed - dt) * 8)
          )
            this.compositor.addRipple(pour.x, pour.y, 0.35);
        }
        if (progress >= 1) this.pours.shift();
      }
      this.motion = this.aftermath.advance(now, splats);
      const active = this.motion.active;
      if (active) {
        const contacts = this.input?.surfaceContacts() ?? [];
        if (process.env.NODE_ENV === 'development') {
          const submissionStart = performance.now();
          this.sim.step(dt, splats, this.motion, contacts);
          this.submissionMs =
            this.submissionMs * 0.9 +
            (performance.now() - submissionStart) * 0.1;
        } else {
          this.sim.step(dt, splats, this.motion, contacts);
        }
        this.compositor.draw(this.sim, now);
      } else if (this.status !== 'still') {
        this.sim.park();
        this.status = 'still';
        this.compositor.draw(this.sim, now, this.disturbed ? 0 : 1);
      }
      if (active && elapsed < 0.1) {
        this.avgMs = this.avgMs * 0.96 + elapsed * 1000 * 0.04;
        this.slowFrames =
          this.avgMs > config.frameBudgetMs
            ? this.slowFrames + 1
            : Math.max(0, this.slowFrames - 2);
        if (
          this.slowFrames > config.degradationFrames &&
          this.sim.quality !== 'low'
        ) {
          this.sim.degrade();
          this.slowFrames = 0;
          this.resize?.();
        }
      }
      if (++this.frameCount % 30 === 0) {
        this.canvas.dataset.state = this.status;
        if (process.env.NODE_ENV === 'development') {
          const label = `${active ? Math.round(1000 / this.avgMs) + ' fps · ' + this.avgMs.toFixed(1) + ' ms' : 'still'} · ${this.sim.quality} · ${this.sim.flow.read.size}/${this.sim.pigment.read.size}`;
          this.callbacks.onMetrics?.(label);
        }
      }
    }
    this.frame = requestAnimationFrame(this.tick);
  }
  dispose() {
    this.disposed = true;
    this.canvas.dataset.ready = 'false';
    cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    this.abort.abort();
    this.input?.dispose();
    this.gpu?.dispose();
  }
}
