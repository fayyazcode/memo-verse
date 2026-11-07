import { beforeEach, describe, expect, it, vi } from 'vitest';
import { advanceHunting, inMeadow, MONSTERS, newHunting, validHunting } from '../src/game/hunting';
import { advanceSquad, cast, newMember, newSquad, squadOf } from '../src/game/squad';
import { freshSave, useGame, validateSave } from '../src/game/store';
const hunter = () => {
  const s = freshSave();
  s.position = [17, 1, 22];
  s.active = 'emberfox';
  s.creatures.emberfox = { hp: 60, xp: 0, friendship: 10 };
  s.squad = newSquad('emberfox');
  return s;
};
beforeEach(() =>
  useGame.setState({
    save: freshSave(),
    started: true,
    panel: null,
    dialogue: null,
    persist: vi.fn(async () => {}),
  })
);
describe('Monster Meadow repeatable combat', () => {
  it('adapts old squad saves without mutating them or changing story progress', () => {
    const s = hunter();
    delete s.squad!.hunting;
    const original = structuredClone(s);
    expect(squadOf(s).hunting!.hp).toEqual(MONSTERS.map((m) => m.hp));
    expect(s).toEqual(original);
    expect(validateSave(s).quests).toEqual(s.quests);
    expect(validHunting(newHunting())).toBe(true);
  });
  it('awards a kill exactly once and keeps Guardian and mission rewards separate', () => {
    const s = hunter();
    s.squad!.hunting!.hp[0] = 1;
    s.quests.q02 = { status: 'active', progress: {} };
    const hit = cast(s, 'emberfox', 'basic', 'hunt0');
    expect(hit.error).toBeUndefined();
    expect(hit.save.coins).toBe(53);
    expect(hit.save.squad!.hunting!.loot[0]).toBe(true);
    expect(hit.save.creatures.emberfox!.xp).toBeGreaterThanOrEqual(12);
    expect(hit.save.quests).toEqual(s.quests);
    expect(hit.save.flags).not.toContain('guardianDefeated');
    expect(hit.save.inventory).toEqual([]);
    const again = cast(hit.save, 'emberfox', 'basic', 'hunt0');
    expect(again.error).toBeDefined();
    expect(again.save.coins).toBe(53);
    expect(s.squad!.hunting!.hp[0]).toBe(1);
    expect(s.coins).toBe(50);
  });
  it('collects loot once, pauses respawn until it is collected, and respawns at full health', () => {
    let s = hunter();
    s.quests.q02 = { status: 'active', progress: {} };
    s.squad!.hunting!.hp[0] = 1;
    s = cast(s, 'emberfox', 'basic', 'hunt0').save;
    const waited = advanceSquad(s, 21).save;
    expect(waited.squad!.hunting!.hp[0]).toBe(0);
    useGame.setState({ save: waited, target: 'hunt0' });
    useGame.getState().interact();
    expect(useGame.getState().save.inventory).toEqual([{ item: 'fiber', qty: 2 }]);
    useGame.getState().interact();
    expect(useGame.getState().save.inventory).toEqual([{ item: 'fiber', qty: 2 }]);
    expect(useGame.getState().save.quests.q02.progress.fiber ?? 0).toBe(0);
    const respawn = advanceSquad(useGame.getState().save, 0.1).save;
    expect(respawn.squad!.hunting!.hp[0]).toBe(70);
    expect(respawn.coins).toBe(53);
  });
  it('preserves a pouch when the bag is full or the player is too far away', () => {
    const s = hunter();
    s.squad!.hunting!.hp[0] = 0;
    s.squad!.hunting!.loot[0] = true;
    s.inventory = Array.from({ length: 24 }, () => ({ item: 'wood' as const, qty: 99 }));
    useGame.setState({ save: s, target: 'hunt0' });
    useGame.getState().interact();
    expect(squadOf(useGame.getState().save).hunting!.loot[0]).toBe(true);
    useGame.setState({ save: { ...s, inventory: [], position: [0, 1, 0] } });
    useGame.getState().interact();
    expect(useGame.getState().save.inventory).toEqual([]);
  });
  it('telegraphs attacks, permits dodging and never damages someone outside the meadow', () => {
    const h = newHunting();
    h.cooldown[0] = 0;
    expect(advanceHunting(h, 0.1, 0, [17, 1, 23])).toEqual([]);
    expect(h.windup[0]).toBe(0.65);
    expect(advanceHunting(h, 0.65, 0.1, [17, 1, 23])).toEqual([{ index: 0, damage: 3 }]);
    h.cooldown[0] = 0;
    advanceHunting(h, 0.1, 1, [17, 1, 23]);
    expect(advanceHunting(h, 0.65, 1.1, [12, 1, 23])).toEqual([]);
    for (let i = 0; i < 500; i++) advanceHunting(h, 0.1, i * 0.1, [0, 1, 0]);
    expect(validHunting(h)).toBe(true);
    expect(h.positions.every(inMeadow)).toBe(true);
  });
  it('saves wounded monsters and remaining timers; menus do not advance their clock', () => {
    const s = hunter();
    s.squad!.hunting!.hp[0] = 0;
    s.squad!.hunting!.respawn[0] = 12;
    s.squad!.hunting!.loot[0] = true;
    const loaded = validateSave(JSON.parse(JSON.stringify(s)));
    expect(loaded.squad!.hunting).toEqual(s.squad!.hunting);
    useGame.setState({ save: loaded, panel: 'meadow' });
    useGame.getState().tick(30);
    expect(useGame.getState().save.squad!.hunting!.respawn[0]).toBe(12);
    const invalid = structuredClone(s);
    invalid.squad!.hunting!.positions[0] = [100, 0, 23];
    expect(() => validateSave(invalid)).toThrow('squad');
  });
});

it('resolves an area attack across multiple monsters and pays each defeat only once', () => {
  const s = hunter();
  s.creatures.emberfox!.xp = 99999;
  s.squad!.members.emberfox = { ...newMember(), charge: 100 };
  s.squad!.hunting!.hp = [1, 1, 1];
  s.squad!.hunting!.positions = [
    [17, 0, 23],
    [18, 0, 23],
    [19, 0, 23],
  ];
  const ability = cast(s, 'emberfox', 'R', 'hunt0');
  expect(ability.error).toBeUndefined();
  const hit = advanceSquad(ability.save, 1).save;
  expect(hit.squad!.hunting!.hp).toEqual([0, 0, 0]);
  expect(hit.squad!.hunting!.loot).toEqual([true, true, true]);
  expect(hit.coins).toBe(63);
  expect(hit.flags).not.toContain('guardianDefeated');
  expect(advanceSquad(hit, 1).save.coins).toBe(63);
});
