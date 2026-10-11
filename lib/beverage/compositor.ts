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
  addRipple(x: number, y: number, strength: number) {
    this.ripples.push({ x, y, born: performance.now() / 1000, strength });
    if (this.ripples.length > 12) this.ripples.shift();
  }
  reset() {
    this.ripples = [];
  }
  draw(
    sim: BeverageSimulation,
    now: number,
    pristineMix = 0,
    displayFill = 1,
    originalStyle = false,
  ) {
    const ripples = new Float32Array(48);
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
      rippleSpeed: config.rippleSpeed,
      rippleDamping: config.rippleDamping,
      edgeGuard: config.edgeGuard,
      pristineMix,
      displayFill,
      originalStyle: originalStyle ? 1 : 0,
      materialRelief: config.materialRelief * (originalStyle ? 1 : 0.25),
      mixedContrast: config.mixedContrast,
      pixel: [1 / sim.flow.read.size, 1 / sim.flow.read.size],
    });
  }
}
