import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gaitPose, attackPose, cameraDistance, SKINS } from '../src/game/appearance';
import { freshSave, useGame, defaultSettings } from '../src/game/store';
import { playerRuntime, companionRuntime } from '../src/game/input';
describe('grounded gait and camera', () => {
  it('rests feet when stopped and alternates diagonal walking pairs', () => {
    expect(gaitPose(1, 0, 0)).toEqual({ swing: 0, lift: 0 });
    expect(gaitPose(0.2, 2, 0).swing).toBeCloseTo(-gaitPose(0.2, 2, 1).swing);
    expect(gaitPose(0.2, 2, 0)).toEqual(gaitPose(0.2, 2, 3));
  });
  it('keeps lift nonnegative and attack poses return to rest', () => {
    for (let d = 0; d < 4; d += 0.1) expect(gaitPose(d, 3, 0).lift).toBeGreaterThanOrEqual(0);
    expect(attackPose(0, 0)).toBe(0);
    expect(attackPose(325, 0)).toBeCloseTo(1);
    expect(attackPose(650, 0)).toBeCloseTo(0);
  });
  it('uses a farther mobile camera without changing desktop zoom', () => {
    expect(cameraDistance(defaultSettings, true)).toBe(17);
    expect(cameraDistance(defaultSettings, false)).toBe(13);
  });
  it('provides five distinct selectable outfits', () => {
    expect(Object.keys(SKINS)).toHaveLength(5);
    expect(new Set(Object.values(SKINS).map((s) => s.hoodie)).size).toBe(5);
  });
});
describe('attack animation intent', () => {
  beforeEach(() => {
    useGame.setState({ save: freshSave(), persist: vi.fn(async () => {}) });
    playerRuntime.action = 'idle';
    companionRuntime.attackUntil = 0;
  });
  it('plays a practice attack without awarding damage or loot', () => {
    useGame.getState().attack();
    expect(playerRuntime.action).toBe('attack');
    expect(playerRuntime.actionUntil).toBeGreaterThan(Date.now());
    expect(useGame.getState().save.enemyHp).toBe(100);
    expect(useGame.getState().save.coins).toBe(50);
  });
  it('animates a healthy companion and preserves combat cooldown rules', () => {
    const s = freshSave();
    s.position = [92, 1, 20];
    s.flags = ['repaired'];
    s.active = 'emberfox';
    s.creatures.emberfox = { hp: 60, xp: 0, friendship: 20 };
    useGame.setState({ save: s });
    useGame.getState().attack(true);
    expect(companionRuntime.elemental).toBe(true);
    expect(companionRuntime.attackUntil).toBeGreaterThan(Date.now());
    const hp = useGame.getState().save.enemyHp;
    const started = companionRuntime.attackStarted;
    useGame.getState().attack(true);
    expect(useGame.getState().save.enemyHp).toBe(hp);
    expect(companionRuntime.attackStarted).toBe(started);
  });
});
