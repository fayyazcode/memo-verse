import { NPCS, type Vec3 } from './data';

// Reconstructed from the existing active-play clock; no new save fields.
export const HOMES = [
  { id: 'moss', position: [-11, 0, -12] as Vec3, rotation: 0.15, roof: '#9aab7d' },
  { id: 'foxy', position: [-16, 0, -1] as Vec3, rotation: 0, roof: '#8c9d77', shop: true },
  { id: 'bruno', position: [11, 0, 4] as Vec3, rotation: 0, roof: '#b89372', color: '#e2d3b5' },
  { id: 'luna', position: [10, 0, -16] as Vec3, rotation: 0, roof: '#899ea0' },
  { id: 'bloop', position: [-25, 0, 8] as Vec3, rotation: 0.2, roof: '#bb9b7a' },
];
export const JOBS: Record<string, string> = {
  moss: 'Tending the garden',
  foxy: 'Sorting shop supplies',
  bruno: 'Hammering timber',
  luna: 'Studying creatures',
  bloop: 'Brewing forest remedies',
};
export function homePoint(id: string, z: number, y = 0): Vec3 {
  const h = HOMES.find((h) => h.id === id)!;
  return [h.position[0] + Math.sin(h.rotation) * z, y, h.position[2] + Math.cos(h.rotation) * z];
}
const circles = [
  [-23, -7, 0.9],
  [-17, -15, 0.9],
  [-4, -19, 0.9],
  [16, -19, 0.9],
  [-24, 16, 0.9],
  [15, 18, 0.9],
  [22, -13, 0.9],
  [0, -3, 2.3],
  [-6, 4, 1.5],
  [6, 4, 1.5],
  [10, 11, 1.8],
  [13, -8, 1.5],
  [-3, -9, 1.3],
  [-3, 14, 1.1],
  [0, 14, 1.1],
  [3, 14, 1.1],
];
export function walkable(x: number, z: number): boolean {
  if (x < -32 || x > 27 || z < -23 || z > 20) return false;
  if (circles.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r)) return false;
  if (NPCS.some((n) => Math.abs(x - n.pos[0] - 0.6) < 1.55 && Math.abs(z - n.pos[2] - 1) < 0.65))
    return false;
  return !HOMES.some((h) => {
    const dx = x - h.position[0],
      dz = z - h.position[2],
      c = Math.cos(h.rotation),
      s = Math.sin(h.rotation);
    return Math.abs(c * dx - s * dz) < 3.25 && Math.abs(s * dx + c * dz) < 2.75;
  });
}
// Four-neighbour village routing keeps villagers clear of buildings and scenery.
export function villageRoute(start: Vec3, end: Vec3): Vec3[] {
  const key = (x: number, z: number) => `${x},${z}`;
  const sx = Math.round(start[0]),
    sz = Math.round(start[2]),
    ex = Math.round(end[0]),
    ez = Math.round(end[2]);
  const first = key(sx, sz),
    last = key(ex, ez),
    open = [first];
  const scores = new Map([[first, 0]]),
    parents = new Map<string, string>();
  while (open.length) {
    open.sort((a, b) => {
      const [ax, az] = a.split(',').map(Number),
        [bx, bz] = b.split(',').map(Number);
      return (
        scores.get(a)! +
        Math.abs(ax - ex) +
        Math.abs(az - ez) -
        scores.get(b)! -
        Math.abs(bx - ex) -
        Math.abs(bz - ez)
      );
    });
    const current = open.shift()!;
    if (current === last) {
      const result: Vec3[] = [end];
      let p = current;
      while (p !== first) {
        const [x, z] = p.split(',').map(Number);
        result.unshift([x, 0, z]);
        p = parents.get(p)!;
      }
      return [start, ...result];
    }
    const [x, z] = current.split(',').map(Number);
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        nz = z + dz,
        k = key(nx, nz),
        score = scores.get(current)! + 1;
      if (!walkable(nx, nz) || score >= (scores.get(k) ?? Infinity)) continue;
      scores.set(k, score);
      parents.set(k, current);
      if (!open.includes(k)) open.push(k);
    }
  }
  throw new Error(`No village route from ${start} to ${end}`);
}
const routes = new Map<string, Vec3[]>();
export function commute(id: string): Vec3[] {
  if (!routes.has(id))
    routes.set(id, [
      ...villageRoute(NPCS.find((n) => n.id === id)!.pos, homePoint(id, 3.5)),
      homePoint(id, 2.1, 0.36),
      homePoint(id, -0.9, 0.36),
    ]);
  return routes.get(id)!;
}
export function routeLength(route: Vec3[]) {
  return route
    .slice(1)
    .reduce(
      (sum, p, i) => sum + Math.hypot(p[0] - route[i][0], p[1] - route[i][1], p[2] - route[i][2]),
      0
    );
}
function along(route: Vec3[], distance: number): { position: Vec3; heading: number } {
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1],
      b = route[i],
      length = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (distance <= length) {
      const f = length ? distance / length : 1;
      return {
        position: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f],
        heading: Math.atan2(b[0] - a[0], b[2] - a[2]),
      };
    }
    distance -= length;
  }
  return { position: route.at(-1)!, heading: 0 };
}
export type VillagerPose = {
  position: Vec3;
  heading: number;
  moving: boolean;
  indoors: boolean;
  activity: string;
  working: boolean;
  resting: boolean;
};
function scheduledPose(id: string, time: number): VillagerPose {
  const index = NPCS.findIndex((n) => n.id === id),
    n = NPCS[index];
  if (!n) throw new Error(`Unknown villager ${id}`);
  const day = ((time % 720) + 720) % 720,
    depart = 420 + index * 16,
    wake = 630 + index * 8;
  const route = commute(id),
    duration = routeLength(route) / 1.15;
  let position: Vec3 = n.pos,
    heading = 0,
    moving = false,
    resting = false,
    working = false,
    activity = JOBS[id];
  if (day >= depart && day < depart + duration) {
    ({ position, heading } = along(route, (day - depart) * 1.15));
    moving = true;
    activity = 'Walking home';
  } else if (day >= depart + duration && day < wake) {
    position = homePoint(id, -0.9, 0.84);
    resting = true;
    heading = HOMES.find((h) => h.id === id)!.rotation;
    activity = 'Resting at home · Knock to talk';
  } else if (day >= wake) {
    ({ position, heading } = along([...route].reverse(), (day - wake) * 1.15));
    moving = day < wake + duration;
    activity = moving ? 'Heading to work' : JOBS[id];
    working = !moving;
  } else {
    // Short errands between work bouts; staggered so the village does not march in sync.
    const offsetTime = index * 3;
    const lastCycle = offsetTime + Math.floor((depart - offsetTime) / 24) * 24;
    const t = day >= lastCycle ? 0 : Math.max(0, day - offsetTime) % 24;
    const offset = t < 7 ? 0 : t < 10 ? (t - 7) / 3 : t < 17 ? 1 : t < 20 ? 1 - (t - 17) / 3 : 0;
    position = [n.pos[0] + offset * 1.2, 0, n.pos[2]];
    moving = (t >= 7 && t < 10) || (t >= 17 && t < 20);
    heading = moving ? (t >= 17 ? -Math.PI / 2 : Math.PI / 2) : 0;
    working = !moving;
    activity = moving ? 'Checking supplies' : JOBS[id];
  }
  const h = HOMES.find((h) => h.id === id)!;
  const dx = position[0] - h.position[0],
    dz = position[2] - h.position[2];
  const indoors =
    Math.abs(Math.cos(h.rotation) * dx - Math.sin(h.rotation) * dz) < 2.6 &&
    Math.abs(Math.sin(h.rotation) * dx + Math.cos(h.rotation) * dz) < 2.1;
  return { position, heading, moving, indoors, activity, working, resting };
}
export function npcPosition(id: string, time: number): Vec3 {
  const p = villagerPose(id, time);
  return p.indoors ? homePoint(id, 3.5) : p.position;
}

