import type { ItemId, Vec3 } from './data';
export const MEADOW = { x: 13, z: 19, width: 13, depth: 15, entrance: [20, 0, 19] as Vec3 };
export const MONSTERS = [
  {
    id: 'hunt0',
    name: 'Wild Sproutling',
    level: 1,
    hp: 70,
    element: 'Earth',
    pos: [17, 0, 23] as Vec3,
    color: '#91b96c',
    damage: 3,
    coins: 3,
    xp: 12,
    loot: 'fiber' as ItemId,
    amount: 2,
    respawn: 20,
  },
  {
    id: 'hunt1',
    name: 'Pebble Gobbler',
    level: 2,
    hp: 100,
    element: 'Earth',
    pos: [23, 0, 25] as Vec3,
    color: '#a59cb5',
    damage: 4,
    coins: 4,
    xp: 18,
    loot: 'stone' as ItemId,
    amount: 2,
    respawn: 25,
  },
  {
    id: 'hunt2',
    name: 'Thorn Hopper',
    level: 3,
    hp: 130,
    element: 'Electric',
    pos: [19, 0, 30] as Vec3,
    color: '#cfb16d',
    damage: 5,
    coins: 6,
    xp: 24,
    loot: 'berry' as ItemId,
    amount: 2,
    respawn: 30,
  },
];
export type Hunting = {
  hp: number[];
  respawn: number[];
  loot: boolean[];
  positions: Vec3[];
  cooldown: number[];
  windup: number[];
};
export const newHunting = (): Hunting => ({
  hp: MONSTERS.map((m) => m.hp),
  respawn: [0, 0, 0],
  loot: [false, false, false],
  positions: MONSTERS.map((m) => [...m.pos]),
  cooldown: [1, 1.6, 2],
  windup: [0, 0, 0],
});
export const inMeadow = (p: Vec3) =>
  p[0] > MEADOW.x &&
  p[0] < MEADOW.x + MEADOW.width &&
  p[2] > MEADOW.z &&
  p[2] < MEADOW.z + MEADOW.depth;
export function validHunting(h: Hunting) {
  const nums = (a: number[], max: number) =>
    Array.isArray(a) && a.length === 3 && a.every((n) => Number.isFinite(n) && n >= 0 && n <= max);
  return (
    !!h &&
    nums(h.hp, 130) &&
    h.hp.every((n, i) => n <= MONSTERS[i].hp) &&
    nums(h.respawn, 30) &&
    nums(h.cooldown, 4) &&
    nums(h.windup, 0.65) &&
    Array.isArray(h.loot) &&
    h.loot.length === 3 &&
    h.loot.every((v, i) => typeof v === 'boolean' && (!v || h.hp[i] === 0)) &&
    Array.isArray(h.positions) &&
    h.positions.length === 3 &&
    h.positions.every(
      (p) =>
        Array.isArray(p) &&
        p.length === 3 &&
        p.every(Number.isFinite) &&
        p[1] === 0 &&
        p[0] >= 14 &&
        p[0] <= 25 &&
        p[2] >= 20 &&
        p[2] <= 33
    )
  );
}
// Active-play simulation. Loot must be picked up before a defeated monster can return.
export function advanceHunting(
  h: Hunting,
  dt: number,
  time: number,
  player: Vec3,
  allies: Vec3[] = []
): { index: number; damage: number }[] {
  const hits: { index: number; damage: number }[] = [];
  MONSTERS.forEach((m, i) => {
    if (h.hp[i] === 0) {
      h.respawn[i] = Math.max(0, h.respawn[i] - dt);
      h.windup[i] = 0;
      if (!h.loot[i] && h.respawn[i] === 0) {
        h.hp[i] = m.hp;
        h.positions[i] = [...m.pos];
        h.cooldown[i] = 2;
      }
      return;
    }
    const p = h.positions[i];
    const nearby = [player, ...allies]
      .filter(inMeadow)
      .sort((a, b) => Math.hypot(a[0] - p[0], a[2] - p[2]) - Math.hypot(b[0] - p[0], b[2] - p[2]));
    const target = nearby[0] ?? player,
      gap = Math.hypot(p[0] - target[0], p[2] - target[2]);
    const engaged = nearby.length > 0 && gap < 6;
    const goal: Vec3 = engaged
      ? target
      : [m.pos[0] + Math.sin(time * 0.45 + i) * 0.7, 0, m.pos[2] + Math.cos(time * 0.45 + i) * 0.7];
    if (h.windup[i] > 0) {
      h.windup[i] = Math.max(0, h.windup[i] - dt);
      if (h.windup[i] === 0) {
        if (engaged && gap < 2.25) hits.push({ index: i, damage: m.damage });
        h.cooldown[i] = 2.5;
      }
      return;
    }
    h.cooldown[i] = Math.max(0, h.cooldown[i] - dt);
    if (engaged && gap < 1.8 && h.cooldown[i] === 0) {
      h.windup[i] = 0.65;
      return;
    }
    const dx = goal[0] - p[0],
      dz = goal[2] - p[2],
      distance = Math.hypot(dx, dz),
      step = Math.min(distance, dt * (engaged ? 1.15 : 0.45));
    if (distance > 0.05 && (!engaged || gap > 1.5)) {
      p[0] = Math.max(14, Math.min(25, p[0] + (dx / distance) * step));
      p[2] = Math.max(20, Math.min(33, p[2] + (dz / distance) * step));
    }
  });
  return hits;
}
