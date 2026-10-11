import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const dataModule = (source) =>
  'data:text/javascript;base64,' +
  Buffer.from(
    ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    }).outputText,
  ).toString('base64');
const config = dataModule(
  await readFile(new URL('../lib/beverage/config.ts', import.meta.url), 'utf8'),
);
const inputSource = (
  await readFile(new URL('../lib/beverage/input.ts', import.meta.url), 'utf8')
).replace("'./config'", JSON.stringify(config));
const { BeverageInput } = await import(dataModule(inputSource));
const { swirlDirection } = await import(
  dataModule(
    await readFile(
      new URL('../lib/beverage/interaction-trace.ts', import.meta.url),
      'utf8',
    ),
  )
);
test('trace directions match the screen after converting from Y-up input', () => {
  assert.equal(
    swirlDirection({ x: 0.8, y: 0.5, dx: 0, dy: 0.1 }),
    'counterclockwise',
  );
  assert.equal(swirlDirection({ x: 0.5, y: 0.8, dx: 0.1, dy: 0 }), 'clockwise');
  assert.equal(swirlDirection({ x: 0.8, y: 0.5, dx: 0.1, dy: 0 }), 'straight');
  assert.equal(swirlDirection({ x: 0.5, y: 0.5, dx: 0, dy: 0 }), 'straight');
});
class Canvas extends EventTarget {
  classes = new Set();
  classList = {
    add: (s) => this.classes.add(s),
    remove: (s) => this.classes.delete(s),
    toggle: (s, v) => (v ? this.classes.add(s) : this.classes.delete(s)),
  };
  getBoundingClientRect() {
    return { left: 100, top: 100, width: 400, height: 400 };
  }
  hasPointerCapture() {
    return false;
  }
  releasePointerCapture() {}
  setPointerCapture() {}
}
function harness() {
  globalThis.window = new EventTarget();
  globalThis.document = new EventTarget();
  const canvas = new Canvas();
  let wakes = 0,
    ripples = 0,
    reserves = 0;
  const input = new BeverageInput(
    canvas,
    () => wakes++,
    () => ripples++,
    () => reserves++,
  );
  const fire = (type, x, y, time, pointerType = 'mouse', pointerId = 4) => {
    const e = new Event(type, { cancelable: true });
    Object.defineProperties(
      e,
      Object.fromEntries(
        Object.entries({
          clientX: 100 + x * 400,
          clientY: 100 + (1 - y) * 400,
          timeStamp: time,
          pointerId,
          pointerType,
          button: 0,
        }).map(([key, value]) => [key, { value }]),
      ),
    );
    canvas.dispatchEvent(e);
    return e;
  };
  return { canvas, input, fire, counts: () => ({ wakes, ripples, reserves }) };
}
test('outside the liquid never captures or injects force', () => {
  const h = harness();
  h.fire('pointerdown', 0.99, 0.99, 0);
  h.fire('pointermove', 0.5, 0.5, 16);
  assert.equal(h.input.held, false);
  assert.equal(h.input.consume(1 / 60).length, 0);
  assert.equal(h.counts().wakes, 0);
  h.input.dispose();
});
test('equal-length fast strokes inject more force than slow strokes', () => {
  const force = (ms) => {
    const h = harness();
    h.fire('pointerdown', 0.4, 0.5, 0);
    h.input.consume(1 / 60);
    h.fire('pointermove', 0.5, 0.5, ms);
    h.fire('pointerup', 0.5, 0.5, ms + 1);
    const impulse = h.input
      .consume(1 / 60)
      .reduce((sum, s) => sum + Math.hypot(s.dx, s.dy), 0);
    h.input.dispose();
    return impulse;
  };
  assert.ok(force(25) > force(700) * 2);
});
test('touch has a wider footprint and pointer cancel prevents stuck stirring', () => {
  const mouse = harness();
  mouse.fire('pointerdown', 0.5, 0.5, 0);
  const rm = mouse.input.consume(1 / 60)[0].radius;
  mouse.input.dispose();
  const touch = harness();
  touch.fire('pointerdown', 0.5, 0.5, 0, 'touch');
  const rt = touch.input.consume(1 / 60)[0].radius;
  assert.ok(rt > rm);
  assert.equal(touch.counts().ripples, 1);
  touch.fire('pointercancel', 0.5, 0.5, 50, 'touch');
  assert.equal(touch.input.held, false);
  assert.equal(touch.input.consume(1 / 60).length, 0);
  touch.input.dispose();
});
test('a long fast stroke stays within the per-pass uniform budget', () => {
  const h = harness();
  h.fire('pointerdown', 0.15, 0.5, 0);
  h.input.consume(1 / 60);
  for (let i = 1; i <= 50; i++)
    h.fire('pointermove', 0.15 + (0.7 * i) / 50, 0.5, i * 2);
  h.fire('pointerup', 0.85, 0.5, 101);
  const splats = h.input.consume(1 / 60);
  assert.ok(splats.length <= 16);
  assert.ok(splats.reduce((sum, s) => sum + s.dx, 0) > 1);
  h.input.dispose();
});
test('blur releases all contacts and teardown removes input listeners', () => {
  const h = harness();
  h.fire('pointerdown', 0.5, 0.5, 0);
  window.dispatchEvent(new Event('blur'));
  assert.equal(h.input.held, false);
  h.input.dispose();
  const before = h.counts().wakes;
  h.fire('pointerdown', 0.5, 0.5, 100);
  assert.equal(h.counts().wakes, before);
});
test('a moving contact does not inherit the stationary hold vortex', (t) => {
  let now = 0;
  t.mock.method(performance, 'now', () => now);
  const h = harness();
  h.fire('pointerdown', 0.4, 0.5, 0, 'touch');
  h.input.consume(1 / 60);
  now = 1500;
  h.fire('pointermove', 0.45, 0.5, now, 'touch');
  assert.ok(h.input.consume(1 / 60).every((s) => s.spin === 0));
  now = 3500;
  assert.ok(h.input.consume(1 / 60).some((s) => s.spin > 0));
  h.input.dispose();
});

