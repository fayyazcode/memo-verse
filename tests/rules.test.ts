import { describe, it, expect, beforeEach } from 'vitest';
import {
  count,
  elementalDamage,
  levelFromXp,
  transact,
  validPlacement,
  validShelter,
  type Block,
} from '../src/game/rules';
import { available, claimQuest, freshSave, ready, useGame, validateSave } from '../src/game/store';
import { QUESTS } from '../src/game/data';
describe('inventory transactions', () => {
  it('stacks up to 99 then starts another slot', () =>
    expect(transact([{ item: 'wood', qty: 98 }], {}, { wood: 3 })).toEqual([
      { item: 'wood', qty: 99 },
      { item: 'wood', qty: 2 },
    ]));
  it('rejects an overflow atomically', () => {
    const inv = Array.from({ length: 24 }, () => ({ item: 'pickaxe' as const, qty: 1 }));
    expect(transact(inv, {}, { wood: 1 })).toBeNull();
    expect(inv).toHaveLength(24);
  });
  it('rejects insufficient ingredients without consuming anything', () => {
    const inv = [{ item: 'wood' as const, qty: 2 }];
    expect(transact(inv, { wood: 3, stone: 2 }, { pickaxe: 1 })).toBeNull();
    expect(inv[0].qty).toBe(2);
  });
  it('uses capacity freed by ingredients', () => {
    const inv = [
      { item: 'wood' as const, qty: 3 },
      ...Array.from({ length: 23 }, () => ({ item: 'pickaxe' as const, qty: 1 })),
    ];
    expect(transact(inv, { wood: 3 }, { block: 2 })).toHaveLength(24);
  });
  it('rejects negative and fractional quantities', () => {
    expect(transact([], {}, { wood: -1 })).toBeNull();
    expect(transact([], {}, { wood: 1.5 })).toBeNull();
  });
  it('counts across stacks', () =>
    expect(
      count(
        [
          { item: 'wood', qty: 99 },
          { item: 'wood', qty: 2 },
        ],
        'wood'
      )
    ).toBe(101));
});
describe('progression and combat', () => {
  it('handles multiple level-ups', () =>
    expect(levelFromXp(650)).toEqual({ level: 4, xp: 50, next: 400 }));
  it('caps level and preserves lifetime XP outside the level projection', () =>
    expect(levelFromXp(9000)).toEqual({ level: 10, xp: 0, next: 0 }));
  it('applies elemental advantages, disadvantages and neutral attacks', () => {
    expect(elementalDamage(20, 'Fire', 'Earth')).toBe(25);
    expect(elementalDamage(20, 'Earth', 'Fire')).toBe(16);
    expect(elementalDamage(20, 'Electric', 'Fire')).toBe(20);
  });
});
describe('campaign integrity', () => {
  it('enforces prerequisites', () => {
    const s = freshSave();
    expect(available(s, 'q01')).toBe(true);
    expect(available(s, 'q04')).toBe(false);
  });
  it('does not reward incomplete objectives', () => {
    const s = freshSave();
    s.quests.q01 = { status: 'active', progress: {} };
    expect(claimQuest(s, 'q01')).toBeNull();
  });
  it('claims rewards once', () => {
    const s = freshSave();
    s.quests.q01 = {
      status: 'active',
      progress: Object.fromEntries(QUESTS[0].objectives.map((o) => [o.id, o.count])),
    };
    expect(ready(s, 'q01')).toBe(true);
    const claimed = claimQuest(s, 'q01')!;
    expect(claimed.coins).toBe(100);
    expect(claimed.xp).toBe(40);
    expect(claimQuest(claimed, 'q01')).toBeNull();
  });
  it('contains exactly ten unique missions and no prerequisite cycles', () => {
    expect(new Set(QUESTS.map((q) => q.id)).size).toBe(10);
    const visit = (id: string, path: string[]) => {
      expect(path).not.toContain(id);
      for (const p of QUESTS.find((q) => q.id === id)!.prereqs) visit(p, [...path, id]);
    };
    QUESTS.forEach((q) => visit(q.id, []));
  });
});
describe('building', () => {
  const b = (x: number, y: number, z: number): Block => ({ x, y, z, item: 'block' });
  it('rejects placement outside the plot, overlapping the player or another block', () => {
    expect(validPlacement(b(-7, 0, 20), [], [0, 1, 0])).toBe(false);
    expect(validPlacement(b(0, 0, 20), [], [0.5, 0.8, 20.5])).toBe(false);
    expect(validPlacement(b(0, 0, 20), [b(0, 0, 20)], [0, 1, 0])).toBe(false);
  });
  it('requires attachment above ground and respects height', () => {
    expect(validPlacement(b(0, 1, 20), [], [0, 1, 0])).toBe(false);
    expect(validPlacement(b(0, 1, 20), [b(0, 0, 20)], [0, 1, 0])).toBe(true);
    expect(validPlacement(b(0, 8, 20), [], [0, 1, 0])).toBe(false);
  });
  const shelter = [
    b(0, 0, 22),
    b(0, 1, 22),
    b(2, 0, 22),
    b(2, 1, 22),
    b(1, 0, 23),
    b(1, 1, 23),
    b(1, 2, 22),
    b(0, 0, 23),
    b(2, 0, 23),
    b(0, 1, 23),
    b(2, 1, 23),
    b(0, 2, 22),
  ];
  it('recognizes an actual roofed interior and accessible doorway', () =>
    expect(validShelter(shelter)).toBe(true));
  it('does not accept an arbitrary block count or a missing roof', () => {
    expect(
      validShelter(Array.from({ length: 12 }, (_, i) => b(i % 4, 0, 20 + Math.floor(i / 4))))
    ).toBe(false);
    expect(validShelter(shelter.filter((v) => !(v.x === 1 && v.y === 2 && v.z === 22)))).toBe(
      false
    );
  });
});
describe('saves', () => {
  it('round-trips saved state', () =>
    expect(validateSave(JSON.parse(JSON.stringify(freshSave())))).toEqual(freshSave()));
  it('rejects unsupported schema versions without mutating the input', () => {
    const s = { ...freshSave(), version: 999 };
    expect(() => validateSave(s)).toThrow('version');
    expect(s.version).toBe(999);
  });
  it('rejects corrupt quantities and out-of-bounds positions', () => {
    expect(() => validateSave({ ...freshSave(), inventory: [{ item: 'wood', qty: -3 }] })).toThrow(
      'inventory'
    );
    expect(() => validateSave({ ...freshSave(), position: [900, 1, 2] })).toThrow('position');
  });
});
