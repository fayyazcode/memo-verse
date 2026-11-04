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
