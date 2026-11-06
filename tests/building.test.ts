import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canBuildHome, homeSite, HOME_COST, starterHome } from '../src/game/building';
import { validPlacement, validShelter, count, type Block } from '../src/game/rules';
import { freshSave, useGame, ready, validateSave } from '../src/game/store';
const b = (x: number, y: number, z: number): Block => ({ x, y, z, item: 'block' });
beforeEach(() => {
  useGame.setState({
    save: freshSave(),
    buildRotation: 0,
    buildPart: 'wall',
    persist: vi.fn(async () => {}),
  });
});
describe('usable house construction', () => {
  it('provides a complete, supported 24-block home with roof and doorway in either orientation', () => {
    for (const rotation of [0, 1] as const) {
      const plan = starterHome(0, 22, rotation);
      expect(plan).toHaveLength(HOME_COST);
      expect(plan.filter((b) => b.part === 'roof')).toHaveLength(9);
      expect(plan.filter((b) => b.part === 'gate')).toHaveLength(1);
      expect(canBuildHome(plan, [], [-4, 1, 25])).toBe(true);
      expect(validShelter(plan)).toBe(true);
      expect(validShelter(starterHome(-6, 19, rotation))).toBe(true);
    }
  });
  it('recognizes spacious rooms and raised floors, without accepting scattered blocks or missing walls', () => {
    const room: Block[] = [];
    for (let x = -2; x <= 2; x++)
      for (let z = 22; z <= 26; z++) {
        room.push(b(x, 0, z), { ...b(x, 3, z), part: 'roof' });
        if ((x === -2 || x === 2 || z === 22 || z === 26) && !(x === 0 && z === 22))
          room.push(b(x, 1, z), b(x, 2, z));
      }
    room.push({ ...b(0, 1, 22), part: 'gate' });
    expect(validShelter(room)).toBe(true);
    expect(validShelter(room.filter((v) => v.part !== 'roof'))).toBe(false);
    expect(validShelter(room.filter((v) => !(v.x === -2 && v.y >= 1 && v.y <= 2)))).toBe(false);
    expect(
      validShelter(Array.from({ length: 24 }, (_, i) => b(i % 6, 0, 20 + Math.floor(i / 6))))
    ).toBe(false);
  });
  it('protects gate headroom and roof support, limits and player space', () => {
    const gate = { ...b(0, 0, 22), part: 'gate' as const };
    expect(validPlacement(gate, [], [-3, 1, 25])).toBe(true);
    expect(validPlacement(b(0, 1, 22), [gate], [-3, 1, 25])).toBe(false);
    expect(validPlacement(gate, [b(0, 1, 22)], [-3, 1, 25])).toBe(false);
    expect(validPlacement({ ...gate, y: 7 }, [], [-3, 1, 25])).toBe(false);
    expect(validPlacement({ ...b(0, 1, 22), part: 'roof' }, [], [-3, 1, 25])).toBe(false);
    expect(validPlacement({ ...b(0, 2, 22), part: 'roof' }, [b(0, 1, 22)], [-3, 1, 25])).toBe(true);
    expect(canBuildHome(starterHome(0, 22), [], [1.5, 1, 23.5])).toBe(false);
    expect(canBuildHome(starterHome(8, 22), [], [-3, 1, 25])).toBe(false);
  });
  it('finds a free nearby site and atomically builds, credits and persists it using actual blocks', () => {
    const save = freshSave();
    save.position = [2, 1, 27];
    save.inventory = [{ item: 'block', qty: 24 }];
    save.quests.q02 = { status: 'complete', progress: {} };
    save.quests.q09 = { status: 'active', progress: { plot: 1, craft: 24 } };
    useGame.setState({ save });
    const site = homeSite(save.blocks, save.position)!;
    expect(site).not.toBeNull();
    useGame.getState().buildHome(...site);
    const built = useGame.getState().save;
    expect(built.blocks).toHaveLength(24);
    expect(count(built.inventory, 'block')).toBe(0);
    expect(ready(built, 'q09')).toBe(true);
    expect(validateSave(JSON.parse(JSON.stringify(built))).blocks).toEqual(built.blocks);
    const gate = built.blocks.find((v) => v.part === 'gate')!;
    useGame.setState({
      target: `gate:${gate.x}:${gate.y}:${gate.z}`,
      save: { ...built, position: [gate.x + 0.5, 1, gate.z - 0.5] },
    });
    useGame.getState().interact();
    expect(useGame.getState().save.flags).toContain(`open:gate:${gate.x}:${gate.y}:${gate.z}`);
    useGame.getState().interact();
    expect(useGame.getState().save.flags).not.toContain(`open:gate:${gate.x}:${gate.y}:${gate.z}`);
    const roof = built.blocks.find(
      (v) => v.part === 'roof' && v.x === site[0] + 1 && v.z === site[1] + 1
    )!;
    useGame.getState().remove(roof);
    expect(count(useGame.getState().save.inventory, 'block')).toBe(1);
    expect(ready(useGame.getState().save, 'q09')).toBe(false);
  });
  it('refuses locked, underfunded and obstructed homes without partial charges or pieces', () => {
    const save = freshSave();
    save.position = [-3, 1, 25];
    save.inventory = [{ item: 'block', qty: 23 }];
    useGame.setState({ save });
    useGame.getState().buildHome(0, 22);
    expect(useGame.getState().save).toEqual(save);
    save.quests.q02 = { status: 'complete', progress: {} };
    useGame.getState().buildHome(0, 22);
    expect(useGame.getState().save).toEqual(save);
    save.inventory = [{ item: 'block', qty: 24 }];
    save.blocks = [b(0, 0, 22)];
    useGame.getState().buildHome(0, 22);
    expect(useGame.getState().save).toEqual(save);
    expect(useGame.getState().persist).not.toHaveBeenCalled();
  });
  it('refunds the actual placed item and removes obsolete gate state', () => {
    const save = freshSave(),
      gate = { ...b(0, 0, 22), part: 'gate' as const };
    save.blocks = [gate];
    save.flags = ['open:gate:0:0:22'];
    useGame.setState({ save });
    useGame.getState().remove({ ...gate, item: 'statue' });
    expect(useGame.getState().save.inventory).toEqual([{ item: 'block', qty: 1 }]);
    expect(useGame.getState().save.flags).not.toContain('open:gate:0:0:22');
  });
});

it('preserves legacy cube saves while rejecting malformed new building metadata', () => {
  const s = freshSave();
  s.blocks = [b(0, 0, 22)];
  expect(validateSave(structuredClone(s)).blocks).toEqual(s.blocks);
  const broken = { ...s, blocks: [{ ...b(0, 0, 22), part: 'gate' }, { ...b(0, 1, 22) }] };
  const before = structuredClone(broken);
  expect(() => validateSave(broken as never)).toThrow('buildings');
  expect(broken).toEqual(before);
  expect(() =>
    validateSave({ ...s, blocks: [{ ...b(0, 2, 22), part: 'roof', rotation: 7 }] } as never)
  ).toThrow('buildings');
});
