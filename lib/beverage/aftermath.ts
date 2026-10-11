import { LATTE_CONFIG as config, type Splat } from './config';

/** Finite, force-dependent coasting. It never drives the pristine/idle drink. */
export class Aftermath {
  private last = -Infinity;
  private intensity = 0;
  private previousFade = 0;
  reset() {
    this.last = -Infinity;
    this.intensity = 0;
    this.previousFade = 0;
  }
  advance(now: number, splats: Splat[]) {
    if (splats.length) {
      // Integrated path force distinguishes a prod, one stroke, and repeated stirring.
      const silence = Number.isFinite(this.last)
        ? Math.max(0, now - this.last)
        : 0;
      this.intensity *= Math.exp(-silence * 0.16);
      const force = splats.reduce(
        (sum, s) =>
          sum +
          Math.hypot(s.dx, s.dy) * 0.06 +
          Math.abs(s.spin) * 1.4 +
          Math.abs(s.prod) * 0.2,
        0,
      );
      this.intensity = Math.min(1, this.intensity + force);
      this.last = now;
    }
    const duration =
      config.settling.gentleSeconds +
      (config.settling.vigorousSeconds - config.settling.gentleSeconds) *
        Math.sqrt(this.intensity);
    const age = Math.max(0, now - this.last);
    const progress = Math.min(
      1,
      Math.max(
        0,
        (age - duration + config.settling.fadeSeconds) /
          config.settling.fadeSeconds,
      ),
    );
    const fade = 1 - progress * progress * (3 - 2 * progress);
    // Apply the envelope incrementally to velocity, independent of frame rate.
    // New input can extend coasting without multiplying existing momentum.
    const retention = Math.min(1, fade / Math.max(this.previousFade, 0.000001));
    this.previousFade = fade;
    // Small eddies stop being reinforced soon after release, while the slower
    // velocity envelope preserves the broad swirl. Diffusion damps fine motion
    // without applying additional drag to the entire cup.
    const curlFade =
      fade *
      Math.exp(-Math.max(0, age - 0.08) / config.settling.curlDecaySeconds);
    const viscosity =
      config.viscosity +
      config.settling.detailViscosity * (1 - Math.exp(-age * 0.7));
    return {
      active: age < duration,
      age,
      duration,
      intensity: this.intensity,
      // Smaller strokes lose energy sooner. Confinement and velocity both fade
      // before parking, rather than leaving a self-sustaining curl at the cutoff.
      dissipation:
        config.dissipation + (1 - this.intensity) * 0.2 + (1 - fade) * 3.5,
      fade,
      retention,
      curlFade,
      viscosity,
    };
  }
}
