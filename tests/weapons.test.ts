import { beforeEach, describe, expect, it, vi } from 'vitest';
import { freshSave, useGame, validateSave } from '../src/game/store';
import { flyArrows, strike, weaponOf } from '../src/game/weapons';
import { advanceSquad, newSquad, squadOf } from '../src/game/squad';
import { playerRuntime } from '../src/game/input';
const fixture = () => ({
  ...freshSave(),
  position: [17, 1, 21.2] as [number, number, number],
  squad: newSquad(null),
});
beforeEach(() => {
  useGame.setState({
    save: fixture(),
    started: true,
    panel: null,
    dialogue: null,
    build: false,
    arrows: [],
    target: 'hunt0',
    persist: vi.fn(async () => {}),
  });
});
describe('player weapons and monster retaliation', () => {
  it('lets a player without any companion strike with a sword and respects cooldowns', () => {
    useGame.getState().attack();
    expect(squadOf(useGame.getState().save).hunting!.hp[0]).toBe(52);
    expect(playerRuntime.action).toBe('attack');
    const after = useGame.getState().save;
    useGame.getState().attack();
    expect(useGame.getState().save).toBe(after);
    useGame.getState().switchWeapon('bow');
    useGame.getState().attack();
    expect(useGame.getState().arrows).toHaveLength(0);
  });
  it('uses weapon range and prioritizes a reachable hostile over a stale distant target', () => {
    const s = fixture();
    s.position = [17, 1, 20];
    expect(strike(s, 'hunt0', 0).save.squad!.hunting!.hp[0]).toBe(70);
    s.position = [17, 1, 21.2];
    expect(strike(s, 'guardian', 0).save.squad!.hunting!.hp[0]).toBe(52);
    expect(s.squad!.hunting!.hp[0]).toBe(70);
  });
  it('keeps companion basic attacks available beyond sword range with their own cooldown', () => {
    const s = fixture();
    s.position = [14.5, 1, 21];
    s.active = 'aquabub';
    s.creatures.aquabub = { hp: 60, xp: 0, friendship: 10 };
    s.squad = newSquad('aquabub');
    useGame.setState({ save: s });
    useGame.getState().attack();
    const result = useGame.getState().save;
    expect(result.squad!.hunting!.hp[0]).toBe(60);
    expect(result.squad!.members.aquabub!.cooldowns.basic).toBe(1.5);
    expect(result.attackCooldown).toBe(0.55);
  });
  it('launches a straight arrow without immediate damage and hits once at range', () => {
    const s = {
      ...fixture(),
      weapon: 'bow' as const,
      position: [17, 1, 20] as [number, number, number],
    };
    const shot = strike(s, 'hunt0', 0);
    expect(shot.save.squad!.hunting!.hp[0]).toBe(70);
    let state = { save: shot.save, arrows: [shot.arrow!] };
    for (let i = 0; i < 10; i++) state = flyArrows(state.save, state.arrows, 0.1);
    expect(state.save.squad!.hunting!.hp[0]).toBe(56);
    expect(state.arrows).toHaveLength(0);
    expect(flyArrows(state.save, [], 1).save).toBe(state.save);
  });
  it('permits dodging an arrow and enforces range and finite lifetime', () => {
    const s = {
      ...fixture(),
      weapon: 'bow' as const,
      position: [17, 1, 20] as [number, number, number],
    };
    const shot = strike(s, 'hunt0', 0);
    shot.save.squad!.hunting!.positions[0] = [14, 0, 23];
    let state = { save: shot.save, arrows: [shot.arrow!] };
    for (let i = 0; i < 15; i++) state = flyArrows(state.save, state.arrows, 0.1);
    expect(state.save.squad!.hunting!.hp[0]).toBe(70);
    expect(state.arrows).toHaveLength(0);
    const outside = { ...s, position: [-40, 1, -40] as [number, number, number] };
    expect(strike(outside, 'hunt0', 0).target).toBeNull();
  });
  it('awards sword and arrow kills only once and retains loot and Guardian quest events', () => {
    const s = fixture();
    s.squad!.hunting!.hp[0] = 1;
    const kill = strike(s, 'hunt0', 0).save;
    expect(kill.coins).toBe(53);
    expect(kill.squad!.hunting!.loot[0]).toBe(true);
    expect(strike(kill, 'hunt0', 0).save.coins).toBe(53);
    const guardian = {
      ...freshSave(),
      position: [92, 1, 20] as [number, number, number],
      flags: ['repaired'],
      enemyHp: 1,
    };
    guardian.quests.q04 = { status: 'active', progress: {} };
    useGame.setState({ save: guardian, target: 'guardian' });
    useGame.getState().attack();
    expect(useGame.getState().save.flags).toContain('guardianDefeated');
    expect(useGame.getState().save.coins).toBe(130);
    expect(useGame.getState().save.quests.q04.progress.battle).toBe(1);
  });
  it('damages the closest actual victim instead of redirecting all hits to a nearby pet', () => {
    const s = fixture();
    s.position = [17, 1, 23];
    s.active = 'mosshell';
    s.creatures.mosshell = { hp: 60, xp: 0, friendship: 10 };
    s.squad = newSquad('mosshell');
    s.squad.hunting!.cooldown[0] = 0;
    const warning = advanceSquad(s, 0.1, { mosshell: [19, 0, 23] }).save;
    const hit = advanceSquad(warning, 0.65, { mosshell: [19, 0, 23] }).save;
    expect(hit.hp).toBe(97);
    expect(hit.creatures.mosshell!.hp).toBe(60);
    const warning2 = advanceSquad({ ...s, position: [19, 1, 23] }, 0.1, {
      mosshell: [17, 0, 23],
    }).save;
    const hit2 = advanceSquad(warning2, 0.65, { mosshell: [17, 0, 23] }).save;
    expect(hit2.hp).toBe(100);
    expect(hit2.creatures.mosshell!.hp).toBe(58);
  });
  it('resolves bow kills through the live tick with one payout and the original finale objective', () => {
    const s = {
      ...freshSave(),
      weapon: 'bow' as const,
      position: [92, 1, 15] as [number, number, number],
      flags: ['repaired'],
      enemyHp: 1,
      quests: { q04: { status: 'active' as const, progress: {} } },
    };
    useGame.setState({ save: s, target: 'guardian' });
    useGame.getState().attack();
    expect(useGame.getState().save.enemyHp).toBe(1);
    useGame.getState().tick(1);
    const won = useGame.getState().save;
    expect(won.flags).toContain('guardianDefeated');
    expect(won.quests.q04.progress.battle).toBe(1);
    expect(won.coins).toBe(130);
    useGame.getState().tick(1);
    expect(useGame.getState().save.coins).toBe(130);
    const monster = { ...fixture(), weapon: 'bow' as const };
    monster.squad!.hunting!.hp[0] = 1;
    useGame.setState({ save: monster, target: 'hunt0', arrows: [] });
    useGame.getState().attack();
    useGame.getState().tick(1);
    expect(useGame.getState().save.coins).toBe(53);
    expect(squadOf(useGame.getState().save).hunting!.loot[0]).toBe(true);
  });
  it('returns a defeated solo player to the village and clears in-flight shots', () => {
    const s = fixture();
    s.position = [17, 1, 23];
    s.hp = 1;
    s.squad!.hunting!.windup[0] = 0.1;
    useGame.setState({
      save: s,
      arrows: [{ position: [17, 1, 20], direction: [0, 0, -1], remaining: 5, target: null }],
    });
    useGame.getState().tick(0.1);
    expect(useGame.getState().save.position).toEqual([0, 1, 5]);
    expect(useGame.getState().save.hp).toBe(100);
    expect(useGame.getState().arrows).toEqual([]);
  });
  it('preserves old saves, persists a valid weapon and rejects malformed equipment', () => {
    const s = freshSave();
    expect(weaponOf(validateSave(s))).toBe('sword');
    expect(s.weapon).toBeUndefined();
    expect(weaponOf(validateSave({ ...s, weapon: 'bow' }))).toBe('bow');
    expect(() => validateSave({ ...s, weapon: 'laser' })).toThrow('Invalid saved weapon');
  });
  it('pauses personal attacks and arrows in menus and building mode', () => {
    useGame.getState().switchWeapon('bow');
    useGame.getState().attack();
    const shots = useGame.getState().arrows;
    useGame.setState({ panel: 'inventory' });
    useGame.getState().tick(1);
    useGame.getState().attack();
    expect(useGame.getState().arrows).toBe(shots);
    useGame.setState({ panel: null, build: true, save: fixture(), arrows: [] });
    useGame.getState().attack();
    expect(squadOf(useGame.getState().save).hunting!.hp[0]).toBe(70);
  });
});
