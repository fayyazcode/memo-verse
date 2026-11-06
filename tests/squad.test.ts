import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ABILITIES,
  absorb,
  advanceSquad,
  cast,
  equipCreature,
  memberOf,
  newMember,
  newSquad,
  retreatPosition,
  squadOf,
  switchCreature,
  validSquad,
  type Slot,
} from '../src/game/squad';
import { freshSave, useGame, validateSave, type Save } from '../src/game/store';
import { CREATURES, type Species } from '../src/game/data';
import { defaultBindings, validBindings } from '../src/game/bindings';
import { abilityEffects, squadRuntime } from '../src/game/squad-runtime';
const species = Object.keys(CREATURES) as Species[];
function fixture(ids: Species[] = ['emberfox', 'aquabub', 'mosshell']): Save {
  const s = freshSave();
  s.position = [0, 1, 11];
  s.active = ids[0];
  s.creatures = Object.fromEntries(
    species.map((id) => [id, { hp: 105, xp: 4500, friendship: 42 }])
  );
  s.squad = {
    ...newSquad(s.active),
    equipped: ids,
    members: Object.fromEntries(species.map((id) => [id, newMember()])),
  };
  return s;
}
function step(s: Save, seconds: number) {
  for (let t = 0; t < seconds - 1e-8; t += 0.1) {
    s = advanceSquad(s, Math.min(0.1, seconds - t)).save;
    s = {
      ...s,
      playTime: s.playTime + 0.1,
      attackCooldown: Math.max(0, s.attackCooldown - 0.1),
      abilityCooldown: Math.max(0, s.abilityCooldown - 0.1),
    };
  }
  return s;
}
beforeEach(() => {
  vi.stubGlobal('document', { hidden: false });
  abilityEffects.length = 0;
  for (const r of Object.values(squadRuntime)) r.ready = false;
  useGame.setState({
    save: fixture(),
    started: true,
    panel: null,
    dialogue: null,
    target: null,
    persist: vi.fn(async () => {}),
  });
});
describe('squad membership and save compatibility', () => {
  it('equips three distinct owned creatures and rejects a fourth', () => {
    let s = fixture(['emberfox']);
    s = equipCreature(s, 'aquabub', true) as Save;
    s = equipCreature(s, 'mosshell', true) as Save;
    expect(s.squad!.equipped).toHaveLength(3);
    expect(typeof equipCreature(s, 'zaplet', true)).toBe('string');
    expect((equipCreature(s, 'emberfox', true) as Save).squad!.equipped).toHaveLength(3);
  });
  it('rejects unowned creatures and reserved workers', () => {
    const s = fixture();
    delete s.creatures.zaplet;
    expect(typeof equipCreature(s, 'zaplet', true)).toBe('string');
    s.flags.push('worker:zaplet');
    s.creatures.zaplet = { xp: 0, hp: 60, friendship: 10 };
    expect(equipCreature(s, 'zaplet', true)).toMatch(/work/);
  });
  it('only directly commands equipped healthy friends and enforces switch cooldown', () => {
    let s = fixture();
    expect(typeof switchCreature(s, 'zaplet')).toBe('string');
    s = switchCreature(s, 'aquabub') as Save;
    expect(s.active).toBe('aquabub');
    expect(typeof switchCreature(s, 'mosshell')).toBe('string');
    s = step(s, 2.1);
    expect((switchCreature(s, 'mosshell') as Save).active).toBe('mosshell');
    s.creatures.emberfox!.hp = 0;
    expect(typeof switchCreature(s, 'emberfox')).toBe('string');
  });
  it('preserves per-creature cooldown and charge when unequipped and reequipped', () => {
    let s = cast(fixture(), 'emberfox', 'Q', 'training1').save;
    s = equipCreature(s, 'emberfox', false) as Save;
    s = equipCreature(s, 'emberfox', true) as Save;
    expect(memberOf(s, 'emberfox').cooldowns.Q).toBe(5);
    expect(memberOf(s, 'emberfox').charge).toBe(10);
  });
  it('adapts a representative one-companion save without altering original progress', () => {
    const old = freshSave();
    old.active = 'aquabub';
    old.creatures.aquabub = { xp: 734, hp: 37, friendship: 61 };
    old.abilityCooldown = 4;
    old.coins = 777;
    old.inventory = [{ item: 'crystal', qty: 3 }];
    old.blocks = [{ x: 0, y: 0, z: 22, item: 'block' }];
    old.quests.q01 = { status: 'complete', progress: { moss: 1 } };
    old.revision = 12;
    const copy = structuredClone(old);
    const loaded = validateSave(old);
    expect(squadOf(loaded).equipped).toEqual(['aquabub']);
    expect(memberOf(loaded, 'aquabub').cooldowns.Q).toBe(4);
    expect(old).toEqual(copy);
    useGame.setState({ save: { ...loaded, squad: squadOf(loaded) } });
    expect(validateSave(JSON.parse(JSON.stringify(useGame.getState().save)))).toEqual({
      ...copy,
      squad: squadOf(copy),
    });
  });
  it('rejects malformed squads without mutating their stored data', () => {
    for (const mutate of [
      (s: Save) => s.squad!.equipped.push('emberfox'),
      (s: Save) => (s.squad!.members.emberfox!.charge = 101),
      (s: Save) => (s.squad!.members.emberfox!.cooldowns.Q = -1),
      (s: Save) => (s.squad!.target = 'moss'),
      (s: Save) => (s.squad!.equipped = ['zaplet']),
      (s: Save) =>
        (s.squad!.zones = [
          {
            species: 'emberfox',
            slot: 'R',
            position: [999, 0, 0],
            remaining: 1,
            pulse: 0,
            warning: true,
          },
        ]),
    ]) {
      const s = fixture();
      mutate(s);
      const snapshot = JSON.stringify(s);
      expect(() => validateSave(s)).toThrow('squad');
      expect(JSON.stringify(s)).toBe(snapshot);
    }
  });
  it('keeps valid squad state round-trippable with cooldowns, areas and charge', () => {
    let s = fixture();
    s = cast(s, 'emberfox', 'E', 'training1').save;
    expect(validSquad(s, s.squad!)).toBe(true);
    expect(validateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});
describe('real ability resolution', () => {
  it('applies basic damage and charge once and rejects cooldown retries', () => {
    const s = fixture();
    const r = cast(s, 'emberfox', 'basic', 'training1');
    expect(r.save.squad!.training[1]).toBe(230);
    expect(memberOf(r.save, 'emberfox').charge).toBe(5);
    expect(cast(r.save, 'emberfox', 'basic', 'training1').save).toBe(r.save);
    expect(s.squad!.training[1]).toBe(240);
  });
  it.each(species)('%s has working Q damage', (id) => {
    const s = fixture([id]);
    const r = cast(s, id, 'Q', 'training1');
    expect(r.error).toBeUndefined();
    expect(r.save.squad!.training[1]).toBeLessThan(240);
    expect(r.effects[0].species).toBe(id);
    expect(memberOf(r.save, id).cooldowns.Q).toBe(5);
  });
  it('rejects level-locked E and R without consuming cooldown or charge', () => {
    const s = fixture();
    s.creatures.emberfox!.xp = 0;
    expect(cast(s, 'emberfox', 'E', 'training1').error).toContain('level 5');
    s.squad!.members.emberfox!.charge = 100;
    expect(cast(s, 'emberfox', 'R', 'training1').error).toContain('level 10');
    expect(memberOf(s, 'emberfox').charge).toBe(100);
  });
  it('requires full ultimate charge, consumes it once, and preserves ultimate cooldown through switching', () => {
    let s = fixture();
    expect(cast(s, 'emberfox', 'R', 'training1').error).toContain('100');
    s.squad!.members.emberfox!.charge = 100;
    const r = cast(s, 'emberfox', 'R', 'training1');
    expect(memberOf(r.save, 'emberfox').charge).toBe(0);
    expect(memberOf(r.save, 'emberfox').cooldowns.R).toBe(45);
    expect(cast(r.save, 'emberfox', 'R', 'training1').save).toBe(r.save);
    s = switchCreature(r.save, 'aquabub') as Save;
    s = step(s, 2.1);
    s = switchCreature(s, 'emberfox') as Save;
    expect(memberOf(s, 'emberfox').cooldowns.R).toBeGreaterThan(42);
  });
  it('caps charge and grants one defeat bonus without coin rewards for practice', () => {
    const s = fixture();
    s.squad!.members.emberfox!.charge = 99;
    s.squad!.training[1] = 1;
    const r = cast(s, 'emberfox', 'basic', 'training1');
    expect(memberOf(r.save, 'emberfox').charge).toBe(100);
    expect(r.save.coins).toBe(s.coins);
    expect(r.save.flags).not.toContain('guardianDefeated');
    expect(cast(r.save, 'emberfox', 'Q', 'training1').error).toBeDefined();
  });
  it('heals the lowest-health nearby living ally, uses Refresh and does not revive', () => {
    const s = fixture(['aquabub', 'emberfox', 'mosshell']);
    s.hp = 10;
    s.creatures.emberfox!.hp = 0;
    const r = cast(s, 'aquabub', 'E');
    expect(r.save.hp).toBe(36);
    expect(r.save.creatures.emberfox!.hp).toBe(0);
    expect(memberOf(r.save, 'aquabub').charge).toBe(10);
    expect(cast(fixture(['aquabub']), 'aquabub', 'E').error).toContain('needs healing');
  });
  it('validates ally range before healing', () => {
    const s = fixture(['aquabub', 'emberfox']);
    s.creatures.emberfox!.hp = 1;
    expect(
      cast(s, 'aquabub', 'E', undefined, { aquabub: [0, 0, 11], emberfox: [50, 0, 0] }).error
    ).toBeDefined();
  });
  it('shields absorb damage and expire; Stone Skin reduces tank damage', () => {
    let s = cast(fixture(['mosshell', 'emberfox']), 'mosshell', 'E').save;
    expect(memberOf(s, 'emberfox').shield).toBe(22);
    absorb(s, 'emberfox', 10);
    expect(s.creatures.emberfox!.hp).toBe(105);
    expect(memberOf(s, 'emberfox').shield).toBe(12);
    s = step(s, 6.1);
    expect(memberOf(s, 'emberfox').shield).toBe(0);
    absorb(s, 'mosshell', 10);
    expect(s.creatures.mosshell!.hp).toBe(97);
  });
  it('rejects NPCs, neutral creatures, absent targets, out-of-range and dead casters', () => {
    const s = fixture();
    for (const id of ['moss', 'creature:zaplet', 'missing', 'guardian'])
      expect(cast(s, 'emberfox', 'Q', id).error).toBeDefined();
    s.position = [80, 1, 80];
    expect(cast(s, 'emberfox', 'Q', 'training1').error).toBeDefined();
    s.creatures.emberfox!.hp = 0;
    expect(cast(s, 'emberfox', 'Q', 'training1').error).toBeDefined();
  });
  it('Chain Lightning damages multiple nearby targets', () => {
    const s = fixture(['zaplet']);
    const r = cast(s, 'zaplet', 'E', 'training1');
    expect(r.save.squad!.training.every((h) => h < 240)).toBe(true);
  });
  it('Fireball gains Warmth near its own flame area', () => {
    const s = fixture();
    const plain = cast(s, 'emberfox', 'Q', 'training1').save.squad!.training[1];
    const fire = cast(s, 'emberfox', 'E', 'training1').save;
    const warmed = cast(fire, 'emberfox', 'Q', 'training1').save.squad!.training[1];
    expect(warmed).toBeLessThan(plain);
  });
  it('Meteor Burst warns before applying area damage', () => {
    const s = fixture();
    s.squad!.members.emberfox!.charge = 100;
    const r = cast(s, 'emberfox', 'R', 'training1');
    expect(r.save.squad!.training).toEqual([240, 240, 240]);
    expect(r.effects[0].animation).toBe('warning');
    expect(step(r.save, 0.5).squad!.training).toEqual([240, 240, 240]);
    expect(step(r.save, 0.9).squad!.training.every((h) => h < 240)).toBe(true);
  });
  it('Flame Trail and Thunderstorm pulse real damage and expire', () => {
    for (const [id, slot] of [
      ['emberfox', 'E'],
      ['zaplet', 'R'],
    ] as [Species, Slot][]) {
      const s = fixture([id]);
      s.squad!.members[id]!.charge = 100;
      const r = cast(s, id, slot, 'training1');
      const midway = step(r.save, 1.2);
      expect(midway.squad!.training[1]).toBeLessThan(240);
      expect(step(r.save, 5).squad!.zones).toHaveLength(0);
    }
  });
  it('Tidal Wave damages and pushes the Guardian; Earthquake stuns it', () => {
    for (const id of ['aquabub', 'mosshell'] as Species[]) {
      const s = fixture([id]);
      s.position = [91, 1, 20];
      s.flags = ['repaired'];
      s.squad!.members[id]!.charge = 100;
      const r = cast(s, id, 'R', 'guardian');
      expect(r.save.enemyHp).toBeLessThan(100);
      if (id === 'aquabub') expect(r.save.squad!.enemyPosition[0]).toBeGreaterThan(92);
      else expect(r.save.squad!.stun).toBe(2);
    }
  });
  it('Static Charge builds bounded damage and expires', () => {
    let s = fixture(['zaplet']);
    s = cast(s, 'zaplet', 'basic', 'training1').save;
    expect(memberOf(s, 'zaplet').static).toBe(1);
    s = step(s, 1.6);
    const hp = s.squad!.training[1];
    s = cast(s, 'zaplet', 'basic', 'training1').save;
    expect(hp - s.squad!.training[1]).toBe(11);
    s = step(s, 6.1);
    expect(memberOf(s, 'zaplet').static).toBe(0);
  });
});
describe('support AI and integrated store boundaries', () => {
  it('AI assists a nearby hostile and support heals allies', () => {
    const s = fixture();
    s.position = [91, 1, 20];
    s.flags = ['repaired'];
    s.hp = 20;
    const r = advanceSquad(s, 0.1);
    expect(r.save.enemyHp).toBeLessThan(100);
    expect(r.save.hp).toBeGreaterThan(20);
    expect(r.effects.some((e) => e.species !== 'emberfox')).toBe(true);
  });
  it('passive, retreat and critically injured AI do not attack', () => {
    for (const mode of ['passive', 'retreat', 'critical']) {
      const s = fixture();
      s.position = [91, 1, 20];
      s.flags = ['repaired'];
      if (mode === 'passive') s.squad!.stance = 'passive';
      if (mode === 'retreat') s.squad!.order = 'retreat';
      if (mode === 'critical') {
        s.creatures.aquabub!.hp = 1;
        s.creatures.mosshell!.hp = 1;
      }
      expect(advanceSquad(s, 0.1).save.enemyHp).toBe(100);
    }
  });
  it('AI does not attack practice targets without explicit focus or pull distant hostiles', () => {
    expect(advanceSquad(fixture(), 0.1).save.squad!.training).toEqual([240, 240, 240]);
    const s = fixture();
    s.flags = ['repaired'];
    expect(advanceSquad(s, 0.1).save.enemyHp).toBe(100);
    s.squad!.order = 'focus';
    s.squad!.target = 'training1';
    expect(advanceSquad(s, 0.1).save.squad!.training[1]).toBeLessThan(240);
  });
  it('stun delays enemy attacks, tank takes aggro, and defeated members stop acting', () => {
    let s = fixture(['mosshell']);
    s.position = [91, 1, 20];
    s.flags = ['repaired'];
    s.enemyCooldown = 0;
    s.squad!.stun = 1;
    useGame.setState({ save: s });
    useGame.getState().tick(0.1);
    expect(useGame.getState().save.creatures.mosshell!.hp).toBe(105);
    s = useGame.getState().save;
    s.squad!.stun = 0;
    useGame.setState({ save: s });
    useGame.getState().tick(0.1);
    expect(useGame.getState().save.creatures.mosshell!.hp).toBe(97);
  });
  it('menus, dialogue, hidden tabs and inactive play suppress casts and freeze timers', () => {
    for (const patch of [{ panel: 'squad' as const }, { dialogue: 'moss' }, { started: false }]) {
      const s = fixture();
      useGame.setState({ save: s, started: true, panel: null, dialogue: null, ...patch });
      useGame.getState().castAbility('Q', 'training1');
      useGame.getState().tick(0.1);
      expect(useGame.getState().save).toBe(s);
    }
    useGame.setState({ save: fixture(), started: true, panel: null, dialogue: null });
    vi.stubGlobal('document', { hidden: true });
    const s = useGame.getState().save;
    useGame.getState().castAbility('Q', 'training1');
    useGame.getState().tick(1);
    expect(useGame.getState().save).toBe(s);
  });
  it('legacy attack and new ability buttons share cooldowns', () => {
    useGame.getState().attack(true);
    const s = useGame.getState().save;
    useGame.getState().castAbility('Q', 'training1');
    expect(useGame.getState().save).toBe(s);
  });
  it('Guardian rewards and original quest completion occur once, including AI kills', () => {
    const s = fixture();
    s.position = [91, 1, 20];
    s.flags = ['repaired'];
    s.enemyHp = 1;
    s.quests.q04 = { status: 'active', progress: {} };
    useGame.setState({ save: s });
    useGame.getState().tick(0.1);
    const after = useGame.getState().save;
    expect(after.coins).toBe(130);
    expect(after.quests.q04.progress.battle).toBe(1);
    useGame.getState().tick(0.1);
    expect(useGame.getState().save.coins).toBe(130);
  });
  it('control bindings reject duplicates and preserve interaction/movement keys', () => {
    expect(validBindings(defaultBindings)).toBe(true);
    expect(validBindings({ ...defaultBindings, E: 'KeyE' })).toBe(false);
    expect(validBindings({ ...defaultBindings, E: 'KeyQ' })).toBe(false);
    expect(validBindings({ ...defaultBindings, Q: 'KeyT' })).toBe(true);
  });
});

describe('timing and command edge cases', () => {
  it('burn and storm have bounded, exact pulse counts at the fixed simulation step', () => {
    for (const [id, slot, seconds, damage] of [
      ['emberfox', 'E', 3.1, 27],
      ['zaplet', 'R', 4.1, 52],
    ] as [Species, Slot, number, number][]) {
      const s = fixture([id]);
      s.squad!.members[id]!.charge = 100;
      const after = step(cast(s, id, slot, 'training1').save, seconds);
      expect(after.squad!.training[1]).toBe(240 - damage);
    }
  });
  it('support tank shields allies automatically during a threat', () => {
    const s = fixture(['emberfox', 'mosshell']);
    s.position = [91, 1, 20];
    s.flags = ['repaired'];
    const after = advanceSquad(s, 0.1).save;
    expect(memberOf(after, 'mosshell').shield).toBe(22);
    expect(memberOf(after, 'emberfox').shield).toBe(22);
  });
  it('removing or recalling a commanded friend cannot erase the switch cooldown', () => {
    let s = switchCreature(fixture(), 'aquabub') as Save;
    expect(typeof equipCreature(s, 'aquabub', false)).toBe('string');
    useGame.setState({ save: s });
    useGame.getState().recallSquad();
    s = useGame.getState().save;
    expect(s.squad!.equipped).toHaveLength(0);
    expect(typeof equipCreature(s, 'mosshell', true)).toBe('string');
    expect(memberOf(s, 'aquabub').cooldowns).toEqual(newMember().cooldowns);
  });
});

describe('combat checkpoints and displaced targets', () => {
  it('checkpoints retaliation even when the whole hit is absorbed by a shield', () => {
    let s = fixture(['mosshell']);
    s.position = [91, 1, 20];
    s.flags = ['repaired'];
    s.enemyCooldown = 0;
    s = cast(s, 'mosshell', 'E').save;
    useGame.setState({ save: s });
    useGame.getState().tick(0.1);
    expect(useGame.getState().save.creatures.mosshell!.hp).toBe(105);
    expect(memberOf(useGame.getState().save, 'mosshell').shield).toBe(14);
    expect(useGame.getState().persist).toHaveBeenCalledOnce();
  });
  it('validates basic attack range against the pushed Guardian position', () => {
    const s = fixture(['aquabub']);
    s.position = [99, 1, 20];
    s.flags = ['repaired'];
    s.squad!.enemyPosition = [96, 0, 20];
    expect(cast(s, 'aquabub', 'basic', 'guardian').save.enemyHp).toBe(90);
  });
});

describe('survival behavior', () => {
  it('retreats away from threats in every world direction inside the follow leash', () => {
    for (const threat of [
      [0, 0, 5],
      [0, 0, -5],
      [5, 0, 0],
      [-5, 0, 0],
    ] as [number, number, number][]) {
      const p = retreatPosition([0, 1, 0], 2, threat);
      expect(Math.hypot(p[0] - threat[0], p[2] - threat[2])).toBeGreaterThan(8);
      expect(Math.hypot(p[0], p[2])).toBeLessThan(20);
    }
  });
  it('critically injured support heals before fleeing without attacking', () => {
    const s = fixture(['emberfox', 'aquabub']);
    s.position = [91, 1, 20];
    s.flags = ['repaired'];
    s.creatures.aquabub!.hp = 1;
    const after = advanceSquad(s, 0.1).save;
    expect(after.creatures.aquabub!.hp).toBeGreaterThan(1);
    expect(after.enemyHp).toBe(100);
  });
});
