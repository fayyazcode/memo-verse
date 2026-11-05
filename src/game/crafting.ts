import { RECIPES, type ItemId } from './data';
import { count, transact, type Stack } from './rules';
export const MAX_CRAFT_BATCHES = 99;
export type Recipe = (typeof RECIPES)[number];
export function craftBatch(inventory: Stack[], recipe: Recipe, batches: number) {
  if (!Number.isSafeInteger(batches) || batches < 1 || batches > MAX_CRAFT_BATCHES) return null;
  const cost = Object.fromEntries(
    Object.entries(recipe.ingredients).map(([id, n]) => [id, n! * batches])
  ) as Partial<Record<ItemId, number>>;
  return transact(inventory, cost, { [recipe.id]: recipe.output * batches });
}
export function maxCraftBatches(inventory: Stack[], recipe: Recipe) {
  const affordable = Math.min(
    MAX_CRAFT_BATCHES,
    ...Object.entries(recipe.ingredients).map(([id, n]) =>
      Math.floor(count(inventory, id as ItemId) / n!)
    )
  );
  // Consuming a full ingredient stack can free an output slot, so capacity is not monotonic.
  for (let n = affordable; n >= 1; n--) if (craftBatch(inventory, recipe, n)) return n;
  return 0;
}
