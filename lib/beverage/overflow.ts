import type { Splat } from './config';
import type { MaterialAmounts } from './mixing';

export interface OverflowEvent {
  id: number;
  /** Screen radians: zero is right; pi / 2 is down. */
  angle: number;
  amountMl: number;
  recipe: MaterialAmounts;
  color: readonly number[];
  highWaterFill: number;
  fillBefore: number;
}

/** Outward rim momentum spills more readily when there is less headroom. */
export class OverflowBudget {
  private energy = 0;
  private lastEvent = -Infinity;
  reset() {
    this.energy = 0;
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
      !Number.isFinite(fill) ||
      fill < 0.7 ||
      now - this.lastEvent < 0.7
    ) {
      this.energy = 0;
      return null;
    }
    let force = 0,
      x = 0,
      y = 0;
    for (const s of splats) {
      const rx = s.x - 0.5,
        ry = s.y - 0.5;
      const radius = Math.hypot(rx, ry);
      if (radius < 0.35 || radius > 0.479) continue;
      const outward = (s.dx * rx + s.dy * ry) / radius;
      if (!Number.isFinite(outward) || outward <= 0) continue;
      const impulse = outward * Math.min(1, (radius - 0.35) / 0.07);
      force += impulse;
      x += rx * impulse;
      y += ry * impulse;
    }
    const headroom = Math.max(0, Math.min(1, (1 - fill) / 0.3));
    const threshold = 0.8 + 4 * Math.pow(headroom, 1.3);
    const needed = 0.025 + 0.14 * Math.pow(headroom, 1.6);
    const step = Math.max(1 / 240, Math.min(dt, 0.05));
    const rate = force / step;
    this.energy =
      rate > threshold
        ? this.energy + (rate - threshold) * step
        : Math.max(0, this.energy - step * 0.5);
    if (this.energy < needed || force === 0) return null;
    this.energy = 0;
    this.lastEvent = now;
    return Math.atan2(-y, x);
  }
}
