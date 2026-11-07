import { describe, expect, it } from 'vitest';
import {
  addPlayer,
  attack,
  connected,
  createRoom,
  finish,
  move,
  setReady,
  snapshot,
  switchWeapon,
  tickRoom,
  type Room,
} from '../src/arena/rules';
const pair = () => {
  const r = createRoom('TEST234');
  addPlayer(r, 'one', 'Player One', 'meadow');
  addPlayer(r, 'two', 'Player Two', 'river');
  return r;
};
const run = (r: Room, seconds: number) => {
  for (let i = 0; i < Math.round(seconds / 0.05); i++) tickRoom(r, 0.05);
};
const fight = () => {
  const r = pair();
  setReady(r, 'one');
  setReady(r, 'two');
  run(r, 3);
  return r;
};
describe('authoritative versus arena rules', () => {
  it('starts only after two real players are ready and the full countdown has elapsed', () => {
    const r = pair();
    expect(addPlayer(r, 'three', 'Intruder', 'meadow')).toBe(false);
    setReady(r, 'one');
    expect(r.phase).toBe('waiting');
    setReady(r, 'two');
    expect(r.phase).toBe('countdown');
    expect(attack(r, 'one')).toBe(false);
    run(r, 2.9);
    expect(r.phase).toBe('countdown');
    run(r, 0.1);
    expect(r.phase).toBe('fighting');
    expect(r.players.map((p) => p.hp)).toEqual([100, 100]);
  });
  it('normalizes direction, caps speed, stops stale movement and confines both players to the ring', () => {
    const r = fight();
    move(r, 'one', { x: 1, z: 1 });
    tickRoom(r, 0.1);
    expect(Math.hypot(r.players[0].position.x + 4, r.players[0].position.z)).toBeCloseTo(0.45);
    run(r, 1);
    const stopped = { ...r.players[0].position };
    run(r, 1);
    expect(r.players[0].position).toEqual(stopped);
    for (let i = 0; i < 200; i++) {
      move(r, 'one', { x: -1, z: 1 });
      tickRoom(r, 0.05);
    }
    expect(Math.hypot(r.players[0].position.x, r.players[0].position.z)).toBeLessThanOrEqual(
      7.500001
    );
    const before = snapshot(r);
    move(r, 'one', { x: NaN, z: Infinity });
    expect(snapshot(r)).toEqual(before);
  });
  it('checks range and cooldown on the server, including after switching weapons', () => {
    const r = fight();
    expect(attack(r, 'one')).toBe(true);
    expect(r.players[1].hp).toBe(100);
    r.players[0].position = { x: 2, z: 0 };
    expect(attack(r, 'one')).toBe(false);
    switchWeapon(r, 'one');
    expect(attack(r, 'one')).toBe(false);
    run(r, 1);
    switchWeapon(r, 'one');
    attack(r, 'one');
    expect(r.players[1].hp).toBe(80);
    expect(attack(r, 'one')).toBe(false);
  });
  it('moves arrows over time and applies a single hit without client damage claims', () => {
    const r = fight();
    switchWeapon(r, 'one');
    attack(r, 'one');
    expect(r.players[1].hp).toBe(100);
    expect(r.shots).toHaveLength(1);
    run(r, 0.7);
    expect(r.players[1].hp).toBe(86);
    expect(r.shots).toHaveLength(0);
    run(r, 1);
    expect(r.players[1].hp).toBe(86);
  });
  it('allows a moving player to dodge and expires missed arrows', () => {
    const r = fight();
    switchWeapon(r, 'one');
    attack(r, 'one');
    for (let i = 0; i < 40; i++) {
      move(r, 'two', { x: 0, z: 1 });
      tickRoom(r, 0.05);
    }
    expect(r.players[1].hp).toBe(100);
    expect(r.shots).toHaveLength(0);
  });
  it('stops a knockout immediately and requires both players to ready for a fresh rematch', () => {
    const r = fight();
    r.players[0].position = { x: 2, z: 0 };
    r.players[1].hp = 20;
    attack(r, 'one');
    expect(r.phase).toBe('finished');
    expect(r.winner).toBe('one');
    expect(attack(r, 'two')).toBe(false);
    setReady(r, 'one');
    expect(r.phase).toBe('finished');
    setReady(r, 'two');
    expect(r.phase).toBe('countdown');
    expect(r.round).toBe(2);
    expect(r.players.map((p) => p.hp)).toEqual([100, 100]);
    expect(r.remaining).toBe(180);
  });
  it('resolves timed rounds by health and supports a draw', () => {
    const r = fight();
    r.remaining = 0.05;
    r.players[0].hp = 70;
    tickRoom(r, 0.05);
    expect(r.winner).toBe('two');
    expect(r.reason).toBe('time');
    const draw = fight();
    draw.remaining = 0.05;
    tickRoom(draw, 0.05);
    expect(draw.phase).toBe('finished');
    expect(draw.winner).toBeNull();
  });
  it('pauses movement, cooldowns, arrows and the clock for a disconnected player and resumes safely', () => {
    const r = fight();
    switchWeapon(r, 'one');
    attack(r, 'one');
    connected(r, 'two', false);
    const paused = snapshot(r);
    run(r, 5);
    expect(snapshot(r)).toEqual(paused);
    expect(r.phase).toBe('paused');
    expect(attack(r, 'one')).toBe(false);
    connected(r, 'two', true);
    expect(r.phase).toBe('fighting');
    run(r, 0.1);
    expect(r.remaining).toBeLessThan(paused.remaining);
  });
  it('forfeits once and rejects stale result mutation; snapshots are independent and hide input internals', () => {
    const r = fight();
    finish(r, 'one', 'left');
    finish(r, 'two', 'knockout');
    expect(r.winner).toBe('one');
    expect(r.reason).toBe('left');
    const view = snapshot(r);
    expect(view.players[0]).not.toHaveProperty('input');
    expect(view.players[0]).not.toHaveProperty('inputAge');
    view.players[0].hp = 0;
    expect(r.players[0].hp).toBe(100);
    const original = snapshot(r);
    for (const dt of [NaN, Infinity, -1, 0, 2]) tickRoom(r, dt);
    expect(snapshot(r)).toEqual(original);
  });
});
