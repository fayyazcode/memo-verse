import { beforeEach, describe, it, expect, vi } from 'vitest';
import { craftBatch, maxCraftBatches } from '../src/game/crafting';
import { RECIPES } from '../src/game/data';
import { count, type Stack } from '../src/game/rules';
import { freshSave, useGame } from '../src/game/store';
const blocks = RECIPES.find((r) => r.id === 'block')!;
describe('batch crafting', () => {
  it('multiplies costs and outputs in a single transaction', () => {
    const inv = craftBatch([{ item: 'wood', qty: 10 }], blocks, 6)!;
    expect(count(inv, 'wood')).toBe(4);
    expect(count(inv, 'block')).toBe(12);
  });
  it('rejects insufficient materials without partial consumption', () => {
    const inv: Stack[] = [{ item: 'wood', qty: 3 }];
    expect(craftBatch(inv, blocks, 4)).toBeNull();
    expect(inv).toEqual([{ item: 'wood', qty: 3 }]);
  });
  it('rejects output overflow without changing inputs', () => {
    const inv: Stack[] = [
      { item: 'wood', qty: 10 },
      ...Array.from({ length: 23 }, () => ({ item: 'pickaxe' as const, qty: 1 })),
    ];
    expect(craftBatch(inv, blocks, 6)).toBeNull();
    expect(count(inv, 'wood')).toBe(10);
  });
  it('finds Max even when only a larger batch frees a slot', () => {
    const inv: Stack[] = [
      { item: 'wood', qty: 2 },
      ...Array.from({ length: 23 }, () => ({ item: 'pickaxe' as const, qty: 1 })),
    ];
    expect(craftBatch(inv, blocks, 1)).toBeNull();
    expect(maxCraftBatches(inv, blocks)).toBe(2);
    expect(count(craftBatch(inv, blocks, 2)!, 'block')).toBe(4);
  });
  it('bounds batch count and refuses invalid numbers', () => {
    for (const n of [0, -1, 1.5, 100, NaN, Infinity])
      expect(craftBatch([{ item: 'wood', qty: 99 }], blocks, n)).toBeNull();
    expect(maxCraftBatches([{ item: 'wood', qty: 99 }], blocks)).toBe(99);
  });
  it('returns zero when nothing fits or ingredients are missing', () => {
    expect(maxCraftBatches([], blocks)).toBe(0);
  });
});
describe('craft action', () => {
  beforeEach(() => {
    const s = freshSave();
    s.position = [10, 1, 11];
    s.inventory = [{ item: 'wood', qty: 10 }];
    s.quests.q02 = { status: 'complete', progress: {} };
    s.quests.q09 = { status: 'active', progress: {} };
    useGame.setState({ save: s, persist: vi.fn(async () => {}) });
  });
  it('counts every produced block for the quest and checkpoints once', () => {
    useGame.getState().craft('block', 6);
    expect(useGame.getState().save.quests.q09.progress.craft).toBe(12);
    expect(useGame.getState().persist).toHaveBeenCalledTimes(1);
    expect(count(useGame.getState().save.inventory, 'wood')).toBe(4);
  });
  it('keeps the default single-batch action compatible', () => {
    useGame.getState().craft('block');
    expect(count(useGame.getState().save.inventory, 'block')).toBe(2);
  });
});
