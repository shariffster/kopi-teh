import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
async function load(file) {
  const source = await readFile(new URL(file, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText;
  return import(
    'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
  );
}
const { OverflowBudget } = await load('./overflow.ts');
const { removeLiquid, liquidVolume } = await load('./mixing.ts');
const splat = (force, x = 0.94, y = 0.5) => ({
  x,
  y,
  dx: force,
  dy: 0,
  radius: 0.06,
  spin: 0,
  prod: 0,
});
function stir(
  budget,
  start,
  force = 0.14,
  fill = 1,
  x = 0.94,
  y = 0.5,
  enabled = true,
) {
  const events = [];
  for (let i = 0; i < 60; i++) {
    const angle = budget.advance(
      start + i / 60,
      1 / 60,
      fill,
      [splat(force, x, y)],
      enabled,
    );
    if (angle !== null) events.push(angle);
  }
  return events;
}
test('quiet, central, low-fill and disabled input never spill', () => {
  for (const args of [
    [0.008, 1, 0.94, 0.5, true],
    [0.14, 1, 0.5, 0.5, true],
    [0.14, 0.69, 0.94, 0.5, true],
    [0.14, 1, 0.94, 0.5, false],
  ])
    assert.deepEqual(stir(new OverflowBudget(), 0, ...args), []);
});
test('repeat spills have a 0.7-second cooldown and no lifetime cap', () => {
  const budget = new OverflowBudget();
  for (let i = 0; i < 8; i++) {
    assert.notEqual(budget.advance(i * 0.8, 1 / 60, 1, [splat(0.14)]), null);
    assert.equal(budget.advance(i * 0.8 + 0.3, 1 / 60, 1, [splat(0.8)]), null);
  }
  budget.reset();
  assert.notEqual(budget.advance(0, 1 / 60, 1, [splat(0.14)]), null);
});
test('outward push works in all four directions; inward and tangent do not spill', () => {
  for (const [x, y, dx, dy, angle] of [
    [0.94, 0.5, 0.14, 0, 0],
    [0.06, 0.5, -0.14, 0, Math.PI],
    [0.5, 0.94, 0, 0.14, -Math.PI / 2],
    [0.5, 0.06, 0, -0.14, Math.PI / 2],
  ]) {
    const budget = new OverflowBudget();
    const result = budget.advance(0, 1 / 60, 1, [
      { ...splat(0, x, y), dx, dy },
    ]);
    assert.notEqual(result, null);
    assert.ok(
      Math.abs(Math.atan2(Math.sin(result - angle), Math.cos(result - angle))) <
        0.001,
    );
    assert.equal(
      new OverflowBudget().advance(0, 1 / 60, 1, [
        { ...splat(0, x, y), dx: -dx, dy: -dy },
      ]),
      null,
    );
  }
  assert.deepEqual(stir(new OverflowBudget(), 0, 0.14, 1, 0.5, 0.94), []);
});
test('lower liquid levels progressively require stronger outward momentum', () => {
  const full = stir(new OverflowBudget(), 0, 0.04, 1).length;
  const lower = stir(new OverflowBudget(), 0, 0.04, 0.8).length;
  assert.ok(full > 0);
  assert.equal(lower, 0);
  assert.ok(stir(new OverflowBudget(), 0, 0.14, 0.7).length > 0);
});
test('overflow removes exact integer ml proportionally without consuming sugar', () => {
  const recipe = {
    coffee: 140,
    tea: 0,
    condensed: 20,
    evaporated: 0,
    water: 20,
    sugar: 6,
  };
  const next = removeLiquid(recipe, 3);
  assert.equal(liquidVolume(next), 177);
  assert.equal(next.sugar, 6);
  assert.equal(recipe.coffee, 140, 'input is immutable');
  assert.deepEqual(next, {
    coffee: 137,
    tea: 0,
    condensed: 20,
    evaporated: 0,
    water: 20,
    sugar: 6,
  });
  for (let coffee = 0; coffee <= 8; coffee++)
    for (let water = 0; water <= 8; water++) {
      if (coffee + water < 3) continue;
      const small = {
        coffee,
        water,
        tea: 0,
        condensed: 0,
        evaporated: 0,
        sugar: 7,
      };
      const result = removeLiquid(small, 3);
      assert.equal(liquidVolume(result), coffee + water - 3);
      assert.ok(
        Object.values(result).every((x) => Number.isInteger(x) && x >= 0),
      );
      assert.equal(result.sugar, 7);
    }
});
test('two 8 ml spills preserve the mixture and remove exactly 16 ml', () => {
  const recipe = {
    coffee: 200,
    tea: 0,
    condensed: 40,
    evaporated: 0,
    water: 60,
    sugar: 6,
  };
  const once = removeLiquid(recipe, 8);
  const twice = removeLiquid(once, 8);
  assert.equal(liquidVolume(once), 292);
  assert.equal(liquidVolume(twice), 284);
  assert.equal(twice.sugar, 6);
  assert.equal(liquidVolume(recipe), 300);
  assert.ok(
    Object.values(twice).every(
      (value) => Number.isInteger(value) && value >= 0,
    ),
  );
  assert.ok(Math.abs(twice.coffee / 284 - recipe.coffee / 300) < 0.01);
});
test('invalid deductions do not mutate a cup', () => {
  const empty = {
    coffee: 0,
    tea: 0,
    condensed: 0,
    evaporated: 0,
    water: 0,
    sugar: 2,
  };
  for (const ml of [0, -1, 3, NaN, Infinity, 0.5])
    assert.equal(removeLiquid(empty, ml), null);
});