type Visit = { start: number; offset: number; route: Vec3[]; travel: number; total: number };
const visits = new Map<string, Visit>();
export function resetVillagerVisits() {
  visits.clear();
}
export function requestVillagerVisit(id: string, time: number): boolean {
  const current = visits.get(id);
  if (current && time < current.start + current.total) return false;
  const pose = villagerPose(id, time);
  if (!pose.indoors) return false;
  const route = [
    [pose.position[0], 0.36, pose.position[2]] as Vec3,
    homePoint(id, 2.1, 0.36),
    homePoint(id, 3.5),
  ];
  const travel = routeLength(route) / 1.15;
  visits.set(id, {
    start: time,
    offset: current ? current.offset + current.total : 0,
    route,
    travel,
    total: travel * 2 + 40,
  });
  return true;
}
export function visitStatus(id: string, time: number): 'coming' | 'waiting' | 'returning' | null {
  const v = visits.get(id);
  if (!v || time < v.start || time >= v.start + v.total) return null;
  const age = time - v.start;
  return age < v.travel ? 'coming' : age < v.travel + 40 ? 'waiting' : 'returning';
}
export function villagerPose(id: string, time: number): VillagerPose {
  const v = visits.get(id);
  if (!v || time < v.start) return scheduledPose(id, time);
  if (time >= v.start + v.total) return scheduledPose(id, time - v.offset - v.total);
  const age = time - v.start,
    waiting = age >= v.travel && age < v.travel + 40;
  const returning = age >= v.travel + 40;
  const pose = along(
    returning ? [...v.route].reverse() : v.route,
    (returning ? age - v.travel - 40 : Math.min(age, v.travel)) * 1.15
  );
  const door = homePoint(id, 2.1);
  const indoors =
    Math.hypot(pose.position[0] - door[0], pose.position[2] - door[2]) < 0.05 ||
    (returning ? age - v.travel - 40 > 1.5 : age < v.travel - 1.3);
  return {
    ...pose,
    moving: !waiting,
    working: false,
    resting: false,
    indoors,
    activity: waiting ? 'Ready to talk' : returning ? 'Returning home' : 'Coming outside to talk',
  };
}
