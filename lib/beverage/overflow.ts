import type { Splat } from './config';
import type { MaterialAmounts } from './mixing';

export interface OverflowEvent {
  id: number;
  /** Screen radians: zero is right; pi / 2 is down. */
  angle: number;
  amountMl: number;
  recipe: MaterialAmounts;
  color: readonly number[];
}

/** Only deliberate, sustained native stirring can earn a small spill. */
export class OverflowBudget {
  private energy = 0;
  private events = 0;
  private lastEvent = -Infinity;
  reset() {
    this.energy = 0;
    this.events = 0;
    this.lastEvent = -Infinity;
  }
  advance(
    now: number,
    dt: number,
    fill: number,
    splats: Splat[],
    enabled = true,
  ): number | null {
    if (
      !enabled ||
      fill <= 0.9 ||
      this.events >= 2 ||
      now - this.lastEvent < 6
    ) {
      this.energy = 0;
      return null;
    }
    let force = 0,
      x = 0,
      y = 0;
    for (const s of splats) {
      const radius = Math.hypot(s.x - 0.5, s.y - 0.5);
      if (radius < 0.35 || radius > 0.479) continue;
      const movement = Math.hypot(s.dx, s.dy);
      if (!Number.isFinite(movement)) continue;
      force += movement;
      x += (s.x - 0.5) * movement;
      y += (s.y - 0.5) * movement;
    }
    const rate = force / Math.max(dt, 1 / 240);
    if (rate > 2.5)
      this.energy += Math.min(dt, 0.05) * Math.min(2, (rate - 2.5) / 2);
    else this.energy = Math.max(0, this.energy - dt * 1.2);
    if (this.energy < 0.38 || force === 0) return null;
    this.energy = 0;
    this.events++;
    this.lastEvent = now;
    return Math.atan2(-y, x);
  }
}
