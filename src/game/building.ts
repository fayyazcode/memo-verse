import { PLOT } from './data';
import { validPlacement, type Block } from './rules';
export type BuildPart = 'wall' | 'roof' | 'gate' | 'home';
export const HOME_COST = 24;
export function starterHome(x: number, z: number, rotation: 0 | 1 = 0): Block[] {
  const plan: Block[] = [];
  const add = (dx: number, y: number, dz: number, part?: Block['part']) => {
    const px = rotation ? 2 - dz : dx,
      pz = rotation ? dx : dz;
    plan.push({
      x: x + px,
      y,
      z: z + pz,
      item: 'block',
      ...(part ? { part } : {}),
      ...(part ? { rotation } : {}),
    });
  };
  for (let y = 0; y < 2; y++)
    for (let dx = 0; dx < 3; dx++)
      for (let dz = 0; dz < 3; dz++) if (dx === 0 || dx === 2 || dz === 2) add(dx, y, dz);
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) add(dx, 2, dz, 'roof');
  add(1, 0, 0, 'gate');
  return plan;
}
export function canBuildHome(plan: Block[], blocks: Block[], player: [number, number, number]) {
  const placed = [...blocks];
  if (placed.length + plan.length > 2048) return false;
  for (const block of plan) {
    if (!validPlacement(block, placed, player)) return false;
    placed.push(block);
  }
  return true;
}
export function homeSite(
  blocks: Block[],
  player: [number, number, number],
  rotation: 0 | 1 = 0
): [number, number] | null {
  const sites: [number, number][] = [];
  for (let x = PLOT.x; x < PLOT.x + 14; x++)
    for (let z = PLOT.z; z < PLOT.z + 14; z++)
      if (Math.hypot(x + 1.5 - player[0], z + 1.5 - player[2]) <= 7) sites.push([x, z]);
  sites.sort(
    (a, b) =>
      Math.hypot(a[0] + 1.5 - player[0], a[1] + 1.5 - player[2]) -
      Math.hypot(b[0] + 1.5 - player[0], b[1] + 1.5 - player[2])
  );
  return sites.find(([x, z]) => canBuildHome(starterHome(x, z, rotation), blocks, player)) ?? null;
}

export function buildingTarget(id: string, blocks: Block[]): [number, number, number] | undefined {
  const b = blocks.find(
    (b) =>
      (b.part === 'gate'
        ? `gate:${b.x}:${b.y}:${b.z}`
        : b.item === 'lamp'
          ? `lamp:${b.x}:${b.y}:${b.z}`
          : '') === id
  );
  return b ? [b.x + 0.5, b.y, b.z + 0.5] : undefined;
}
