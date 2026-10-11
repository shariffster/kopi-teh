import type { InputSample } from './input';
import type { LatteScene } from './scene';

export interface TraceReadout {
  elapsed: string;
  contact: string;
  motion: string;
  engine: string;
}

/** Direction around the cup centre, in the same Y-up coordinates as input. */
export function swirlDirection(s: Pick<InputSample, 'x' | 'y' | 'dx' | 'dy'>) {
  const cross = (s.x - 0.5) * s.dy - (s.y - 0.5) * s.dx;
  const magnitude = Math.hypot(s.x - 0.5, s.y - 0.5) * Math.hypot(s.dx, s.dy);
  if (magnitude < 0.00001 || Math.abs(cross) / magnitude < 0.25)
    return 'straight';
  return cross > 0 ? 'counterclockwise' : 'clockwise';
}

export function inputIntensity(speed: number) {
  return Math.min(1, Math.max(0, speed) / 2);
}

/** Optional, local-only observer. It never injects events or changes the fluid. */
export class InteractionTrace {
  private points: InputSample[] = [];
  private contacts = new Map<number, InputSample>();
  private log: InputSample[] = [];
  private checkpoints: {
    time: number;
    frameMs: number;
    quality: string | undefined;
    state: string;
    resetting: boolean;
    contacts: number;
  }[] = [];
  private lastLog = new Map<number, number>();
  private started = performance.now();
  private lastRelease = -Infinity;
  private frame = 0;
  private lastReadout = 0;
  private context: CanvasRenderingContext2D;
  private observer: ResizeObserver;
  private width = 0;
  private height = 0;
  private truncated = false;
  constructor(
    private overlay: HTMLCanvasElement,
    private surface: HTMLCanvasElement,
    private scene: LatteScene,
    private readout: (data: TraceReadout) => void,
  ) {
    this.context = overlay.getContext('2d')!;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(overlay);
    this.resize();
    scene.setInputObserver(this.receive);
    this.frame = requestAnimationFrame(this.draw);
  }
  private resize() {
    const rect = this.overlay.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.overlay.width = Math.round(rect.width * dpr);
    this.overlay.height = Math.round(rect.height * dpr);
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  private receive = (sample: InputSample) => {
    if (sample.phase === 'up' || sample.phase === 'cancel') {
      this.contacts.delete(sample.id);
      this.lastRelease = sample.time;
    } else this.contacts.set(sample.id, sample);
    if (sample.phase !== 'hold') this.points.push(sample);
    if (this.points.length > 600)
      this.points.splice(0, this.points.length - 600);
    // Keep transitions plus at most 30 motion samples/s per contact, for 12k samples.
    const transition = !['move', 'hold'].includes(sample.phase);
    if (
      transition ||
      sample.time - (this.lastLog.get(sample.id) ?? -Infinity) >= 33
    ) {
      this.lastLog.set(sample.id, sample.time);
      this.log.push({
        ...sample,
        time: Math.round(sample.time - this.started),
      });
      if (this.log.length > 12000) {
        this.log.shift();
        this.truncated = true;
      }
    }
  };
  clear() {
    this.points = [];
    this.log = [];
    this.checkpoints = [];
    this.lastLog.clear();
    this.started = performance.now();
    this.lastRelease = -Infinity;
    this.truncated = false;
  }
  download() {
    const data = {
      format: 'befrothed-input-trace-v1',
      build: '0.2.2',
      recordedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - this.started),
      units: {
        x: 'liquid diameter, left=0',
        y: 'liquid diameter, bottom=0',
        speed: 'liquid diameters/second',
        time: 'ms since trace enabled or cleared',
      },
      note: 'Pointer movement and hold duration only; speed is not measured finger pressure. No audio or screen capture.',
      truncated: this.truncated,
      viewport: {
        width: innerWidth,
        height: innerHeight,
        devicePixelRatio,
      },
      surface: this.surface.getBoundingClientRect().toJSON(),
      scene: this.scene.diagnostics(),
      samples: this.log,
      checkpoints: this.checkpoints,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `Befrothed-Trace-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  private draw = (now: number) => {
    const ctx = this.context;
    ctx.clearRect(0, 0, this.width, this.height);
    this.points = this.points.filter((s) => now - s.time < 1100);
    for (const [id, s] of this.contacts) {
      if (s.phase === 'keyboard' && now - s.time > 350)
        this.contacts.delete(id);
    }
    if (!document.hidden) {
      const surface = this.surface.getBoundingClientRect();
      const root = this.overlay.getBoundingClientRect();
      const point = (s: InputSample) => ({
        x: surface.left - root.left + s.x * surface.width,
        y: surface.top - root.top + (1 - s.y) * surface.height,
      });
      const previous = new Map<number, InputSample>();
      ctx.lineCap = 'round';
      for (const s of this.points) {
        const before = previous.get(s.id);
        if (before && s.phase !== 'down' && s.phase !== 'keyboard') {
          const a = point(before),
            b = point(s);
          const alpha = Math.max(0, 1 - (now - s.time) / 1100) ** 1.5;
          const heat = inputIntensity(s.speed);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = s.inCup
            ? `hsla(${180 - heat * 150},95%,67%,${alpha * 0.68})`
            : `rgba(230,230,230,${alpha * 0.42})`;
          ctx.lineWidth = 1.4 + heat * 0.6;
          ctx.stroke();
        }
        if (s.phase === 'up' || s.phase === 'cancel') {
          previous.delete(s.id);
          const p = point(s),
            age = (now - s.time) / 650;
          if (age < 1) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10 + age * 17, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,255,255,${1 - age})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        } else previous.set(s.id, s);
      }
      let number = 0;
      for (const s of this.contacts.values()) {
        const p = point(s),
          heat = inputIntensity(s.speed);
        const hue = s.inCup ? 180 - heat * 150 : 0;
        const color = s.inCup ? `hsl(${hue},95%,70%)` : '#ddd';
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, s.radius * surface.width, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7 + heat * 3, 0, Math.PI * 2);
        ctx.fillStyle = '#172c32bd';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (s.speed > 0.04) {
          const angle = Math.atan2(-s.dy, s.dx),
            length = 20 + heat * 28;
          const endX = p.x + Math.cos(angle) * length,
            endY = p.y + Math.sin(angle) * length;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(endX, endY);
          ctx.lineTo(
            endX - Math.cos(angle - 0.5) * 8,
            endY - Math.sin(angle - 0.5) * 8,
          );
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - Math.cos(angle + 0.5) * 8,
            endY - Math.sin(angle + 0.5) * 8,
          );
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (s.holdSeconds > 0.18) {
          ctx.beginPath();
          ctx.arc(
            p.x,
            p.y,
            13,
            -Math.PI / 2,
            -Math.PI / 2 +
              Math.min(1, (s.holdSeconds - 0.18) / 1.8) * Math.PI * 2,
          );
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.font = '600 11px system-ui';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#172c32';
        ctx.fillStyle = '#fff';
        const label = `${++number}${s.inCup ? '' : ' · outside'}`;
        ctx.strokeText(label, p.x + 15, p.y - 15);
        ctx.fillText(label, p.x + 15, p.y - 15);
      }
      if (now - this.lastReadout > 200) {
        this.lastReadout = now;
        const d = this.scene.diagnostics();
        this.checkpoints.push({
          time: Math.round(now - this.started),
          frameMs: d.frameMs,
          quality: d.quality,
          state: d.state,
          resetting: d.serving,
          contacts: this.contacts.size,
        });
        if (this.checkpoints.length > 6000) {
          this.checkpoints.shift();
          this.truncated = true;
        }
        const latest = [...this.contacts.values()].sort(
          (a, b) => b.speed - a.speed,
        )[0];
        const holding = latest && latest.holdSeconds > 0.18;
        const age = (now - this.lastRelease) / 1000;
        this.readout({
          elapsed: ((now - this.started) / 1000).toFixed(1) + 's',
          contact: latest
            ? `${latest.pointerType} · ${this.contacts.size} contact${this.contacts.size > 1 ? 's' : ''} · ${latest.inCup ? (holding ? `hold ${latest.holdSeconds.toFixed(1)}s` : latest.phase === 'keyboard' ? 'key impulse' : 'moving') : 'outside cup'}`
            : age < 3
              ? `Released ${age.toFixed(1)}s ago`
              : 'No contact',
          motion: latest
            ? `${latest.speed.toFixed(2)} cup widths/s · ${holding ? 'stationary' : swirlDirection(latest)}`
            : 'Cyan → amber = faster · arrow = direction',
          engine: !d.ready
            ? 'Surface unavailable'
            : `${d.serving ? 'Resetting' : d.held ? 'Interacting' : d.aftermath.active ? `Settling · ${Math.max(0, d.aftermath.duration - d.aftermath.age).toFixed(1)}s` : 'Still'} · ${d.aftermath.active ? '~' + Math.round(1000 / d.frameMs) + ' fps · ' : ''}${d.quality}`,
        });
      }
    }
    this.frame = requestAnimationFrame(this.draw);
  };
  dispose() {
    this.scene.setInputObserver(undefined);
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.contacts.clear();
    this.points = [];
    this.log = [];
    this.checkpoints = [];
    this.context.clearRect(0, 0, this.width, this.height);
  }
}
