/** Appearance recipe only. These values drive colour, not predicted flavour. */
export type DrinkBase = 'coffee' | 'tea' | 'empty';
export type PourIngredient =
  | 'coffee'
  | 'tea'
  | 'condensed'
  | 'evaporated'
  | 'water'
  | 'sugar';
export type MaterialAmounts = Record<PourIngredient, number>;
export const INITIAL_BASE_ML = 140;
export const EMPTY_CUP_COLOR = [0.84, 0.795, 0.7] as const;
export const INGREDIENT_COLORS: Record<
  PourIngredient,
  readonly [number, number, number]
> = {
  coffee: [0.19, 0.075, 0.023],
  tea: [0.48, 0.215, 0.065],
  condensed: [0.97, 0.855, 0.64],
  evaporated: [0.885, 0.805, 0.655],
  water: [0.76, 0.69, 0.54],
  sugar: [0.98, 0.965, 0.91],
};
export function initialMaterial(base: DrinkBase): MaterialAmounts {
  const amounts = {
    coffee: 0,
    tea: 0,
    condensed: 0,
    evaporated: 0,
    water: 0,
    sugar: 0,
  };
  if (base !== 'empty') amounts[base] = INITIAL_BASE_ML;
  return amounts;
}
export function liquidVolume(amounts: MaterialAmounts) {
  return (
    amounts.coffee +
    amounts.tea +
    amounts.condensed +
    amounts.evaporated +
    amounts.water
  );
}
export function materialColor(amounts: MaterialAmounts): number[] {
  const volume = liquidVolume(amounts);
  if (!volume) return [...EMPTY_CUP_COLOR];
  const result = [0, 0, 0];
  for (const kind of [
    'coffee',
    'tea',
    'condensed',
    'evaporated',
    'water',
  ] as const) {
    // Milk scatters light more strongly than the dark base absorbs it. This is
    // a deliberately authored appearance response, not a physical mixture law.
    const weight =
      amounts[kind] *
      (kind === 'condensed'
        ? 2.4
        : kind === 'evaporated'
          ? 2
          : kind === 'water'
            ? 0.3
            : 1);
    for (let i = 0; i < 3; i++)
      result[i] += INGREDIENT_COLORS[kind][i] * weight;
  }
  const total =
    amounts.coffee +
    amounts.tea +
    amounts.condensed * 2.4 +
    amounts.evaporated * 2 +
    amounts.water * 0.3;
  return result.map((value) => value / total);
}
export function addMaterial(
  amounts: MaterialAmounts,
  kind: PourIngredient,
  amount: number,
): MaterialAmounts | null {
  if (
    !Object.hasOwn(INGREDIENT_COLORS, kind) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 600
  )
    return null;
  return { ...amounts, [kind]: amounts[kind] + amount };
}
export const POUR_PROFILES = {
  coffee: {
    base: 0.38,
    rate: 500,
    max: 0.85,
    radius: 0.035,
    pigment: 6.5,
    force: 0.055,
    spin: 0.012,
    ripple: 0.12,
    viscosity: 0,
  },
  tea: {
    base: 0.4,
    rate: 500,
    max: 0.9,
    radius: 0.036,
    pigment: 6.0,
    force: 0.05,
    spin: 0.011,
    ripple: 0.11,
    viscosity: 0,
  },
  water: {
    base: 0.38,
    rate: 650,
    max: 0.78,
    radius: 0.03,
    pigment: 0,
    force: 0.055,
    spin: 0.01,
    ripple: 0.13,
    viscosity: 0,
  },
  condensed: {
    base: 0.75,
    rate: 150,
    max: 1.6,
    radius: 0.034,
    pigment: 2.7,
    force: 0.032,
    spin: 0.006,
    ripple: 0.07,
    viscosity: 1,
  },
  evaporated: {
    base: 0.6,
    rate: 240,
    max: 1.15,
    radius: 0.039,
    pigment: 3.8,
    force: 0.043,
    spin: 0.009,
    ripple: 0.09,
    viscosity: 0.65,
  },
  sugar: {
    base: 0.44,
    rate: 110,
    max: 0.8,
    radius: 0.034,
    pigment: 0,
    force: 0.006,
    spin: 0,
    ripple: 0.025,
    viscosity: 0,
  },
} as const;
/** Optional kind keeps the old timing helper compatible for existing callers. */
export function pourDuration(amount: number, kind?: PourIngredient): number {
  if (!kind) return Math.min(0.85, 0.18 + amount / 230);
  const profile = POUR_PROFILES[kind];
  return Math.min(profile.max, profile.base + amount / profile.rate);
}
export function pourPoint(x = 0.42, y = 0.55): [number, number] {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return [0.42, 0.55];
  const dx = x - 0.5,
    dy = y - 0.5,
    distance = Math.hypot(dx, dy);
  const scale = distance > 0.32 ? 0.32 / distance : 1;
  return [0.5 + dx * scale, 0.5 + dy * scale];
}

/** Largest-remainder allocation keeps the ledger integral and loses exact ml. */
export function removeLiquid(
  amounts: MaterialAmounts,
  amount: number,
): MaterialAmounts | null {
  const keys = ['coffee', 'tea', 'condensed', 'evaporated', 'water'] as const;
  const volume = liquidVolume(amounts);
  if (
    !Number.isInteger(amount) ||
    amount <= 0 ||
    amount > volume ||
    keys.some((key) => !Number.isInteger(amounts[key]) || amounts[key] < 0)
  )
    return null;
  const allocations = keys.map((key, index) => {
    const exact = (amounts[key] * amount) / volume;
    return { key, index, ml: Math.floor(exact), remainder: exact % 1 };
  });
  let rest = amount - allocations.reduce((sum, item) => sum + item.ml, 0);
  const ranked = [...allocations].sort((a, b) =>
    Math.abs(b.remainder - a.remainder) < 1e-10
      ? a.index - b.index
      : b.remainder - a.remainder,
  );
  for (const item of ranked) {
    if (!rest) break;
    if (item.ml < amounts[item.key]) {
      item.ml++;
      rest--;
    }
  }
  const next = { ...amounts };
  for (const item of allocations) next[item.key] -= item.ml;
  return next;
}
