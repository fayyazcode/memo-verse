import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CREATURES, NPCS, OBJECTS, QUESTS, type ItemId, type Species } from '../src/game/data';
import { deliver, freshSave, ready, useGame } from '../src/game/store';
import { count, validShelter, type Block } from '../src/game/rules';
const game = () => useGame.getState();
const target = (id: string) => {
  useGame.setState({ target: id });
  game().interact();
};
const accept = (id: string) => {
  const q = QUESTS.find((q) => q.id === id)!;
  game().talk(q.giver);
  game().accept(id);
};
const claim = (id: string) => {
  expect(ready(game().save, id), id + ' should be complete').toBe(true);
  game().claim(id);
  expect(game().save.quests[id].status).toBe('complete');
};
const gather = (id: string) => {
  const obj = OBJECTS.find((o) => o.id === id)!;
  game().setPosition([obj.pos[0], 1, obj.pos[2]]);
  game().gather(id);
};
const craft = (id: ItemId, n = 1) => {
  game().setPosition([10, 1, 11]);
  for (let i = 0; i < n; i++) game().craft(id);
};
const friend = (id: Species) => {
  const c = CREATURES[id];
  game().setPosition([c.pos[0], 1, c.pos[2]]);
  target('creature:' + id);
  expect(game().save.creatures[id]).toBeDefined();
};
beforeEach(() => {
  useGame.setState({
    save: freshSave(),
    dialogue: null,
    panel: null,
    started: true,
    persist: vi.fn(async () => {}),
  });
});
describe('complete campaign logic integration', () => {
  it('allows all ten missions from a fresh state without debug inventory or rewards', () => {
    accept('q01');
    game().discover('square');
    game().talk('foxy');
    game().talk('bruno');
    claim('q01');
    accept('q02');
    gather('tree0');
    gather('tree1');
    gather('rock0');
    gather('rock1');
    gather('fiber0');
    gather('fiber1');
    deliver('bruno');
    claim('q02');
    accept('q03');
    gather('bush0');
    gather('fiber2');
    craft('warmTreat');
    friend('emberfox');
    claim('q03');
    accept('q05');
    deliver('bloop');
    claim('q05');
    gather('tree2');
    gather('tree3');
    gather('rock2');
    craft('pickaxe');
    expect(count(game().save.inventory, 'pickaxe')).toBe(1);
    accept('q06');
    game().discover('crystalClearing');
    gather('crystal0');
    gather('crystal1');
    deliver('bloop');
    claim('q06');
    accept('q07');
    gather('fruit');
    friend('aquabub');
    gather('rock3');
    gather('bush1');
    craft('mineralSnack');
    friend('mosshell');
    game().summon('aquabub');
    target('plant');
    game().summon('mosshell');
    target('toughNode');
    claim('q07');
    accept('q08');
    gather('fragment');
    craft('chargedTreat');
    friend('zaplet');
    game().summon('zaplet');
    target('practiceSwitch');
    claim('q08');
    accept('q09');
    game().discover('plot');
    gather('tree4');
    gather('tree5');
    craft('block', 6);
    const shelter: Block[] = [
      [0, 0, 22],
      [0, 1, 22],
      [2, 0, 22],
      [2, 1, 22],
      [1, 0, 23],
      [1, 1, 23],
      [0, 0, 23],
      [2, 0, 23],
      [0, 1, 23],
      [2, 1, 23],
      [0, 2, 22],
      [1, 2, 22],
    ].map(([x, y, z]) => ({ x, y, z, item: 'block' }));
    game().setPosition([0, 1, 18]);
    for (const b of shelter) game().place(b);
    expect(game().save.blocks).toHaveLength(12);
    expect(validShelter(game().save.blocks)).toBe(true);
    claim('q09');
    accept('q10');
    game().discover('ancientOak');
    game().discover('riverBend');
    target('chest');
    claim('q10');
    accept('q04');
    game().talk('bloop');
    game().summon('zaplet');
    target('finalSwitch');
    game().summon('mosshell');
    target('passage');
    gather('tree6');
    gather('tree7');
    gather('tree8');
    gather('rock4');
    gather('rock5');
    gather('rock6');
    gather('ore0');
    gather('ore1');
    craft('processedWood', 6);
    craft('refinedStone', 4);
    target('repair');
    expect(game().save.flags).toContain('repaired');
    game().setPosition([91, 1, 20]);
    game().summon('emberfox');
    for (let i = 0; i < 12; i++) {
      useGame.setState((s) => ({ save: { ...s.save, abilityCooldown: 0 } }));
      game().attack(true);
    }
    expect(game().save.flags).toContain('guardianDefeated');
    claim('q04');
    expect(QUESTS.every((q) => game().save.quests[q.id]?.status === 'complete')).toBe(true);
    expect(Object.keys(game().save.creatures)).toHaveLength(4);
    expect(game().save.flags).toContain('adventureComplete');
  });
  it('counts new gathering only after quest acceptance', () => {
    const s = freshSave();
    s.quests.q01 = { status: 'complete', progress: {} };
    useGame.setState({ save: s });
    gather('tree0');
    accept('q02');
    expect(game().save.quests.q02.progress.wood ?? 0).toBe(0);
    gather('tree1');
    expect(game().save.quests.q02.progress.wood).toBe(4);
  });
  it('prevents attacks during cooldown and duplicate encounter rewards', () => {
    const s = freshSave();
    s.active = 'emberfox';
    s.creatures.emberfox = { hp: 60, xp: 0, friendship: 10 };
    s.flags = ['repaired'];
    s.position = [92, 1, 20];
    useGame.setState({ save: s });
    game().attack();
    const after = game().save.enemyHp;
    game().attack();
    expect(game().save.enemyHp).toBe(after);
    useGame.setState((st) => ({ save: { ...st.save, enemyHp: 1, attackCooldown: 0 } }));
    game().attack();
    const coins = game().save.coins;
    game().attack();
    expect(game().save.coins).toBe(coins);
  });
});
