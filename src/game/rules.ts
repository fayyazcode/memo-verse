import { ITEMS, PLOT, type ItemId, type Species } from './data';
export type Stack = { item: ItemId; qty: number };
export type Block = {
  x: number;
  y: number;
  z: number;
  item: 'block' | 'lamp' | 'stool' | 'statue';
  part?: 'roof' | 'gate';
  rotation?: 0 | 1;
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
  if (block.part && (block.item !== 'block' || !['roof', 'gate'].includes(block.part)))
    return false;
  if (block.rotation !== undefined && block.rotation !== 0 && block.rotation !== 1) return false;
  if ((block.part === 'gate' && y + 2 > PLOT.height) || (block.part === 'roof' && y < 2))
    return false;
  const height = block.part === 'gate' ? 2 : 1;
  if (
    blocks.some(
      (b) => b.x === x && b.z === z && y < b.y + (b.part === 'gate' ? 2 : 1) && y + height > b.y
    )
  )
    return false;
  if (
    Math.abs(player[0] - (x + 0.5)) < 0.9 &&
    Math.abs(player[2] - (z + 0.5)) < 0.9 &&
    player[1] < y + height &&
    player[1] + 1.8 > y
  )
    return false;
  return (
    y === 0 ||
    blocks.some(
      (b) =>
        b.item === 'block' &&
        b.part !== 'gate' &&
        Math.abs(b.x - x) + Math.abs(b.y - y) + Math.abs(b.z - z) === 1
    )
  );
}
// Roofed headroom may span a room of any size. Its boundary must be walled
// except for one contiguous, accessible doorway (one or two cells wide).
export function validShelter(blocks: Block[]) {
  const solids = blocks.filter((b) => b.item === 'block' && b.part !== 'gate');
  if (solids.length < 12) return false;
  const occupied = new Set(solids.map((b) => `${b.x},${b.y},${b.z}`));
  const ceiling = new Map<string, number>();
  for (const b of solids)
    ceiling.set(`${b.x},${b.z}`, Math.max(ceiling.get(`${b.x},${b.z}`) ?? -1, b.y));
  const has = (x: number, y: number, z: number) => occupied.has(`${x},${y},${z}`);
  const inside = (x: number, z: number) =>
    x >= PLOT.x && x < PLOT.x + 16 && z >= PLOT.z && z < PLOT.z + 16;
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (let floor = 0; floor <= 5; floor++) {
    const clear = (x: number, z: number) => !has(x, floor, z) && !has(x, floor + 1, z);
    const roofed = (x: number, z: number) =>
      inside(x, z) &&
      clear(x, z) &&
      (floor === 0 || has(x, floor - 1, z)) &&
      (ceiling.get(`${x},${z}`) ?? -1) >= floor + 2;
    const visited = new Set<string>();
    for (let x = PLOT.x; x < PLOT.x + 16; x++)
      for (let z = PLOT.z; z < PLOT.z + 16; z++) {
        if (!roofed(x, z) || visited.has(`${x},${z}`)) continue;
        const pending = [[x, z]],
          openings: { x: number; z: number; dx: number; dz: number }[] = [];
        let walls = 0,
          broken = false;
        while (pending.length) {
          const [cx, cz] = pending.pop()!,
            key = `${cx},${cz}`;
          if (visited.has(key)) continue;
          visited.add(key);
          for (const [dx, dz] of directions) {
            const nx = cx + dx,
              nz = cz + dz;
            if (roofed(nx, nz)) {
              if (!visited.has(`${nx},${nz}`)) pending.push([nx, nz]);
              continue;
            }
            if (has(nx, floor, nz) && has(nx, floor + 1, nz)) {
              walls++;
              continue;
            }
            if (clear(nx, nz) && clear(nx + dx, nz + dz)) openings.push({ x: nx, z: nz, dx, dz });
            else broken = true;
          }
        }
        if (broken || walls < 3 || openings.length < 1 || openings.length > 2) continue;
        if (openings.length === 1) return true;
        const [a, b] = openings;
        if (a.dx === b.dx && a.dz === b.dz && Math.abs(a.x - b.x) + Math.abs(a.z - b.z) === 1)
          return true;
      }
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
