import { loadAssets } from './assets';
import { LATTE_CONFIG as config, type Quality, type Splat } from './config';
import { GPU } from './gpu';
import { BeverageSimulation } from './simulation';
import { BeverageInput, type InputSample } from './input';
import { BeverageCompositor } from './compositor';
import { Aftermath } from './aftermath';
import { OverflowBudget, type OverflowEvent } from './overflow';
export type { OverflowEvent } from './overflow';
import {
  addMaterial,
  removeLiquid,
  initialMaterial,
  materialColor,
  liquidVolume,
  pourPoint,
  pourDuration,
  INGREDIENT_COLORS,
  POUR_PROFILES,
  type DrinkBase,
  type PourIngredient,
  type MaterialAmounts,
} from './mixing';

type Pour = {
  kind: PourIngredient;
  amount: number;
  x: number;
  y: number;
  elapsed: number;
  age: number;
  arrival: number;
  seed?: number[];
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
  onResetRequest?: () => void;
  onOverflow?: (event: OverflowEvent) => void;
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
  private overflow = new OverflowBudget();
  private overflowId = 0;
  private originalStyle = true;
  private displayVolume = 140;
  private visualFill = 1;
  private originalRise: { started: number; duration: number } | null = null;
  private transition: {
    started: number;
    duration: number;
    fromVolume: number;
    fromFill: number;
    resolve: (completed: boolean) => void;
  } | null = null;
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
    this.sim.resetOriginal();
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
      this.present(performance.now() / 1000);
    };
    this.resize = resize;
    this.observer = new ResizeObserver(resize);
    this.observer.observe(this.canvas);
    window.addEventListener('resize', resize, { signal: this.abort.signal });
    window.visualViewport?.addEventListener('resize', resize, {
      signal: this.abort.signal,
    });
    window.addEventListener('pageshow', resize, { signal: this.abort.signal });
    document.addEventListener(
      'visibilitychange',
      () => {
        if (!document.hidden) return;
        if (this.transition) {
          const transition = this.transition;
          this.transition = null;
          this.resetDrink('empty');
          transition.resolve(true);
        }
        if (this.originalRise) {
          this.originalRise = null;
          this.displayVolume = liquidVolume(this.material);
          this.visualFill = 1;
        }
      },
      { signal: this.abort.signal },
    );
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
    this.input.onFrothDraw = this.shapeFroth;
    resize();
    this.status = 'ready';
    this.canvas.dataset.ready = 'true';
    this.frame = requestAnimationFrame(this.tick);
  }
  private wake = () => {
    if (!liquidVolume(this.material) || this.transition) return;
    this.disturbed = true;
    this.status = 'settling';
    this.callbacks.onInteract();
  };
  reserve = () => {
    if (this.callbacks.onResetRequest) {
      this.callbacks.onResetRequest();
      return true;
    }
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
    this.cancelTransition();
    this.input?.cancel();
    this.overflow.reset();
    this.base = base;
    this.material = initialMaterial(base);
    this.pours = [];
    this.compositor.reset();
    this.aftermath.reset();
    this.reserveStart = -100;
    this.disturbed = false;
    this.originalStyle = false;
    this.displayVolume = liquidVolume(this.material);
    this.visualFill = Math.min(1, this.displayVolume / 300);
    this.sim.reset(materialColor(this.material));
    this.status = 'still';
    this.canvas.dataset.state = 'still';
    this.present(performance.now() / 1000);
    return true;
  }
  restoreOriginal(recipe: MaterialAmounts, animate = false): boolean {
    if (
      !this.sim ||
      this.canvas.dataset.ready !== 'true' ||
      Object.keys(INGREDIENT_COLORS).some((key) => {
        const value = recipe[key as PourIngredient];
        return !Number.isFinite(value) || value < 0;
      }) ||
      liquidVolume(recipe) <= 0 ||
      liquidVolume(recipe) > 300 ||
      recipe.sugar > 30
    )
      return false;
    this.cancelTransition();
    this.input?.cancel();
    this.overflow.reset();
    this.material = { ...recipe };
    this.base = recipe.tea > recipe.coffee ? 'tea' : 'coffee';
    this.pours = [];
    this.compositor.reset();
    this.aftermath.reset();
    this.disturbed = false;
    this.originalStyle = true;
    const rise = animate && !document.hidden;
    this.displayVolume = rise ? 0 : liquidVolume(recipe);
    // The inherited finished photograph is a full presentation, independent
    // of its illustrative recipe. New cups use the visible capacity model.
    this.visualFill = rise ? 0 : 1;
    this.originalRise = rise
      ? {
          started: performance.now() / 1000,
          duration: matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 0.1
            : 0.4,
        }
      : null;
    this.sim.resetOriginal();
    this.status = 'still';
    this.canvas.dataset.state = 'still';
    this.present(performance.now() / 1000);
    return true;
  }
  transitionToEmpty(): Promise<boolean> {
    if (!this.sim || this.disposed || this.canvas.dataset.ready !== 'true')
      return Promise.resolve(false);
    this.cancelTransition();
    this.input?.cancel();
    this.pours = [];
    if (this.displayVolume < 0.05 || document.hidden) {
      return Promise.resolve(this.resetDrink('empty'));
    }
    this.status = 'settling';
    return new Promise((resolve) => {
      this.transition = {
        started: performance.now() / 1000,
        duration: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 0.1
          : 0.48,
        fromVolume: this.displayVolume,
        fromFill: this.visualFill,
        resolve,
      };
    });
  }
  private cancelTransition() {
    this.transition?.resolve(false);
    this.transition = null;
    this.originalRise = null;
  }
  private present(now: number) {
    if (!this.sim) return;
    this.compositor.draw(
      this.sim,
      now,
      this.disturbed ? 0 : 1,
      this.visualFill,
      this.originalStyle,
    );
  }
  setFrothDrawing(enabled: boolean) {
    if (!this.input) return;
    this.input.cancel();
    this.input.frothDrawing = enabled;
  }
  shapeFroth = (x: number, y: number): boolean => {
    if (!this.canShapeFroth() || !Number.isFinite(x) || !Number.isFinite(y))
      return false;
    const fill = Math.max(0, Math.min(1, this.visualFill));
    const poolRadius = 0.1 + 0.4 * Math.pow(fill, 0.55);
    const centreY = 0.5 - 0.042 * (1 - fill);
    if (
      Math.hypot(x - 0.5, (y - centreY) * (1 + 0.1 * (1 - fill))) >
      poolRadius - 0.008
    )
      return false;
    this.sim!.shapeFroth(x, y);
    this.disturbed = true;
    this.present(performance.now() / 1000);
    return true;
  };
  applyFrothDesign(design: 'heart' | 'rosetta'): boolean {
    if (!this.canShapeFroth() || !['heart', 'rosetta'].includes(design))
      return false;
    const fill = Math.max(0, Math.min(1, this.visualFill));
    const poolRadius = 0.1 + 0.4 * Math.pow(fill, 0.55);
    this.sim!.shapeFroth(
      0.5,
      0.5 - 0.042 * (1 - fill),
      design === 'heart' ? 1 : 2,
      (poolRadius / 0.5) * 0.9,
    );
    this.disturbed = true;
    this.present(performance.now() / 1000);
    return true;
  }
  private canShapeFroth() {
    return !!(
      this.sim &&
      this.canvas.dataset.ready === 'true' &&
      !this.transition &&
      liquidVolume(this.material) > 0 &&
      this.material.condensed + this.material.evaporated > 0
    );
  }
  pourIngredient(
    kind: PourIngredient,
    amount: number,
    x = 0.42,
    y = 0.55,
  ): boolean {
    if (
      !this.sim ||
      this.transition ||
      this.canvas.dataset.ready !== 'true' ||
      this.pours.length >= 24
    )
      return false;
    const next = addMaterial(this.material, kind, amount);
    if (!next) return false;
    const firstLiquid = !liquidVolume(this.material) && kind !== 'sugar';
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
        pourDuration(amount, kind),
      );
      tail.elapsed = 0;
      // A longer hold extends one flow; it must not widen into a cumulative blob.
      tail.amount = Math.max(tail.amount, amount);
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
        age: 0,
        arrival: 0.12,
        seed: firstLiquid ? materialColor(next) : undefined,
        duration: pourDuration(amount, kind),
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
        activePour: this.pours[0]?.kind ?? null,
        displayVolume: this.displayVolume,
        transitioning: this.transition !== null || this.originalRise !== null,
        originalSurface: this.originalStyle,
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
    } else this.present(performance.now() / 1000);
  }
  private fail(message: string) {
    this.canvas.dataset.ready = 'false';
    cancelAnimationFrame(this.frame);
    this.input?.cancel();
    this.cancelTransition();
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
    let volumeChanged = false;
    if (this.transition) {
      const transition = this.transition;
      const progress = Math.min(
        1,
        (now - transition.started) / transition.duration,
      );
      const eased = 1 - Math.pow(1 - progress, 3);
      this.displayVolume = transition.fromVolume * (1 - eased);
      this.visualFill = transition.fromFill * (1 - eased);
      volumeChanged = true;
      if (progress >= 1) {
        this.transition = null;
        this.resetDrink('empty');
        transition.resolve(true);
      }
    } else if (this.originalRise) {
      const progress = Math.min(
        1,
        (now - this.originalRise.started) / this.originalRise.duration,
      );
      const eased = 1 - Math.pow(1 - progress, 3);
      this.displayVolume = liquidVolume(this.material) * eased;
      this.visualFill = eased;
      volumeChanged = true;
      if (progress >= 1) this.originalRise = null;
    } else {
      const arriving =
        this.pours[0] && this.pours[0].age < this.pours[0].arrival;
      const targetVolume = arriving
        ? this.displayVolume
        : liquidVolume(this.material);
      if (Math.abs(this.displayVolume - targetVolume) > 0.03) {
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.displayVolume +=
          (targetVolume - this.displayVolume) *
          (1 - Math.exp(-Math.min(elapsed, 0.1) * (reduced ? 45 : 12)));
        volumeChanged = true;
      } else if (this.displayVolume !== targetVolume) {
        this.displayVolume = targetVolume;
        volumeChanged = true;
      }
      this.visualFill = this.originalStyle
        ? 1
        : Math.min(1, this.displayVolume / 300);
    }
    if (!document.hidden) {
      // Cap simulation time instead of performing catch-up passes: doubling GPU
      // work on a late frame creates a feedback slowdown on phones.
      const dt = Math.min(elapsed, 1 / 30);
      const splats = this.input?.consume(dt) ?? [];
      // An empty ceramic well cannot be stirred or dented like a liquid.
      if (!liquidVolume(this.material) || this.transition) splats.length = 0;
      // Read only native input here, before material-pour impulses are appended.
      const spillAngle = this.overflow.advance(
        now,
        dt,
        this.visualFill,
        splats,
        !!this.callbacks.onOverflow &&
          !this.transition &&
          !this.originalRise &&
          this.pours.length === 0 &&
          liquidVolume(this.material) >= 3,
      );
      if (spillAngle !== null) {
        const remaining = removeLiquid(this.material, 3);
        if (remaining) {
          const color = materialColor(this.material);
          this.material = remaining;
          this.callbacks.onOverflow?.({
            id: ++this.overflowId,
            angle: spillAngle,
            amountMl: 3,
            recipe: { ...remaining },
            color,
          });
        }
      }
      const pour = this.pours[0];
      if (pour) {
        pour.age += dt;
      }
      if (pour && pour.age >= pour.arrival) {
        if (pour.seed) {
          this.sim.reset(pour.seed);
          pour.seed = undefined;
        }
        pour.elapsed = Math.min(pour.duration, pour.elapsed + dt);
        const progress = pour.elapsed / pour.duration;
        const profile = POUR_PROFILES[pour.kind];
        const entry = Math.min(1, (pour.age - pour.arrival) / 0.13);
        const exit = Math.min(1, (pour.duration - pour.elapsed) / 0.16);
        const envelope = Math.max(0, entry * entry * (3 - 2 * entry) * exit);
        const target = pour.from.map(
          (value, i) => value + (pour.to[i] - value) * progress,
        );
        // The photographic starting cup already owns its measured pigment
        // mean. A sugar touch must not tint it toward a recipe colour model.
        if (!this.originalStyle && pour.kind !== 'sugar')
          this.sim.setMaterialReference(target);
        const radius =
          profile.radius +
          Math.min(0.016, Math.sqrt(pour.amount / 160) * 0.012);
        if (pour.kind !== 'sugar')
          this.sim.pour(
            // Water carries no cream-coloured pigment into an existing beverage.
            pour.kind === 'water' ? pour.from : INGREDIENT_COLORS[pour.kind],
            pour.x,
            pour.y,
            radius,
            Math.min(0.22, dt * profile.pigment * envelope),
            pour.age * 1.6,
            pour.kind === 'water',
            this.originalStyle,
            profile.viscosity,
          );
        const impulse: Splat = {
          x: pour.x,
          y: pour.y,
          radius: radius * 2.4,
          dx:
            dt *
            profile.force *
            envelope *
            (0.8 + Math.sin(pour.age * 2.8) * 0.1),
          dy: -dt * profile.force * envelope * 0.46,
          spin: dt * profile.spin * envelope,
          prod: pour.kind === 'sugar' ? 0 : dt * 0.004 * envelope,
        };
        if (liquidVolume(this.material)) {
          splats.push(impulse);
          if (Math.floor(pour.age * 3) !== Math.floor((pour.age - dt) * 3))
            this.compositor.addRipple(
              pour.x,
              pour.y,
              profile.ripple * envelope,
            );
          if (
            pour.kind === 'sugar' &&
            Math.floor(pour.age * 10) !== Math.floor((pour.age - dt) * 10)
          )
            this.compositor.addSugarGrains(pour.x, pour.y);
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
        this.present(now);
      } else if (this.status !== 'still') {
        this.sim.park();
        this.status = 'still';
        this.present(now);
      }
      if (volumeChanged && !active) this.present(now);
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
    this.cancelTransition();
    this.canvas.dataset.ready = 'false';
    cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    this.abort.abort();
    this.input?.dispose();
    this.gpu?.dispose();
  }
}
