import {
  LATTE_CONFIG as config,
  type Splat,
  type SurfaceContact,
} from './config';
interface Contact {
  pointerType: string;
  dx: number;
  dy: number;
  speed: number;
  x: number;
  y: number;
  time: number;
  stillSince: number;
  radius: number;
}
export interface InputSample {
  id: number;
  pointerType: string;
  phase: 'down' | 'move' | 'hold' | 'up' | 'cancel' | 'keyboard';
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  radius: number;
  inCup: boolean;
  holdSeconds: number;
  time: number;
}
export class BeverageInput {
  observer?: (sample: InputSample) => void;
  private contacts = new Map<number, Contact>();
  private queue: Splat[] = [];
  private abort = new AbortController();
  private keyboardAngle = 0;
  constructor(
    readonly canvas: HTMLCanvasElement,
    private wake: () => void,
    private ripple: (x: number, y: number, strength: number) => void,
    private reserve: () => void,
  ) {
    const options = { signal: this.abort.signal };
    canvas.addEventListener('pointerdown', this.down, options);
    canvas.addEventListener('pointermove', this.move, options);
    canvas.addEventListener('pointerup', this.up, options);
    canvas.addEventListener('pointercancel', this.up, options);
    canvas.addEventListener('lostpointercapture', this.up, options);
    canvas.addEventListener(
      'pointerleave',
      () => canvas.classList.remove('is-over'),
      options,
    );
    canvas.addEventListener('keydown', this.key, options);
    window.addEventListener('blur', this.cancel, options);
    document.addEventListener('visibilitychange', this.cancel, options);
  }
  private point(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width,
      y: 1 - (e.clientY - r.top) / r.height,
    };
  }
  private inside(p: { x: number; y: number }) {
    return Math.hypot(p.x - 0.5, p.y - 0.5) < 0.479;
  }
  private report(id: number, c: Contact, phase: InputSample['phase']) {
    // No sample allocation or retained gesture history when Trace is off.
    if (!this.observer) return;
    const now = performance.now();
    const holdSeconds = Math.max(0, (now - c.stillSince) / 1000);
    this.observer({
      id,
      pointerType: c.pointerType,
      phase,
      x: c.x,
      y: c.y,
      dx: c.dx,
      dy: c.dy,
      speed: holdSeconds > 0.12 ? 0 : c.speed,
      radius:
        phase === 'down'
          ? c.radius
          : holdSeconds > 0.18
            ? c.radius * 1.5
            : c.radius * (1 + Math.min(c.speed * 0.12, 0.22)),
      inCup: this.inside(c),
      holdSeconds,
      time: now,
    });
  }
  private down = (e: PointerEvent) => {
    if (e.button !== 0 || this.contacts.size >= 2) return;
    const p = this.point(e);
    if (!this.inside(p)) return;
    e.preventDefault();
    if (e.isTrusted) this.canvas.setPointerCapture(e.pointerId);
    const radius =
      e.pointerType === 'touch' ? config.touchRadius : config.radius;
    this.contacts.set(e.pointerId, {
      ...p,
      time: e.timeStamp,
      stillSince: performance.now(),
      radius,
      pointerType: e.pointerType,
      dx: 0,
      dy: 0,
      speed: 0,
    });
    this.report(e.pointerId, this.contacts.get(e.pointerId)!, 'down');
    this.queue.push({ ...p, dx: 0, dy: 0, radius, spin: 0, prod: 0.03 });
    this.ripple(p.x, p.y, 1);
    this.wake();
    this.canvas.classList.add('is-dragging');
  };
  private move = (e: PointerEvent) => {
    const p = this.point(e);
    this.canvas.classList.toggle('is-over', this.inside(p));
    const contact = this.contacts.get(e.pointerId);
    if (!contact) return;
    e.preventDefault();
    // Coalesced events preserve curved strokes on fast touch hardware.
    const samples =
      typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    for (const sample of samples.length ? samples : [e]) {
      const next = this.point(sample);
      const dt = Math.max((sample.timeStamp - contact.time) / 1000, 0.004);
      const dx = next.x - contact.x,
        dy = next.y - contact.y;
      const distance = Math.hypot(dx, dy),
        speed = distance / dt;
      const steps = Math.min(
        8,
        Math.max(1, Math.ceil(distance / (contact.radius * 0.45))),
      );
      const gain = config.force * 5 * (1 + Math.min(speed * speed, 9) * 0.7);
      for (let i = 1; i <= steps; i++) {
        const q = {
          x: contact.x + (dx * i) / steps,
          y: contact.y + (dy * i) / steps,
        };
        if (this.inside(q))
          this.queue.push({
            ...q,
            dx: (dx / steps) * gain,
            dy: (dy / steps) * gain,
            radius: contact.radius * (1 + Math.min(speed * 0.12, 0.22)),
            spin: 0,
            prod: 0,
          });
      }
      if (distance > 0.035 && this.inside(next))
        this.ripple(next.x, next.y, Math.min(speed * 0.3, 0.65));
      contact.x = next.x;
      contact.y = next.y;
      contact.time = sample.timeStamp;
      contact.dx = dx;
      contact.dy = dy;
      contact.speed = speed;
      if (distance > 0.0004) contact.stillSince = performance.now();
      this.report(e.pointerId, contact, 'move');
    }
    this.wake();
  };
  private up = (e: PointerEvent) => {
    const c = this.contacts.get(e.pointerId);
    if (c)
      this.report(e.pointerId, c, e.type === 'pointerup' ? 'up' : 'cancel');
    this.contacts.delete(e.pointerId);
    if (this.canvas.hasPointerCapture(e.pointerId))
      this.canvas.releasePointerCapture(e.pointerId);
    if (!this.contacts.size) this.canvas.classList.remove('is-dragging');
  };
  private key = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      this.reserve();
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      this.prod();
      return;
    }
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key))
      return;
    e.preventDefault();
    const sign = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 1;
    this.keyboardAngle += sign * 0.25;
    const x = 0.5 + Math.cos(this.keyboardAngle) * 0.2,
      y = 0.5 + Math.sin(this.keyboardAngle) * 0.2;
    this.observer?.({
      id: -1,
      pointerType: 'keyboard',
      phase: 'keyboard',
      x,
      y,
      dx: -Math.sin(this.keyboardAngle) * sign,
      dy: Math.cos(this.keyboardAngle) * sign,
      speed: 0,
      radius: 0.09,
      inCup: true,
      holdSeconds: 0,
      time: performance.now(),
    });
    this.queue.push({
      x,
      y,
      dx: -Math.sin(this.keyboardAngle) * sign * 0.3,
      dy: Math.cos(this.keyboardAngle) * sign * 0.3,
      radius: 0.09,
      spin: sign * 0.035,
      prod: 0,
    });
    this.wake();
  };
  prod(x = 0.5, y = 0.5) {
    this.observer?.({
      id: -1,
      pointerType: 'keyboard',
      phase: 'keyboard',
      x,
      y,
      dx: 0,
      dy: 0,
      speed: 0,
      radius: config.radius,
      inCup: true,
      holdSeconds: 0,
      time: performance.now(),
    });
    this.queue.push({
      x,
      y,
      dx: 0,
      dy: 0,
      radius: config.radius,
      spin: 0,
      prod: 0.03,
    });
    this.ripple(x, y, 1);
    this.wake();
  }
  get held() {
    return this.contacts.size > 0;
  }
  surfaceContacts(): SurfaceContact[] {
    const now = performance.now();
    const surface: SurfaceContact[] = [];
    for (const c of this.contacts.values()) {
      if (!this.inside(c)) continue;
      const speed = now - c.stillSince > 120 ? 0 : c.speed;
      const length = Math.hypot(c.dx, c.dy);
      const direction = Math.min(1, speed / 0.25) / Math.max(length, 0.00001);
      surface.push({
        x: c.x,
        y: c.y,
        radius: c.radius * (1 + Math.min(speed * 0.12, 0.22)),
        directionX: c.dx * direction,
        directionY: c.dy * direction,
      });
    }
    return surface;
  }
  consume(dt: number) {
    // Cap the per-pass uniform budget without discarding integrated stroke force.
    const pending = this.queue.splice(0);
    const result: Splat[] = [];
    const chunk = Math.max(1, Math.ceil(pending.length / 14));
    for (let i = 0; i < pending.length; i += chunk) {
      const samples = pending.slice(i, i + chunk),
        mid = samples[Math.floor(samples.length / 2)];
      result.push({
        ...mid,
        dx: samples.reduce((s, p) => s + p.dx, 0),
        dy: samples.reduce((s, p) => s + p.dy, 0),
      });
    }
    for (const [id, c] of this.contacts) {
      this.report(id, c, 'hold');
      if (!this.inside(c)) continue;
      const ramp = Math.min(
        1,
        Math.max(
          0,
          (performance.now() - c.stillSince - 180) /
            1000 /
            config.holdRampSeconds,
        ),
      );
      result.push({
        x: c.x,
        y: c.y,
        dx: 0,
        dy: 0,
        radius: c.radius * 1.5,
        spin: config.holdVortex * dt * ramp * 3,
        prod: 0,
      });
      this.wake();
    }
    return result;
  }
  cancel = () => {
    for (const [id, c] of this.contacts) {
      this.report(id, c, 'cancel');
      if (this.canvas.hasPointerCapture(id))
        this.canvas.releasePointerCapture(id);
    }
    this.contacts.clear();
    this.queue = [];
    this.canvas.classList.remove('is-dragging');
  };
  dispose() {
    this.cancel();
    this.abort.abort();
  }
}
