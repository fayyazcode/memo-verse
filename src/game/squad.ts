import { CREATURES, type Species, type Vec3 } from './data';
import { elementalDamage, levelFromXp, maxCreatureHp } from './rules';
import type { Save } from './store';
export type Slot = 'basic' | 'Q' | 'E' | 'R';
export type Order = 'follow' | 'stay' | 'focus' | 'retreat';
export type Stance = 'defensive' | 'aggressive' | 'passive';
export const ROLES: Record<Species, string> = {
  emberfox: 'Mage',
  aquabub: 'Support',
  mosshell: 'Tank',
  zaplet: 'Fighter',
};
export const PASSIVES: Record<Species, string> = {
  emberfox: 'Warmth: +10% damage near an active fire area.',
  aquabub: 'Refresh: nearby allied healing is 10% stronger.',
  mosshell: 'Stone Skin: takes 20% less damage and draws enemy attention.',
  zaplet: 'Static Charge: consecutive attacks build up to 3 bonus damage; expires after 6s.',
};
export const TRAINING = [
  { id: 'training0', name: 'Practice sprout', pos: [-3, 0, 14] as Vec3 },
  { id: 'training1', name: 'Practice stone', pos: [0, 0, 14] as Vec3 },
  { id: 'training2', name: 'Practice spark', pos: [3, 0, 14] as Vec3 },
];
export type Ability = {
  id: string;
  name: string;
  element: string;
  target: 'enemy' | 'ally' | 'squad';
  power: number;
  range: number;
  radius: number;
  cooldown: number;
  level: number;
  duration: number;
  animation: 'projectile' | 'area' | 'shield' | 'heal' | 'dash' | 'warning';
  status: string;
  cost: number;
};
const ability = (
  id: string,
  name: string,
  element: string,
  target: Ability['target'],
  power: number,
  range: number,
  radius: number,
  cooldown: number,
  level: number,
  duration: number,
  animation: Ability['animation'],
  status = ''
): Ability => ({
  id,
  name,
  element,
  target,
  power,
  range,
  radius,
  cooldown,
  level,
  duration,
  animation,
  status,
  cost: cooldown === 45 ? 100 : 0,
});
export const ABILITIES: Record<Species, Record<Slot, Ability>> = {
  emberfox: {
    basic: ability(
      'ember-basic',
      'Paw strike',
      'Neutral',
      'enemy',
      10,
      5,
      0,
      1.5,
      1,
      0,
      'projectile'
    ),
    Q: ability('fireball', 'Fireball', 'Fire', 'enemy', 18, 10, 0, 5, 1, 0, 'projectile'),
    E: ability(
      'flame-trail',
      'Flame Trail',
      'Fire',
      'enemy',
      8,
      8,
      3,
      10,
      5,
      3,
      'area',
      'Burns each second'
    ),
    R: ability(
      'meteor-burst',
      'Meteor Burst',
      'Fire',
      'enemy',
      48,
      12,
      5,
      45,
      10,
      0.8,
      'warning',
      'Impact after 0.8s warning'
    ),
  },
  aquabub: {
    basic: ability(
      'aqua-basic',
      'Fin strike',
      'Neutral',
      'enemy',
      10,
      5,
      0,
      1.5,
      1,
      0,
      'projectile'
    ),
    Q: ability('water-bolt', 'Water Bolt', 'Water', 'enemy', 18, 10, 0, 5, 1, 0, 'projectile'),
    E: ability(
      'healing-bubble',
      'Healing Bubble',
      'Water',
      'ally',
      24,
      8,
      0,
      10,
      5,
      0,
      'heal',
      'Heals the lowest-health nearby ally'
    ),
    R: ability(
      'tidal-wave',
      'Tidal Wave',
      'Water',
      'enemy',
      38,
      12,
      4,
      45,
      10,
      0,
      'area',
      'Directional wave; pushes hostiles'
    ),
  },
  mosshell: {
    basic: ability(
      'moss-basic',
      'Shell strike',
      'Neutral',
      'enemy',
      10,
      5,
      0,
      1.5,
      1,
      0,
      'projectile'
    ),
    Q: ability(
      'rock-smash',
      'Rock Smash',
      'Earth',
      'enemy',
      22,
      5,
      0,
      5,
      1,
      0,
      'area',
      'Draws enemy attention'
    ),
    E: ability(
      'stone-shield',
      'Stone Shield',
      'Earth',
      'squad',
      22,
      8,
      8,
      10,
      5,
      6,
      'shield',
      'Temporary shields absorb damage'
    ),
    R: ability(
      'earthquake',
      'Earthquake',
      'Earth',
      'enemy',
      38,
      8,
      5,
      45,
      10,
      0,
      'area',
      'Stuns hostiles for 2s'
    ),
  },
  zaplet: {
    basic: ability(
      'zap-basic',
      'Quick strike',
      'Neutral',
      'enemy',
      10,
      5,
      0,
      1.5,
      1,
      0,
      'projectile'
    ),
    Q: ability(
      'spark-dash',
      'Spark Dash',
      'Electric',
      'enemy',
      20,
      8,
      0,
      5,
      1,
      0,
      'dash',
      'Dashes toward the target'
    ),
    E: ability(
      'chain-lightning',
      'Chain Lightning',
      'Electric',
      'enemy',
      20,
      10,
      5,
      10,
      5,
      0,
      'projectile',
      'Chains to nearby hostiles'
    ),
    R: ability(
      'thunderstorm',
      'Thunderstorm',
      'Electric',
      'enemy',
      12,
      12,
      5,
      45,
      10,
      4,
      'area',
      'Damages each second'
    ),
  },
};
export type Member = {
  cooldowns: Record<Slot, number>;
  charge: number;
  shield: number;
  shieldTime: number;
  static: number;
  staticTime: number;
};
export type Zone = {
  species: Species;
  slot: 'E' | 'R';
  position: Vec3;
  remaining: number;
  pulse: number;
  warning: boolean;
};
export type Squad = {
  equipped: Species[];
  stance: Stance;
  order: Order;
  switchCooldown: number;
  members: Partial<Record<Species, Member>>;
  target: string | null;
  zones: Zone[];
  enemyPosition: Vec3;
  stun: number;
  taunt: Species | null;
  tauntTime: number;
  playerShield: number;
  playerShieldTime: number;
  training: number[];
  trainingRespawn: number[];
};
export const newMember = (): Member => ({
  cooldowns: { basic: 0, Q: 0, E: 0, R: 0 },
  charge: 0,
  shield: 0,
  shieldTime: 0,
  static: 0,
  staticTime: 0,
});
export const newSquad = (active: Species | null): Squad => ({
  equipped: active ? [active] : [],
  stance: 'defensive',
  order: 'follow',
  switchCooldown: 0,
  members: {},
  target: null,
  zones: [],
  enemyPosition: [92, 0, 20],
  stun: 0,
  taunt: null,
  tauntTime: 0,
  playerShield: 0,
  playerShieldTime: 0,
  training: [240, 240, 240],
  trainingRespawn: [0, 0, 0],
});
export function squadOf(s: Save): Squad {
  if (s.squad) return s.squad;
  const q = newSquad(s.active);
  if (s.active)
    q.members[s.active] = {
      ...newMember(),
      cooldowns: { basic: s.attackCooldown, Q: s.abilityCooldown, E: 0, R: 0 },
    };
  return q;
}
export const memberOf = (s: Save, id: Species) => squadOf(s).members[id] ?? newMember();
export const distance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[2] - b[2]);
export type Positions = Partial<Record<Species, Vec3>>;
export function formation(player: Vec3, index: number): Vec3 {
  return [
    player[0] + [-1.4, 1.4, 0][index % 3],
    player[1] - 0.74,
    player[2] + [1.5, 1.5, 2.8][index % 3],
  ];
}
export function retreatPosition(player: Vec3, index: number, threat?: Vec3): Vec3 {
  if (!threat) return [player[0], player[1], player[2] + 4 + index];
  const dx = player[0] - threat[0],
    dz = player[2] - threat[2],
    length = Math.hypot(dx, dz);
  const awayX = length > 0 ? dx / length : 0,
    awayZ = length > 0 ? dz / length : 1;
  return [player[0] + awayX * (9 + index), player[1], player[2] + awayZ * (9 + index)];
}
export const positionOf = (s: Save, id: Species, positions: Positions = {}) =>
  positions[id] ?? s.position;
