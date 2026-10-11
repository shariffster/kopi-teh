/**
 * An illustrative ingredient ledger, not a sensory or nutrition prediction.
 * Liquids are recorded in ml; separately added sugar is recorded in g.
 */
export type IngredientKind =
  | 'coffee'
  | 'tea'
  | 'water'
  | 'condensed'
  | 'evaporated'
  | 'sugar';

export type DrinkRecipe = Readonly<Record<IngredientKind, number>>;
export type IngredientAddition = Readonly<{ kind: IngredientKind; amount: number }>;
export type DrinkPreset = Readonly<{
  id: string;
  label: string;
  sequence: readonly IngredientAddition[];
}>;

export const LIQUID_CAPACITY_ML = 300;
export const SUGAR_CAPACITY_G = 30;

export const EMPTY_RECIPE: DrinkRecipe = Object.freeze({
  coffee: 0, tea: 0, water: 0, condensed: 0, evaporated: 0, sugar: 0,
});

export const INGREDIENTS: readonly Readonly<{
  id: IngredientKind;
  label: string;
  color: string;
  unit: 'ml' | 'g';
  step: number;
}>[] = [
  { id: 'coffee', label: 'Coffee', color: '#402b20', unit: 'ml', step: 10 },
  { id: 'tea', label: 'Tea', color: '#a45529', unit: 'ml', step: 10 },
  { id: 'water', label: 'Water', color: '#cfddd9', unit: 'ml', step: 10 },
  { id: 'condensed', label: 'Condensed milk', color: '#efdcae', unit: 'ml', step: 5 },
  { id: 'evaporated', label: 'Evaporated milk', color: '#d7c5a1', unit: 'ml', step: 5 },
  { id: 'sugar', label: 'Sugar', color: '#eee9db', unit: 'g', step: 2 },
];

/** Sum only the five liquid inputs. Sugar grams must never enter this total. */
export function totalLiquidMl(recipe: DrinkRecipe): number {
  return recipe.coffee + recipe.tea + recipe.water + recipe.condensed + recipe.evaporated;
}

/**
 * Pour into a valid recipe without mutating it or displacing earlier additions.
 * Negative/non-finite requests are ignored; use a saved state for undo.
 * The liquid ledger does not estimate volume changes from dissolved sugar.
 */
export function addIngredient(
  recipe: DrinkRecipe,
  kind: IngredientKind,
  amount: number,
): DrinkRecipe {
  const requested = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const available = kind === 'sugar'
    ? Math.max(0, SUGAR_CAPACITY_G - recipe.sugar)
    : Math.max(0, LIQUID_CAPACITY_ML - totalLiquidMl(recipe));
  return { ...recipe, [kind]: recipe[kind] + Math.min(requested, available) };
}

/** Names describe ingredient families, never a nationally standard ratio. */
export function recipeName(recipe: DrinkRecipe): string {
  const coffee = recipe.coffee > 0;
  const tea = recipe.tea > 0;
  if (!coffee && !tea) {
    return totalLiquidMl(recipe) === 0 && recipe.sugar === 0 ? 'Your cup' : 'Your blend';
  }
  if (coffee && tea) return 'Your blend';
  if (recipe.condensed > 0 && recipe.evaporated > 0) return 'Your blend';
  const base = coffee ? 'Kopi' : 'Teh';
  // Sweetened condensed milk remains sweet even when separate sugar is zero.
  if (recipe.condensed > 0) return base;
  if (recipe.evaporated > 0) return `${base}-C${recipe.sugar > 0 ? '' : ' Kosong'}`;
  return `${base}-O${recipe.sugar > 0 ? '' : ' Kosong'}`;
}

/** Reports added ingredients, not measured sweetness or total sugar content. */
export function sweetnessLabel(recipe: DrinkRecipe): string {
  if (recipe.condensed > 0) {
    return recipe.sugar > 0 ? `Sweetened milk + ${recipe.sugar} g sugar` : 'Sweetened milk';
  }
  return recipe.sugar > 0 ? `${recipe.sugar} g added sugar` : 'No sweetener added here';
}

// Authored example pours: 180 ml liquid each, starting with a 140 ml base.
// These amounts were chosen for this interactive cup, not taken as a standard.
export const DRINK_PRESETS: readonly DrinkPreset[] = [
  {
    id: 'kopi-o', label: 'Kopi-O',
    sequence: [{ kind: 'coffee', amount: 140 }, { kind: 'water', amount: 40 }, { kind: 'sugar', amount: 8 }],
  },
  {
    id: 'kopi', label: 'Kopi',
    sequence: [{ kind: 'coffee', amount: 140 }, { kind: 'condensed', amount: 20 }, { kind: 'water', amount: 20 }],
  },
  {
    id: 'kopi-c', label: 'Kopi-C',
    sequence: [{ kind: 'coffee', amount: 140 }, { kind: 'evaporated', amount: 20 }, { kind: 'water', amount: 20 }, { kind: 'sugar', amount: 8 }],
  },
  {
    id: 'teh', label: 'Teh',
    sequence: [{ kind: 'tea', amount: 140 }, { kind: 'condensed', amount: 20 }, { kind: 'water', amount: 20 }],
  },
];

export function recipeFromPreset(preset: DrinkPreset): DrinkRecipe {
  return preset.sequence.reduce(
    (recipe, addition) => addIngredient(recipe, addition.kind, addition.amount),
    { ...EMPTY_RECIPE },
  );
}

export const NAMING_SOURCES = [
  { title: 'Mount Alvernia Hospital: Know Your Kopi', url: 'https://mtalvernia.sg/education/know-your-kopi/' },
  { title: 'HealthHub: Getting Your Caffeine Hit', url: 'https://www.healthhub.sg/well-being-and-lifestyle/food-diet-and-nutrition/i-love-coffee-i-love-tea' },
] as const;

export const RECIPE_NOTES = {
  naming: 'Kopi/Teh use condensed milk; O has no milk; C uses evaporated milk. Kosong here means no separately added sugar and is never applied to condensed milk.',
  amounts: 'These are illustrative pours, not standard stall recipes. Liquid inputs are counted in ml; separate sugar is counted in g.',
  sweetness: 'Condensed milk is sweetened milk. The sugar control records separate sugar only; it does not measure total sugar or predict sweetness.',
  limits: 'Colours and mixing are illustrative. Extraction, temperature, milk brands and sensory strength are not modelled. Adding water does not automatically assign Po or Gau.',
} as const;
