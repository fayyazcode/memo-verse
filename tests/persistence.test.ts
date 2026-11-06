import { cast, newMember, newSquad, squadOf } from '../src/game/squad';
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDB } from 'idb';
import { freshSave, loadData, saveData, useGame } from '../src/game/store';
beforeEach(async () => {
  const db = await openDB('momoverse', 1, {
    upgrade(db) {
      db.createObjectStore('saves');
    },
  });
  await db.clear('saves');
  useGame.setState({
    save: freshSave(),
    started: true,
    panel: null,
    dialogue: null,
    saveStatus: 'Not saved yet',
  });
});
describe('IndexedDB persistence', () => {
  it('persists and restores buildings, quests and creature state', async () => {
    const s = freshSave();
    s.blocks = [{ x: 0, y: 0, z: 20, item: 'block' }];
    s.quests.q01 = { status: 'active', progress: { moss: 1 } };
    s.creatures.emberfox = { xp: 150, hp: 55, friendship: 40 };
    s.active = 'emberfox';
    await saveData(s);
    expect(await loadData()).toEqual(s);
  });
  it('serializes rapid checkpoints without losing inventory changes', async () => {
    useGame.setState((s) => ({ save: { ...s.save, inventory: [{ item: 'wood', qty: 4 }] } }));
    const first = useGame.getState().persist();
    useGame.setState((s) => ({ save: { ...s.save, inventory: [{ item: 'wood', qty: 8 }] } }));
    const second = useGame.getState().persist();
    await Promise.all([first, second]);
    expect((await loadData())?.inventory).toEqual([{ item: 'wood', qty: 8 }]);
    expect((await loadData())?.revision).toBe(2);
  });
  it('rejects stale writes instead of overwriting another session', async () => {
    await saveData({ ...freshSave(), revision: 3, coins: 900 });
    await useGame.getState().persist();
    expect(useGame.getState().saveStatus).toBe('Save failed');
    expect(useGame.getState().notice).toContain('Save conflict');
    expect((await loadData())?.coins).toBe(900);
  });
  it('can explicitly start fresh over an existing adventure', async () => {
    await saveData({ ...freshSave(), revision: 4, coins: 999 });
    await useGame.getState().start(false);
    expect(useGame.getState().saveStatus).toBe('Saved locally');
    expect((await loadData())?.coins).toBe(50);
    expect((await loadData())?.revision).toBe(5);
  });
});

describe('Phase 1 compatible persistence', () => {
  it('loads and checkpoints a real legacy save without losing its original progress', async () => {
    const old = freshSave();
    old.active = 'aquabub';
    old.creatures.aquabub = { xp: 634, hp: 37, friendship: 52 };
    old.coins = 721;
    old.inventory = [{ item: 'stone', qty: 9 }];
    old.blocks = [{ x: 0, y: 0, z: 22, item: 'block' }];
    old.quests.q01 = { status: 'complete', progress: { moss: 1 } };
    old.revision = 7;
    await saveData(old);
    await useGame.getState().start(true);
    const loaded = (await loadData())!;
    expect(loaded.squad!.equipped).toEqual(['aquabub']);
    expect({ ...loaded, squad: undefined, revision: 7 }).toEqual({ ...old, squad: undefined });
  });
  it('retains abilities, charge and shields across actual IndexedDB serialization', async () => {
    let s = freshSave();
    s.active = 'mosshell';
    s.position = [0, 1, 11];
    s.creatures.mosshell = { xp: 4500, hp: 105, friendship: 55 };
    s.squad = { ...newSquad('mosshell'), members: { mosshell: { ...newMember(), charge: 80 } } };
    s = cast(s, 'mosshell', 'E').save;
    await saveData(s);
    const loaded = (await loadData())!;
    expect(loaded).toEqual(s);
    expect(loaded.squad!.members.mosshell!.cooldowns.E).toBe(10);
    expect(loaded.squad!.members.mosshell!.charge).toBe(90);
  });
  it('preserves an invalid explicit squad on disk instead of resetting it', async () => {
    const bad = { ...freshSave(), squad: { ...newSquad(null), equipped: ['unknown'] } };
    const db = await openDB('momoverse', 1);
    await db.put('saves', bad, 'adventure');
    await expect(loadData()).rejects.toThrow('squad');
    expect(await db.get('saves', 'adventure')).toEqual(bad);
  });
});

describe('stuck forest-secret save repair', () => {
  it('repairs an active legacy mission on load and checkpoints without duplicating treasure', async () => {
    const old = freshSave();
    old.flags = ['chest'];
    old.coins = 110;
    old.inventory = [{ item: 'crystal', qty: 2 }];
    old.revision = 8;
    old.quests.q10 = { status: 'active', progress: { oak: 1, river: 1, crystal: 1 } };
    await saveData(old);
    const snapshot = structuredClone(old);
    const loaded = (await loadData())!;
    expect(loaded.quests.q10.progress).toEqual({ oak: 1, river: 1, crystal: 1, chest: 1 });
    expect(loaded.coins).toBe(110);
    expect(loaded.inventory).toEqual(old.inventory);
    expect(old).toEqual(snapshot);
    const db = await openDB('momoverse', 1);
    expect(await db.get('saves', 'adventure')).toEqual(old);
    await useGame.getState().start(true);
    const repaired = (await loadData())!;
    expect(repaired.quests.q10.progress.chest).toBe(1);
    expect(repaired.revision).toBe(9);
    expect(repaired.coins).toBe(110);
    expect(repaired.inventory).toEqual(old.inventory);
  });
  it('does not credit an unopened chest or change completed missions', async () => {
    const s = freshSave();
    s.quests.q10 = { status: 'active', progress: {} };
    await saveData(s);
    expect((await loadData())!.quests.q10.progress.chest).toBeUndefined();
    s.flags = ['chest'];
    s.quests.q10.status = 'complete';
    await saveData(s);
    expect(await loadData()).toEqual(s);
  });
});
