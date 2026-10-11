import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../lib/drink-recipe.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const {
  EMPTY_RECIPE, INGREDIENTS, DRINK_PRESETS, LIQUID_CAPACITY_ML, SUGAR_CAPACITY_G,
  addIngredient, totalLiquidMl, recipeName, sweetnessLabel, recipeFromPreset,
} = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

const recipe = (totals) => ({ ...EMPTY_RECIPE, ...totals });

test('a pour is immutable and clips only the incoming liquid at capacity', () => {
  const before = Object.freeze(recipe({ coffee: 280, sugar: 8 }));
  const after = addIngredient(before, 'condensed', 50);
  assert.deepEqual(after, recipe({ coffee: 280, condensed: 20, sugar: 8 }));
  assert.equal(totalLiquidMl(after), LIQUID_CAPACITY_ML);
  assert.equal(before.condensed, 0);
  assert.deepEqual(addIngredient(after, 'water', 10), after);
});

test('sugar grams have their own limit and do not consume liquid millilitres', () => {
  const full = addIngredient(EMPTY_RECIPE, 'coffee', 300);
  const sweet = addIngredient(full, 'sugar', 100);
  assert.equal(sweet.sugar, SUGAR_CAPACITY_G);
  assert.equal(totalLiquidMl(sweet), 300);
  assert.equal(addIngredient(recipe({ sugar: 30 }), 'water', 300).water, 300);
});

test('negative and non-finite pours cannot remove or corrupt ingredients', () => {
  const before = recipe({ tea: 140, sugar: 2 });
  for (const amount of [-10, NaN, Infinity, -Infinity]) {
    const after = addIngredient(before, 'sugar', amount);
    assert.deepEqual(after, before);
    assert.notEqual(after, before);
  }
});

test('coffee and tea names follow milk and added-sugar composition', () => {
  for (const [kind, base] of [['coffee', 'Kopi'], ['tea', 'Teh']]) {
    assert.equal(recipeName(recipe({ [kind]: 140 })), `${base}-O Kosong`);
    assert.equal(recipeName(recipe({ [kind]: 140, sugar: 2 })), `${base}-O`);
    assert.equal(recipeName(recipe({ [kind]: 140, evaporated: 20 })), `${base}-C Kosong`);
    assert.equal(recipeName(recipe({ [kind]: 140, evaporated: 20, sugar: 2 })), `${base}-C`);
    assert.equal(recipeName(recipe({ [kind]: 140, condensed: 20 })), base);
    assert.equal(recipeName(recipe({ [kind]: 140, condensed: 20, sugar: 2 })), base);
  }
});

test('condensed milk with zero separate sugar remains explicitly sweetened', () => {
  const cup = recipeFromPreset(DRINK_PRESETS.find((p) => p.id === 'kopi'));
  assert.equal(cup.sugar, 0);
  assert.equal(recipeName(cup), 'Kopi');
  assert.equal(sweetnessLabel(cup), 'Sweetened milk');
  assert.doesNotMatch(sweetnessLabel(cup), /sugar.free|unsweetened|no sugar/i);
});

test('mixed bases and mixed milks keep a custom name; dilution invents none', () => {
  assert.equal(recipeName(recipe({ coffee: 70, tea: 70 })), 'Your blend');
  assert.equal(recipeName(recipe({ coffee: 140, condensed: 10, evaporated: 10 })), 'Your blend');
  assert.equal(recipeName(recipe({ tea: 10, water: 280 })), 'Teh-O Kosong');
  assert.equal(recipeName(recipe({ water: 100 })), 'Your blend');
  assert.equal(recipeName(EMPTY_RECIPE), 'Your cup');
});

test('four staged illustrative presets produce the advertised names and valid units', () => {
  assert.deepEqual(DRINK_PRESETS.map((p) => p.label), ['Kopi-O', 'Kopi', 'Kopi-C', 'Teh']);
  for (const preset of DRINK_PRESETS) {
    assert.equal(preset.sequence[0].amount, 140);
    const cup = recipeFromPreset(preset);
    assert.equal(recipeName(cup), preset.label);
    assert.equal(totalLiquidMl(cup), 180);
    assert.ok(cup.sugar <= SUGAR_CAPACITY_G);
  }
  assert.equal(INGREDIENTS.find((i) => i.id === 'sugar').unit, 'g');
  assert.equal(INGREDIENTS.find((i) => i.id === 'sugar').step, 2);
  assert.ok(INGREDIENTS.filter((i) => i.id !== 'sugar').every((i) => i.unit === 'ml' && [5, 10].includes(i.step)));
});

test('repeated additions preserve both separate capacity invariants', () => {
  let cup = { ...EMPTY_RECIPE };
  for (let i = 0; i < 120; i++) {
    const kind = INGREDIENTS[i % INGREDIENTS.length].id;
    cup = addIngredient(cup, kind, (i % 9) + 0.5);
    assert.ok(totalLiquidMl(cup) <= LIQUID_CAPACITY_ML);
    assert.ok(cup.sugar <= SUGAR_CAPACITY_G);
    assert.ok(Object.values(cup).every((amount) => Number.isFinite(amount) && amount >= 0));
  }
});
