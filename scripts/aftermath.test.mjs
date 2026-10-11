import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const moduleUrl = (source) =>
  'data:text/javascript;base64,' +
  Buffer.from(
    ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    }).outputText,
  ).toString('base64');
const config = moduleUrl(
  await readFile(new URL('../lib/beverage/config.ts', import.meta.url), 'utf8'),
);
const { Aftermath } = await import(
  moduleUrl(
    (
      await readFile(
        new URL('../lib/beverage/aftermath.ts', import.meta.url),
        'utf8',
      )
    ).replace("'./config'", JSON.stringify(config)),
  )
);
const splat = (dx = 0, spin = 0, prod = 0) => ({
  x: 0.5,
  y: 0.5,
  dx,
  dy: 0,
  radius: 0.06,
  spin,
  prod,
});
test('pristine and reset surfaces never start ambient motion', () => {
  const a = new Aftermath();
  assert.equal(a.advance(10, []).active, false);
  a.advance(11, [splat(3)]);
  a.reset();
  assert.equal(a.advance(12, []).active, false);
});
test('a prod, a slow stroke and repeated stirring have distinct finite tails', () => {
  const sample = (s) => new Aftermath().advance(1, s);
  const tap = sample([splat(0, 0, 0.03)]),
    gentle = sample([splat(1)]),
    vigorous = sample(Array(12).fill(splat(2)));
  assert.ok(
    tap.duration < gentle.duration && gentle.duration < vigorous.duration,
  );
  assert.equal(vigorous.duration, 24);
  assert.ok(vigorous.dissipation < gentle.dissipation);
});
test('late settling ramps drag smoothly before the solver parks', () => {
  const a = new Aftermath();
  a.advance(1, Array(12).fill(splat(2)));
  const early = a.advance(19, []),
    late = a.advance(23, []),
    end = a.advance(25, []);
  assert.ok(early.active && late.active && !end.active);
  assert.ok(early.fade > late.fade && late.fade > end.fade);
  assert.ok(late.dissipation > early.dissipation);
  assert.equal(end.fade, 0);
});
test('integrated force is independent of an event batch split', () => {
  const a = new Aftermath(),
    b = new Aftermath();
  const whole = a.advance(1, [splat(2)]);
  b.advance(1, [splat(1)]);
  const split = b.advance(1, [splat(1)]);
  assert.equal(whole.intensity, split.intensity);
});
test('a small interaction after a long rest does not inherit a vigorous tail', () => {
  const a = new Aftermath();
  a.advance(1, Array(12).fill(splat(2)));
  a.advance(40, []);
  assert.ok(a.advance(41, [splat(0.3)]).duration < 12);
});
test('the velocity envelope fades to zero at either 30 or 120 Hz without adding energy', () => {
  for (const hz of [30, 120]) {
    const a = new Aftermath();
    a.advance(1, Array(12).fill(splat(2)));
    let momentum = 1;
    for (let frame = 1; frame <= 24 * hz; frame++) {
      const motion = a.advance(1 + frame / hz, []);
      assert.ok(motion.retention >= 0 && motion.retention <= 1);
      momentum *= motion.retention;
      if (frame === 23 * hz) assert.ok(momentum > 0 && momentum < 0.11);
    }
    assert.equal(momentum, 0);
    assert.equal(a.advance(26, [splat(1)]).retention, 1);
  }
});
test('fine eddies calm early while the broad swirl keeps coasting', () => {
  const a = new Aftermath();
  const touched = a.advance(1, Array(12).fill(splat(2)));
  const released = a.advance(3, []);
  assert.ok(released.active);
  assert.equal(released.fade, 1);
  assert.equal(released.retention, 1);
  assert.ok(released.curlFade < touched.curlFade * 0.15);
  assert.ok(released.viscosity > touched.viscosity);
  assert.equal(released.duration, touched.duration);
});
test('fresh input immediately regains its stirring response after settling', () => {
  const a = new Aftermath();
  const touched = a.advance(1, [splat(2)]);
  const settled = a.advance(5, []);
  const resumed = a.advance(6, [splat(0.4)]);
  assert.ok(resumed.curlFade > settled.curlFade);
  assert.equal(resumed.curlFade, touched.curlFade);
  assert.equal(resumed.viscosity, touched.viscosity);
  assert.equal(resumed.retention, 1);
});
