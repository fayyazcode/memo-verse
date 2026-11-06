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
const summon = (id: Species) => {
  useGame.setState({ dialogue: null, panel: null });
  game().tick(2.1);
  game().summon(id);
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
    summon('aquabub');
    target('plant');
    summon('mosshell');
    target('toughNode');
    claim('q07');
    accept('q08');
    gather('fragment');
    craft('chargedTreat');
    friend('zaplet');
    summon('zaplet');
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
    summon('zaplet');
    target('finalSwitch');
    summon('mosshell');
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
    summon('emberfox');
    for (let i = 0; i < 12; i++) {
      game().attack(true);
      game().tick(5.1);
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

describe('early forest treasure credit', () => {
  it('counts a chest opened before accepting the mission without repeating its treasure', () => {
    const s = freshSave();
    s.quests.q03 = { status: 'complete', progress: {} };
    s.position = [72, 1, 36];
    useGame.setState({ save: s });
    target('chest');
    const treasure = structuredClone(game().save);
    expect(treasure.coins).toBe(110);
    expect(count(treasure.inventory, 'crystal')).toBe(2);
    for (const id of ['ancientOak', 'riverBend', 'crystalClearing']) game().discover(id);
    accept('q10');
    expect(game().save.quests.q10.progress.chest).toBe(1);
    expect(game().save.coins).toBe(treasure.coins);
    expect(game().save.inventory).toEqual(treasure.inventory);
    expect(ready(game().save, 'q10')).toBe(true);
    game().claim('q10');
    expect(game().save.coins).toBe(285);
    const coins = game().save.coins;
    target('chest');
    game().claim('q10');
    expect(game().save.coins).toBe(coins);
    expect(count(game().save.inventory, 'crystal')).toBe(2);
  });
  it('can repair stale runtime progress by interacting with an already-opened chest', () => {
    const s = freshSave();
    s.flags = ['chest'];
    s.quests.q10 = { status: 'active', progress: {} };
    useGame.setState({ save: s });
    target('chest');
    expect(game().save.quests.q10.progress.chest).toBe(1);
    expect(game().save.coins).toBe(50);
    expect(game().save.inventory).toEqual([]);
  });
});

describe('all permanent mission accomplishments', () => {
  it('repairs stale legacy progress across all missions without replaying items, XP or rewards', async () => {
    const { validateSave } = await import('../src/game/store');
    const { LANDMARKS } = await import('../src/game/data');
    const { starterHome } = await import('../src/game/building');
    const s = freshSave();
    s.coins = 110;
    s.inventory = [{ item: 'crystal', qty: 2 }];
    s.flags = [
      'chest',
      'repaired',
      'guardianDefeated',
      ...['plant', 'toughNode', 'practiceSwitch', 'finalSwitch', 'passage'].map(
        (id) => 'ability:' + id
      ),
    ];
    s.discoveries = LANDMARKS.map((l) => l.id);
    s.blocks = starterHome(0, 22);
    for (const id of Object.keys(CREATURES) as Species[])
      s.creatures[id] = { hp: 60, xp: 0, friendship: 10 };
    for (const q of QUESTS) s.quests[q.id] = { status: 'active', progress: {} };
    const original = structuredClone(s),
      recovered = validateSave(s);
    for (const q of QUESTS)
      for (const o of q.objectives) {
        const permanent = [
          'discover',
          'befriend',
          'ability',
          'repair',
          'defeat',
          'open',
          'shelter',
        ].includes(o.event);
        expect(recovered.quests[q.id].progress[o.id] ?? 0, `${q.id}:${o.id}`).toBe(
          permanent ? o.count : 0
        );
      }
    expect(s).toEqual(original);
    expect(recovered.inventory).toEqual(s.inventory);
    expect(recovered.coins).toBe(s.coins);
    expect(recovered.xp).toBe(s.xp);
    expect(recovered.creatures).toEqual(s.creatures);
    expect(validateSave(recovered)).toEqual(recovered);
    expect(QUESTS.every((q) => recovered.quests[q.id].status === 'active')).toBe(true);
  });
  it('credits early utility actions when accepting their mission without replaying the utility rewards', () => {
    const s = freshSave();
    s.quests.q03 = { status: 'complete', progress: {} };
    s.flags = ['ability:plant', 'ability:toughNode', 'ability:practiceSwitch'];
    s.creatures.aquabub = { hp: 60, xp: 15, friendship: 10 };
    s.creatures.mosshell = { hp: 60, xp: 15, friendship: 10 };
    s.creatures.zaplet = { hp: 60, xp: 15, friendship: 10 };
    s.inventory = [
      { item: 'fruit', qty: 2 },
      { item: 'ore', qty: 3 },
    ];
    useGame.setState({ save: s });
    accept('q07');
    accept('q08');
    expect(ready(game().save, 'q07')).toBe(true);
    expect(game().save.quests.q08.progress.power).toBe(1);
    expect(game().save.quests.q08.progress.friend).toBe(1);
    expect(game().save.quests.q08.progress.fragment ?? 0).toBe(0);
    expect(game().save.quests.q08.progress.treat ?? 0).toBe(0);
    expect(game().save.inventory).toEqual(s.inventory);
    expect(game().save.coins).toBe(s.coins);
    expect(game().save.creatures).toEqual(s.creatures);
  });
  it('prevents every incomplete or already-claimed mission from paying twice', () => {
    for (const quest of QUESTS) {
      const s = freshSave();
      s.quests[quest.id] = { status: 'active', progress: {} };
      expect(ready(s, quest.id)).toBe(false);
      useGame.setState({ save: s });
      game().claim(quest.id);
      expect(game().save.coins).toBe(s.coins);
      useGame.setState({
        save: {
          ...s,
          quests: {
            [quest.id]: {
              status: 'complete',
              progress: Object.fromEntries(quest.objectives.map((o) => [o.id, o.count])),
            },
          },
        },
      });
      const before = structuredClone(game().save);
      game().claim(quest.id);
      expect(game().save).toEqual(before);
    }
  });
});

describe('mission delivery and conversation order', () => {
  it('requires collection objectives before resource deliveries and charges each delivery once', () => {
    for (const id of ['q02', 'q06']) {
      const quest = QUESTS.find((q) => q.id === id)!,
        objective = quest.objectives.find((o) => o.event === 'deliver')!;
      const s = freshSave();
      s.quests[id] = { status: 'active', progress: {} };
      s.inventory = Object.entries(objective.consume!).map(([item, qty]) => ({
        item: item as ItemId,
        qty,
      }));
      useGame.setState({ save: s });
      deliver(objective.target);
      expect(game().save.inventory).toEqual(s.inventory);
      expect(game().save.quests[id].progress[objective.id] ?? 0).toBe(0);
      useGame.setState({
        save: {
          ...s,
          quests: {
            [id]: {
              status: 'active',
              progress: Object.fromEntries(
                quest.objectives.filter((o) => o !== objective).map((o) => [o.id, o.count])
              ),
            },
          },
        },
      });
      deliver(objective.target);
      expect(game().save.inventory).toEqual([]);
      expect(ready(game().save, id)).toBe(true);
      const delivered = structuredClone(game().save);
      deliver(objective.target);
      expect(game().save).toEqual(delivered);
      game().claim(id);
      const paid = structuredClone(game().save);
      game().claim(id);
      expect(game().save).toEqual(paid);
      expect(paid.coins).toBe(s.coins + quest.coins);
    }
  });
  it('credits a nighttime mission conversation only after the resident comes outside', async () => {
    const { homePoint, resetVillagerVisits } = await import('../src/game/villagers');
    resetVillagerVisits();
    const s = freshSave();
    s.playTime = 600;
    s.position = homePoint('bloop', 3.5);
    s.quests.q04 = { status: 'active', progress: {} };
    useGame.setState({
      save: s,
      target: 'bloop',
      dialogue: null,
      panel: null,
      visitor: null,
      started: true,
    });
    game().interact();
    expect(game().save.quests.q04.progress.bloop ?? 0).toBe(0);
    game().tick(1);
    expect(game().dialogue).toBeNull();
    expect(game().save.quests.q04.progress.bloop ?? 0).toBe(0);
    game().tick(5);
    expect(game().dialogue).toBe('bloop');
    expect(game().save.quests.q04.progress.bloop).toBe(1);
    expect(game().save.coins).toBe(s.coins);
    expect(game().save.inventory).toEqual(s.inventory);
    resetVillagerVisits();
    useGame.setState({ dialogue: null, visitor: null });
  });
});
