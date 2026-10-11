import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('./mixing.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
const {
  initialMaterial,
  addMaterial,
  materialColor,
  liquidVolume,
  pourPoint,
  pourDuration,
  EMPTY_CUP_COLOR,
} = await import(
  'data:text/javascript;base64,' + Buffer.from(javascript).toString('base64')
);

test('reset has one 140 ml base or an empty ceramic surface', () => {
  assert.equal(liquidVolume(initialMaterial('coffee')), 140);
  assert.equal(initialMaterial('tea').tea, 140);
  assert.equal(initialMaterial('coffee').tea, 0);
  assert.equal(liquidVolume(initialMaterial('empty')), 0);
  assert.deepEqual(materialColor(initialMaterial('empty')), [
    ...EMPTY_CUP_COLOR,
  ]);
});

test('milk additions persist as separate ingredients and lighten coffee', () => {
  const coffee = initialMaterial('coffee');
  const condensed = addMaterial(coffee, 'condensed', 20);
  const both = addMaterial(condensed, 'evaporated', 30);
  assert.deepEqual(
    [both.coffee, both.condensed, both.evaporated],
    [140, 20, 30],
  );
  assert.equal(liquidVolume(both), 190);
  assert.equal(coffee.condensed, 0);
  assert.ok(materialColor(both)[0] > materialColor(coffee)[0]);
  assert.notDeepEqual(
    materialColor(addMaterial(coffee, 'condensed', 20)),
    materialColor(addMaterial(coffee, 'evaporated', 20)),
  );
});

test('sugar contributes grams without adding liquid or a false milk colour', () => {
  const tea = initialMaterial('tea');
  const sweet = addMaterial(tea, 'sugar', 8);
  assert.equal(sweet.sugar, 8);
  assert.equal(liquidVolume(sweet), 140);
  assert.deepEqual(materialColor(sweet), materialColor(tea));
});

test('repeated small pours preserve the full material history', () => {
  let drink = initialMaterial('coffee');
  for (let index = 0; index < 20; index++)
    drink = addMaterial(drink, 'evaporated', 5);
  assert.equal(drink.evaporated, 100);
  assert.deepEqual(
    materialColor(drink),
    materialColor(addMaterial(initialMaterial('coffee'), 'evaporated', 100)),
  );
  assert.ok(pourDuration(5) < 0.25);
  assert.ok(pourDuration(140) > 0.7 && pourDuration(140) < 0.9);
});

test('invalid amounts and unknown ingredients cannot poison the simulation', () => {
  const drink = initialMaterial('coffee');
  for (const amount of [0, -1, NaN, Infinity, 601])
    assert.equal(addMaterial(drink, 'water', amount), null);
  for (const kind of ['foam', '__proto__', 'constructor'])
    assert.equal(addMaterial(drink, kind, 5), null);
  assert.equal(liquidVolume(drink), 140);
});

test('pour coordinates stay inside the liquid even for off-cup input', () => {
  assert.deepEqual(pourPoint(), [0.42, 0.55]);
  assert.deepEqual(pourPoint(NaN, 1), [0.42, 0.55]);
  for (const point of [
    [2, 2],
    [-1, 0],
    [1, 1],
  ]) {
    const [x, y] = pourPoint(...point);
    assert.ok(Math.hypot(x - 0.5, y - 0.5) <= 0.32000001);
  }
});
