import { ITEMS, PLOT, type ItemId, type Species } from './data';
export type Stack = { item: ItemId; qty: number };
export type Block = {
  x: number;
  y: number;
  z: number;
  item: 'block' | 'lamp' | 'stool' | 'statue';
};
export function count(inv: Stack[], item: ItemId) {
  return inv.reduce((n, s) => n + (s.item === item ? s.qty : 0), 0);
}
export function transact(
  inv: Stack[],
  cost: Partial<Record<ItemId, number>>,
  gain: Partial<Record<ItemId, number>>
): Stack[] | null {
  if (
    [...Object.values(cost), ...Object.values(gain)].some((n) => !Number.isSafeInteger(n) || n! < 0)
  )
    return null;
  if (Object.entries(cost).some(([id, n]) => count(inv, id as ItemId) < n!)) return null;
  let next = inv.map((s) => ({ ...s }));
  for (const [id, n] of Object.entries(cost)) {
    let remaining = n!;
    for (const s of next)
      if (s.item === id) {
        const take = Math.min(s.qty, remaining);
        s.qty -= take;
        remaining -= take;
      }
  }
  next = next.filter((s) => s.qty > 0);
  for (const [id, n] of Object.entries(gain)) {
    let remaining = n!;
    const item = id as ItemId;
    for (const s of next)
      if (s.item === item) {
        const add = Math.min(ITEMS[item].stack - s.qty, remaining);
        s.qty += add;
        remaining -= add;
      }
    while (remaining > 0) {
      if (next.length >= 24) return null;
      const add = Math.min(remaining, ITEMS[item].stack);
      next.push({ item, qty: add });
      remaining -= add;
    }
  }
  return next;
}
export function levelFromXp(total: number) {
  let level = 1,
    xp = Math.max(0, total);
  while (level < 10 && xp >= 100 * level) {
    xp -= 100 * level;
    level++;
  }
  return { level, xp: level === 10 ? 0 : xp, next: level === 10 ? 0 : 100 * level };
}
export function elementalDamage(base: number, attacker: string, defender: string) {
  const beats: Record<string, string> = {
    Fire: 'Earth',
    Earth: 'Electric',
    Electric: 'Water',
    Water: 'Fire',
  };
  return Math.round(
    base * (beats[attacker] === defender ? 1.25 : beats[defender] === attacker ? 0.8 : 1)
  );
}
export function validPlacement(block: Block, blocks: Block[], player: [number, number, number]) {
  const { x, y, z } = block;
  if (
    ![x, y, z].every(Number.isInteger) ||
    x < PLOT.x ||
    x >= PLOT.x + 16 ||
    z < PLOT.z ||
    z >= PLOT.z + 16 ||
    y < 0 ||
    y >= 8
  )
    return false;
  if (blocks.some((b) => b.x === x && b.y === y && b.z === z)) return false;
  if (
    Math.abs(player[0] - (x + 0.5)) < 0.9 &&
    Math.abs(player[2] - (z + 0.5)) < 0.9 &&
    player[1] < y + 1 &&
    player[1] + 1.8 > y
  )
    return false;
  return (
    y === 0 ||
    blocks.some(
      (b) => b.item === 'block' && Math.abs(b.x - x) + Math.abs(b.y - y) + Math.abs(b.z - z) === 1
    )
  );
}
// An interior cell must have headroom, a solid roof, and a perimeter closed except for a walkable doorway.
export function validShelter(blocks: Block[]) {
  const solids = blocks.filter((b) => b.item === 'block');
  if (solids.length < 12) return false;
  const occupied = new Set(solids.map((b) => `${b.x},${b.y},${b.z}`));
  const has = (x: number, y: number, z: number) => occupied.has(`${x},${y},${z}`);
  for (let x = PLOT.x + 1; x < PLOT.x + 15; x++)
    for (let z = PLOT.z + 1; z < PLOT.z + 15; z++) {
      if (has(x, 0, z) || has(x, 1, z) || !has(x, 2, z)) continue;
      const perimeter: [[number, number], [number, number], [number, number], [number, number]] = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      const walls = perimeter.filter(
        ([dx, dz]) => has(x + dx, 0, z + dz) && has(x + dx, 1, z + dz)
      );
      const doors = perimeter.filter(
        ([dx, dz]) =>
          !has(x + dx, 0, z + dz) &&
          !has(x + dx, 1, z + dz) &&
          !has(x + dx * 2, 0, z + dz * 2) &&
          !has(x + dx * 2, 1, z + dz * 2)
      );
      if (walls.length === 3 && doors.length === 1) return true;
    }
  return false;
}
export type CreatureState = { xp: number; friendship: number; hp: number };
export const maxCreatureHp = (c: CreatureState) => 60 + (levelFromXp(c.xp).level - 1) * 5;
export type CreatureCollection = Partial<Record<Species, CreatureState>>;
export const respawnSeconds = (item: ItemId) =>
  item === 'wood' || item === 'stone'
    ? 180
    : item === 'berry' || item === 'fiber' || item === 'fruit'
      ? 120
      : 300;