test('trace observes the actual path without changing injected force', () => {
  const run = (observe) => {
    const h = harness(),
      samples = [];
    if (observe) h.input.observer = (s) => samples.push(s);
    h.fire('pointerdown', 0.35, 0.5, 0, 'touch');
    h.fire('pointermove', 0.45, 0.6, 60, 'touch');
    h.fire('pointermove', 0.65, 0.55, 100, 'touch');
    h.fire('pointerup', 0.65, 0.55, 110, 'touch');
    const force = h.input.consume(1 / 60);
    h.input.dispose();
    return { force, samples };
  };
  const off = run(false),
    on = run(true);
  assert.deepEqual(on.force, off.force);
  assert.deepEqual(
    on.samples.map((s) => s.phase),
    ['down', 'move', 'move', 'up'],
  );
  assert.equal(on.samples[1].x, 0.45);
  assert.equal(on.samples[1].y, 0.6);
  assert.ok(on.samples[2].speed > on.samples[1].speed);
});

test('trace marks captured motion outside the cup and cancellation', () => {
  const h = harness(),
    samples = [];
  h.input.observer = (s) => samples.push(s);
  h.fire('pointerdown', 0.5, 0.5, 0);
  h.fire('pointermove', 1.1, 0.5, 60);
  window.dispatchEvent(new Event('blur'));
  assert.equal(samples[1].inCup, false);
  assert.equal(samples.at(-1).phase, 'cancel');
  assert.equal(h.input.held, false);
  const count = samples.length;
  h.input.observer = undefined;
  h.fire('pointerdown', 0.5, 0.5, 100);
  assert.equal(samples.length, count);
  h.input.dispose();
});

test('stationary contact trace reports zero speed and elapsed hold', (t) => {
  let now = 0;
  t.mock.method(performance, 'now', () => now);
  const h = harness(),
    samples = [];
  h.input.observer = (s) => samples.push(s);
  h.fire('pointerdown', 0.4, 0.5, 0);
  now = 50;
  h.fire('pointermove', 0.5, 0.5, now);
  now = 1250;
  h.input.consume(1 / 60);
  assert.equal(samples.at(-1).speed, 0);
  assert.equal(samples.at(-1).holdSeconds, 1.2);
  h.input.dispose();
});

test('surface dent follows the contact and loses direction when held still', (t) => {
  let now = 0;
  t.mock.method(performance, 'now', () => now);
  const h = harness();
  h.fire('pointerdown', 0.4, 0.5, now, 'touch');
  assert.equal(h.input.surfaceContacts()[0].directionX, 0);
  now = 50;
  h.fire('pointermove', 0.5, 0.6, now, 'touch');
  const moving = h.input.surfaceContacts()[0];
  assert.equal(moving.x, 0.5);
  assert.equal(moving.y, 0.6);
  assert.ok(moving.directionX > 0 && moving.directionY > 0);
  assert.ok(
    Math.abs(Math.hypot(moving.directionX, moving.directionY) - 1) < 1e-6,
  );
  now = 200;
  const held = h.input.surfaceContacts()[0];
  assert.equal(held.x, moving.x);
  assert.equal(held.y, moving.y);
  assert.equal(held.directionX, 0);
  assert.equal(held.directionY, 0);
  h.fire('pointerup', 0.5, 0.6, now, 'touch');
  assert.deepEqual(h.input.surfaceContacts(), []);
  h.input.dispose();
});

test('surface dent disappears outside the cup and resumes on reentry', () => {
  const h = harness();
  h.fire('pointerdown', 0.5, 0.5, 0);
  h.fire('pointermove', 1.1, 0.5, 60);
  assert.deepEqual(h.input.surfaceContacts(), []);
  h.fire('pointermove', 0.7, 0.5, 100);
  assert.equal(h.input.surfaceContacts()[0].x, 0.7);
  h.fire('pointercancel', 0.7, 0.5, 110);
  assert.deepEqual(h.input.surfaceContacts(), []);
  h.input.dispose();
});

test('two fingers produce two independent dents and blur releases both', () => {
  const h = harness();
  h.fire('pointerdown', 0.3, 0.5, 0, 'touch', 1);
  h.fire('pointerdown', 0.7, 0.5, 0, 'touch', 2);
  h.fire('pointerdown', 0.5, 0.5, 0, 'touch', 3);
  assert.deepEqual(
    h.input.surfaceContacts().map((c) => c.x),
    [0.3, 0.7],
  );
  h.fire('pointerup', 0.3, 0.5, 100, 'touch', 1);
  assert.deepEqual(
    h.input.surfaceContacts().map((c) => c.x),
    [0.7],
  );
  window.dispatchEvent(new Event('blur'));
  assert.deepEqual(h.input.surfaceContacts(), []);
  h.input.dispose();
});
