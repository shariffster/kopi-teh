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
/** A 5 ml held-button dose completes before the next 250 ms repeat. */
export function pourDuration(amount: number): number {
  return Math.min(0.85, 0.18 + amount / 230);
}
export function pourPoint(x = 0.42, y = 0.55): [number, number] {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return [0.42, 0.55];
  const dx = x - 0.5,
    dy = y - 0.5,
    distance = Math.hypot(dx, dy);
  const scale = distance > 0.32 ? 0.32 / distance : 1;
  return [0.5 + dx * scale, 0.5 + dy * scale];
}