export function targets(s: Save) {
  const q = squadOf(s);
  return [
    ...(s.flags.includes('repaired') && !s.flags.includes('guardianDefeated') && s.enemyHp > 0
      ? [{ id: 'guardian', position: q.enemyPosition, hp: s.enemyHp, element: 'Earth' }]
      : []),
    ...TRAINING.flatMap((t, i) =>
      q.training[i] > 0
        ? [{ id: t.id, position: t.pos, hp: q.training[i], element: 'Neutral' }]
        : []
    ),
  ];
}
// Workers are reserved by stable flags until the settlement phase adds assignments.
export const isWorking = (s: Save, id: Species) => s.flags.includes('worker:' + id);
export function equipCreature(s: Save, id: Species, equip: boolean): Save | string {
  const q = structuredClone(squadOf(s));
  if (!s.creatures[id]) return 'Befriend this creature first.';
  if (!equip && s.active === id && q.switchCooldown > 0)
    return 'Squad switch is cooling down. Recall the squad to dismiss everyone.';
  if (equip && !s.active && q.switchCooldown > 0 && !q.equipped.includes(id))
    return 'Squad switch is cooling down.';
  if (equip && isWorking(s, id))
    return 'This creature is assigned to work. Unassign it before equipping.';
  if (equip && !q.equipped.includes(id)) {
    if (q.equipped.length >= 3) return 'Your squad is full. Unequip a friend first.';
    q.equipped.push(id);
  } else if (!equip) q.equipped = q.equipped.filter((c) => c !== id);
  if (q.taunt && !q.equipped.includes(q.taunt)) {
    q.taunt = null;
    q.tauntTime = 0;
  }
  q.members[id] ??= newMember();
  const active = equip
    ? (s.active ?? (s.creatures[id]!.hp > 0 ? id : null))
    : s.active === id
      ? (q.equipped.find((c) => s.creatures[c]!.hp > 0) ?? null)
      : s.active;
  if (active !== s.active && active && s.active) q.switchCooldown = 2;
  return {
    ...s,
    squad: q,
    active,
    attackCooldown: active ? (q.members[active]?.cooldowns.basic ?? 0) : 0,
    abilityCooldown: active ? (q.members[active]?.cooldowns.Q ?? 0) : 0,
  };
}
export function switchCreature(s: Save, id: Species): Save | string {
  const q = squadOf(s);
  if (!q.equipped.includes(id) || !s.creatures[id] || isWorking(s, id))
    return 'Choose an equipped companion.';
  if (s.creatures[id]!.hp <= 0) return 'Visit the village healing station first.';
  if (s.active === id) return s;
  if (q.switchCooldown > 0) return 'Squad switch is cooling down.';
  return {
    ...s,
    active: id,
    attackCooldown: memberOf(s, id).cooldowns.basic,
    abilityCooldown: memberOf(s, id).cooldowns.Q,
    squad: { ...q, switchCooldown: 2 },
  };
}
export function validSquad(s: Save, q: Squad) {
  const number = (v: unknown, max = 3600) =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
  const point = (p: unknown): p is Vec3 =>
    Array.isArray(p) &&
    p.length === 3 &&
    p.every((n) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 128);
  if (
    !q ||
    !Array.isArray(q.equipped) ||
    q.equipped.length > 3 ||
    new Set(q.equipped).size !== q.equipped.length ||
    q.equipped.some((id) => !CREATURES[id] || !s.creatures[id] || isWorking(s, id)) ||
    (s.active !== null && !q.equipped.includes(s.active)) ||
    !['defensive', 'aggressive', 'passive'].includes(q.stance) ||
    !['follow', 'stay', 'focus', 'retreat'].includes(q.order) ||
    !number(q.switchCooldown, 2) ||
    !q.members ||
    !Array.isArray(q.zones) ||
    q.zones.length > 8 ||
    !point(q.enemyPosition) ||
    distance(q.enemyPosition, [92, 0, 20]) > 4.01 ||
    !number(q.stun, 2) ||
    !number(q.tauntTime, 6) ||
    (q.taunt !== null && !q.equipped.includes(q.taunt)) ||
    (q.target !== null && !['guardian', ...TRAINING.map((t) => t.id)].includes(q.target)) ||
    !number(q.playerShield, 100) ||
    !number(q.playerShieldTime, 6)
  )
    return false;
  if (
    [q.training, q.trainingRespawn].some(
      (a) => !Array.isArray(a) || a.length !== 3 || a.some((n) => !number(n, 240))
    )
  )
    return false;
  for (const [id, m] of Object.entries(q.members)) {
    if (
      !CREATURES[id as Species] ||
      !s.creatures[id as Species] ||
      !m ||
      !m.cooldowns ||
      !['basic', 'Q', 'E', 'R'].every((k) => number(m.cooldowns[k as Slot], 45)) ||
      !number(m.charge, 100) ||
      !number(m.shield, 100) ||
      !number(m.shieldTime, 6) ||
      !number(m.static, 3) ||
      !number(m.staticTime, 6)
    )
      return false;
  }
  return q.zones.every(
    (z) =>
      z &&
      q.members[z.species] &&
      ['E', 'R'].includes(z.slot) &&
      point(z.position) &&
      number(z.remaining, 4) &&
      number(z.pulse, 1) &&
      typeof z.warning === 'boolean'
  );
}
export type Effect = {
  species: Species;
  slot: Slot;
  start: Vec3;
  end: Vec3;
  animation: Ability['animation'];
  duration: number;
  time: number;
};
export type Resolution = { save: Save; effects: Effect[]; error?: string };
const clone = (s: Save): Save => ({
  ...s,
  creatures: structuredClone(s.creatures),
  squad: structuredClone(squadOf(s)),
});
function damage(
  s: Save,
  id: Species,
  target: ReturnType<typeof targets>[number],
  power: number,
  element: string,
  positions: Positions
): Save {
  const q = s.squad!,
    c = s.creatures[id]!,
    m = (q.members[id] ??= newMember());
  const warm =
    id === 'emberfox' &&
    q.zones.some(
      (z) =>
        z.species === 'emberfox' &&
        !z.warning &&
        distance(z.position, positionOf(s, id, positions)) <= 5
    );
  const amount = elementalDamage(
    Math.round(power * (warm ? 1.1 : 1) + (id === 'zaplet' ? m.static : 0)),
    element,
    target.element
  );
  const hp = Math.max(0, target.hp - amount);
  if (target.id === 'guardian') {
    s.enemyHp = hp;
    if (id === 'mosshell') {
      q.taunt = id;
      q.tauntTime = 4;
    }
    if (hp === 0 && !s.flags.includes('guardianDefeated')) {
      s.flags = [...s.flags, 'guardianDefeated'];
      s.coins += 80;
      c.xp += 120;
      for (const participant of q.equipped)
        if (participant !== id && s.creatures[participant]!.hp > 0)
          s.creatures[participant]!.xp += 60;
    }
  } else {
    const i = TRAINING.findIndex((t) => t.id === target.id);
    q.training[i] = hp;
    if (hp === 0) q.trainingRespawn[i] = 5;
  }
  if (hp === 0) m.charge = Math.min(100, m.charge + 15);
  return s;
}
export function cast(
  s: Save,
  id: Species | null,
  slot: Slot,
  targetId?: string | null,
  positions: Positions = {}
): Resolution {
  const fail = (error: string): Resolution => ({ save: s, effects: [], error });
  if (!id || !s.creatures[id]?.hp || !squadOf(s).equipped.includes(id) || isWorking(s, id))
    return fail('Choose a healthy equipped companion.');
  const a = ABILITIES[id][slot],
    m = memberOf(s, id),
    origin = positionOf(s, id, positions);
  if (levelFromXp(s.creatures[id]!.xp).level < a.level)
    return fail(`${a.name} unlocks at creature level ${a.level}.`);
  if (
    m.cooldowns[slot] > 0 ||
    (!s.squad &&
      id === s.active &&
      (slot === 'basic' ? s.attackCooldown : slot === 'Q' ? s.abilityCooldown : 0) > 0)
  )
    return fail(`${a.name} is cooling down.`);
  if (slot === 'R' && m.charge < 100) return fail('Ultimate needs 100 charge.');
  let target = targets(s).find((t) => t.id === (targetId ?? squadOf(s).target));
  if (a.target === 'enemy') {
    if (targetId && !target) return fail('Choose a hostile or practice target.');
    target ??= targets(s)
      .filter((t) => distance(origin, t.position) <= a.range)
      .sort((a, b) => distance(origin, a.position) - distance(origin, b.position))[0];
    if (
      !target ||
      distance(origin, target.position) > a.range ||
      distance(s.position, target.position) > 20
    )
      return fail(`No target within ${a.range} units.`);
  }
  let next = clone(s),
    q = next.squad!,
    member = (q.members[id] ??= newMember());
  let end = target?.position ?? origin;
  if (a.target === 'ally') {
    const allies = [
      { id: 'player', hp: s.hp, max: 100 + (levelFromXp(s.xp).level - 1) * 5, pos: s.position },
      ...q.equipped
        .filter((c) => s.creatures[c]!.hp > 0)
        .map((c) => ({
          id: c,
          hp: s.creatures[c]!.hp,
          max: maxCreatureHp(s.creatures[c]!),
          pos: positionOf(s, c, positions),
        })),
    ]
      .filter((t) => distance(origin, t.pos) <= a.range && t.hp < t.max)
      .sort((a, b) => a.hp / a.max - b.hp / b.max);
    const ally = allies[0];
    if (!ally) return fail('No nearby ally needs healing.');
    const refresh =
      q.equipped.includes('aquabub') &&
      !!s.creatures.aquabub?.hp &&
      distance(origin, positionOf(s, 'aquabub', positions)) <= 8;
    const value = Math.min(ally.max, ally.hp + Math.round(a.power * (refresh ? 1.1 : 1)));
    if (ally.id === 'player') next.hp = value;
    else next.creatures[ally.id as Species]!.hp = value;
    end = ally.pos;
  } else if (a.target === 'squad') {
    for (const ally of q.equipped)
      if (
        next.creatures[ally]!.hp > 0 &&
        distance(origin, positionOf(s, ally, positions)) <= a.range
      ) {
        const v = (q.members[ally] ??= newMember());
        v.shield = a.power;
        v.shieldTime = a.duration;
      }
    if (distance(origin, s.position) <= a.range) {
      q.playerShield = a.power;
      q.playerShieldTime = a.duration;
    }
  } else if (a.duration > 0 && (slot === 'E' || slot === 'R') && id !== 'mosshell') {
    if (q.zones.length >= 8) return fail('Too many active areas.');
    q.zones.push({
      species: id,
      slot,
      position: [...end],
      remaining: a.duration,
      pulse: id === 'emberfox' && slot === 'R' ? 0.8 : 1,
      warning: a.animation === 'warning',
    });
  } else {
    const victims = targets(next).filter((t) => {
      if (id === 'aquabub' && slot === 'R') {
        const dx = end[0] - origin[0],
          dz = end[2] - origin[2],
          len = Math.hypot(dx, dz) || 1,
          vx = t.position[0] - origin[0],
          vz = t.position[2] - origin[2],
          along = (vx * dx + vz * dz) / len;
        return along >= 0 && along <= a.range && Math.abs(vx * dz - vz * dx) / len <= a.radius;
      }
      return t.id === target!.id || (a.radius > 0 && distance(t.position, end) <= a.radius);
    });
    for (const victim of victims) {
      if (id === 'aquabub' && slot === 'R') {
        const dx = end[0] - origin[0],
          dz = end[2] - origin[2],
          len = Math.hypot(dx, dz) || 1;
        const vx = victim.position[0] - origin[0],
          vz = victim.position[2] - origin[2];
        if (vx * dx + vz * dz < 0 || Math.abs(vx * dz - vz * dx) / len > a.radius) continue;
      }
      next = damage(next, id, victim, a.power, a.element, positions);
      if (victim.id === 'guardian' && slot === 'R') {
        if (id === 'mosshell') q.stun = 2;
        if (id === 'aquabub') {
          const dx = end[0] - origin[0],
            dz = end[2] - origin[2],
            len = Math.hypot(dx, dz) || 1;
          const x = q.enemyPosition[0] - 92 + (dx / len) * 2,
            z = q.enemyPosition[2] - 20 + (dz / len) * 2,
            cap = Math.max(1, Math.hypot(x, z) / 4);
          q.enemyPosition = [92 + x / cap, 0, 20 + z / cap];
        }
      }
    }
  }
  if (id === 'zaplet') {
    member.static = Math.min(3, member.static + 1);
    member.staticTime = 6;
  }
  member.cooldowns[slot] = a.cooldown;
  member.charge = slot === 'R' ? 0 : Math.min(100, member.charge + (slot === 'basic' ? 5 : 10));
  next.creatures[id]!.xp += slot === 'basic' ? 5 : 10;
  if (s.active === id) {
    if (slot === 'basic') next.attackCooldown = a.cooldown;
    if (slot === 'Q') next.abilityCooldown = a.cooldown;
  }
  return {
    save: next,
    effects: [
      {
        species: id,
        slot,
        start: [...origin],
        end: [...end],
        animation: a.animation,
        duration: a.animation === 'warning' ? 0.8 : 0.65,
        time: s.playTime,
      },
    ],
  };
}
// Mutates an owned combat snapshot; advanceSquad/cast clone durable state first.
export function absorb(s: Save, id: Species | null, amount: number) {
  const q = s.squad!;
  if (id) {
    const c = s.creatures[id]!,
      m = (q.members[id] ??= newMember());
    const hit = Math.round(amount * (id === 'mosshell' ? 0.8 : 1));
    const shield = Math.min(hit, m.shield);
    m.shield -= shield;
    c.hp = Math.max(0, c.hp - hit + shield);
  } else {
    const shield = Math.min(amount, q.playerShield);
    q.playerShield -= shield;
    s.hp = Math.max(0, s.hp - amount + shield);
  }
}
export function advanceSquad(s: Save, dt: number, positions: Positions = {}): Resolution {
  let next = clone(s);
  const q = next.squad!;
  const effects: Effect[] = [];
  q.switchCooldown = Math.max(0, q.switchCooldown - dt);
  q.stun = Math.max(0, q.stun - dt);
  q.tauntTime = Math.max(0, q.tauntTime - dt);
  if (q.tauntTime === 0) q.taunt = null;
  q.playerShieldTime = Math.max(0, q.playerShieldTime - dt);
  if (q.playerShieldTime === 0) q.playerShield = 0;
  for (const m of Object.values(q.members)) {
    for (const slot of ['basic', 'Q', 'E', 'R'] as Slot[])
      m.cooldowns[slot] = Math.max(0, m.cooldowns[slot] - dt);
    m.shieldTime = Math.max(0, m.shieldTime - dt);
    if (!m.shieldTime) m.shield = 0;
    m.staticTime = Math.max(0, m.staticTime - dt);
    if (!m.staticTime) m.static = 0;
  }
  q.trainingRespawn = q.trainingRespawn.map((v, i) => {
    const t = Math.max(0, v - dt);
    if (v > 0 && t === 0) q.training[i] = 240;
    return t;
  });
  for (const zone of q.zones) {
    zone.remaining = Math.max(0, zone.remaining - dt);
    zone.pulse -= dt;
    if (
      zone.pulse <= 1e-8 &&
      q.equipped.includes(zone.species) &&
      next.creatures[zone.species]?.hp &&
      !isWorking(next, zone.species)
    ) {
      const a = ABILITIES[zone.species][zone.slot];
      for (const t of targets(next).filter(
        (t) =>
          distance(t.position, zone.position) <= a.radius &&
          distance(next.position, t.position) <= 20
      ))
        next = damage(next, zone.species, t, a.power, a.element, positions);
      zone.pulse += 1;
    }
  }
  q.zones = q.zones.filter((z) => z.remaining > 1e-8);
  for (const id of q.equipped) {
    if (id === next.active || next.creatures[id]!.hp <= 0 || q.stance === 'passive') continue;
    const critical = next.creatures[id]!.hp <= maxCreatureHp(next.creatures[id]!) * 0.2;
    const hostile = targets(next).find(
      (t) =>
        t.id === 'guardian' &&
        distance(next.position, t.position) <=
          (q.stance === 'aggressive' || q.order === 'focus' ? 12 : 8)
    );
    const focus =
      q.order === 'focus'
        ? targets(next).find((t) => t.id === q.target && distance(next.position, t.position) <= 12)
        : undefined;
    const target = focus ?? hostile;
    if (id === 'aquabub' && levelFromXp(next.creatures[id]!.xp).level >= 5) {
      const result = cast(next, id, 'E', undefined, positions);
      if (!result.error) {
        next = result.save;
        effects.push(...result.effects);
      }
    }
    if (critical || q.order === 'retreat') {
      if (id === 'mosshell' && target && levelFromXp(next.creatures[id]!.xp).level >= 5) {
        const shield = cast(next, id, 'E', target.id, positions);
        if (!shield.error) {
          next = shield.save;
          effects.push(...shield.effects);
        }
      }
      continue;
    }
    if (target) {
      if (id !== 'aquabub' && levelFromXp(next.creatures[id]!.xp).level >= 5) {
        const ability = cast(next, id, 'E', target.id, positions);
        if (!ability.error) {
          next = ability.save;
          effects.push(...ability.effects);
        }
      }
      const slot = memberOf(next, id).cooldowns.Q <= 0 ? 'Q' : 'basic';
      const result = cast(next, id, slot, target.id, positions);
      if (!result.error) {
        next = result.save;
        effects.push(...result.effects);
      }
    }
  }
  return { save: next, effects };
}
