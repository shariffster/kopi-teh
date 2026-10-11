import { LATTE_CONFIG as config } from './config';
import type { BeverageSimulation } from './simulation';
interface Ripple {
  x: number;
  y: number;
  born: number;
  strength: number;
}
export class BeverageCompositor {
  private ripples: Ripple[] = [];
  private sugar: { x: number; y: number; born: number; radius: number }[] = [];
  private sugarSeed = 0;
  addSugarGrains(x: number, y: number) {
    const now = performance.now() / 1000;
    for (let i = 0; i < 3; i++) {
      const seed = ++this.sugarSeed;
      const angle = seed * 2.399963;
      const scatter = 0.008 + (((seed * 17) % 13) / 13) * 0.03;
      this.sugar.push({
        x: x + Math.cos(angle) * scatter,
        y: y + Math.sin(angle) * scatter,
        born: now,
        radius: 0.0018 + ((seed * 7) % 5) * 0.0002,
      });
    }
    this.sugar = this.sugar.slice(-16);
  }
  addRipple(x: number, y: number, strength: number) {
    this.ripples.push({ x, y, born: performance.now() / 1000, strength });
    if (this.ripples.length > 12) this.ripples.shift();
  }
  reset() {
    this.ripples = [];
    this.sugar = [];
  }
  draw(
    sim: BeverageSimulation,
    now: number,
    pristineMix = 0,
    displayFill = 1,
    originalStyle = false,
    wettingBase = 0,
    pourImpact: number[] = [0.42, 0.55, 0],
  ) {
    const ripples = new Float32Array(48);
    const sugarGrains = new Float32Array(64);
    this.sugar = this.sugar.filter((grain) => now - grain.born < 0.65);
    this.sugar.forEach((grain, i) =>
      sugarGrains.set(
        [grain.x, grain.y, now - grain.born, grain.radius],
        i * 4,
      ),
    );
    this.ripples = this.ripples.filter((r) => now - r.born < 2.5);
    this.ripples.forEach((r, i) =>
      ripples.set(
        [r.x, r.y, now - r.born, r.strength * config.rippleStrength],
        i * 4,
      ),
    );
    sim.gpu.draw(sim.programs.COMPOSITE, null, {
      pigment: sim.pigment.read.texture,
      foamSurface: sim.foam.read.texture,
      foamPixel: [1 / sim.foam.read.size, 1 / sim.foam.read.size],
      foamRelief: config.foam.relief,
      foamPresence: originalStyle ? config.foam.presence : 0,
      velocity: sim.flow.read.texture,
      pristine: sim.photo,
      currentMean: sim.meanTexture,
      crop: sim.crop,
      ripples,
      sugarGrains,
      rippleSpeed: config.rippleSpeed,
      rippleDamping: config.rippleDamping,
      edgeGuard: config.edgeGuard,
      pristineMix,
      displayFill,
      wettingBase,
      pourImpact,
      originalStyle: originalStyle ? 1 : 0,
      materialRelief: config.materialRelief * (originalStyle ? 1 : 0.25),
      mixedContrast: config.mixedContrast,
      pixel: [1 / sim.flow.read.size, 1 / sim.flow.read.size],
    });
  }
}
