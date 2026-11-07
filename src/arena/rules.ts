export type ArenaWeapon = 'sword' | 'bow';
export type ArenaSkin = 'meadow' | 'explorer' | 'starlight' | 'sunset' | 'river';
export type Point = { x: number; z: number };
export const ARENA = {
  radius: 7.5,
  speed: 4.5,
  hp: 100,
  roundTime: 180,
  countdown: 3,
  reconnect: 15,
};
export const ARMORY = {
  sword: { damage: 20, range: 2.6, cooldown: 0.65 },
  bow: { damage: 14, range: 16, cooldown: 0.9 },
};
export type Fighter = {
  id: string;
  name: string;
  skin: ArenaSkin;
  position: Point;
  heading: number;
  hp: number;
  weapon: ArenaWeapon;
  cooldown: number;
  ready: boolean;
  connected: boolean;
  moving: boolean;
  action: number;
  actionTime: number;
  hurt: number;
  input: Point;
  inputAge: number;
};
export type Shot = {
  id: number;
  owner: string;
  position: Point;
  direction: Point;
  remaining: number;
};
export type Room = {
  code: string;
  publicMatch: boolean;
  phase: 'waiting' | 'countdown' | 'fighting' | 'paused' | 'finished';
  previous: 'waiting' | 'countdown' | 'fighting';
  players: Fighter[];
  shots: Shot[];
  remaining: number;
  countdown: number;
  round: number;
  serial: number;
  winner: string | null;
  reason: 'knockout' | 'time' | 'left' | 'disconnect' | null;
};
export type RoomView = Omit<Room, 'previous' | 'serial' | 'players'> & {
  players: Omit<Fighter, 'input' | 'inputAge'>[];
};
export const createRoom = (code: string, publicMatch = false): Room => ({
  code,
  publicMatch,
  phase: 'waiting',
  previous: 'waiting',
  players: [],
  shots: [],
  remaining: ARENA.roundTime,
  countdown: 0,
  round: 0,
  serial: 0,
  winner: null,
  reason: null,
});
export function addPlayer(room: Room, id: string, name: string, skin: ArenaSkin) {
  if (room.players.length >= 2 || room.phase !== 'waiting') return false;
  room.players.push({
    id,
    name,
    skin,
    position: { x: room.players.length ? 4 : -4, z: 0 },
    heading: room.players.length ? -Math.PI / 2 : Math.PI / 2,
    hp: 100,
    weapon: 'sword',
    cooldown: 0,
    ready: false,
    connected: true,
    moving: false,
    action: 0,
    actionTime: 0,
    hurt: 0,
    input: { x: 0, z: 0 },
    inputAge: 1,
  });
  return true;
}
export function snapshot(room: Room): RoomView {
  const { previous: _previous, serial: _serial, players, ...rest } = room;
  return structuredClone({
    ...rest,
    players: players.map(({ input: _input, inputAge: _age, ...p }) => p),
  });
}
export function finish(room: Room, winner: string | null, reason: NonNullable<Room['reason']>) {
  if (room.phase === 'finished') return;
  room.phase = 'finished';
  room.winner = winner;
  room.reason = reason;
  room.shots = [];
  room.players.forEach((p) => {
    p.ready = false;
    p.input = { x: 0, z: 0 };
    p.moving = false;
  });
}
export function setReady(room: Room, id: string) {
  const p = room.players.find((p) => p.id === id);
  if (!p || !p.connected || !['waiting', 'finished'].includes(room.phase)) return;
  p.ready = true;
  if (room.players.length === 2 && room.players.every((p) => p.connected && p.ready)) {
    room.players.forEach((p, i) => {
      p.hp = 100;
      p.position = { x: i ? 4 : -4, z: 0 };
      p.heading = i ? -Math.PI / 2 : Math.PI / 2;
      p.cooldown = 0;
      p.input = { x: 0, z: 0 };
      p.inputAge = 1;
      p.moving = false;
      p.actionTime = 0;
      p.hurt = 0;
    });
    room.phase = 'countdown';
    room.countdown = ARENA.countdown;
    room.remaining = ARENA.roundTime;
    room.round++;
    room.winner = null;
    room.reason = null;
    room.shots = [];
  }
}
export function connected(room: Room, id: string, value: boolean) {
  const p = room.players.find((p) => p.id === id);
  if (!p) return;
  p.connected = value;
  p.input = { x: 0, z: 0 };
  p.moving = false;
  if (room.phase === 'finished') return;
  if (!value && ['countdown', 'fighting'].includes(room.phase)) {
    room.previous = room.phase as 'countdown' | 'fighting';
    room.phase = 'paused';
    room.players.forEach((f) => {
      f.input = { x: 0, z: 0 };
      f.moving = false;
    });
  } else if (value && room.phase === 'paused' && room.players.every((p) => p.connected))
    room.phase = room.previous;
}
export function move(room: Room, id: string, input: Point) {
  const p = room.players.find((p) => p.id === id);
  if (
    !p ||
    !p.connected ||
    room.phase !== 'fighting' ||
    !Number.isFinite(input.x) ||
    !Number.isFinite(input.z)
  )
    return;
  const length = Math.max(1, Math.hypot(input.x, input.z));
  p.input = { x: input.x / length, z: input.z / length };
  p.inputAge = 0;
}
export function switchWeapon(room: Room, id: string) {
  const p = room.players.find((p) => p.id === id);
  if (p?.connected && room.phase !== 'paused') p.weapon = p.weapon === 'sword' ? 'bow' : 'sword';
}
export function attack(room: Room, id: string) {
  const p = room.players.find((p) => p.id === id),
    enemy = room.players.find((p) => p.id !== id);
  if (
    room.phase !== 'fighting' ||
    !p?.connected ||
    !enemy?.connected ||
    p.cooldown > 1e-8 ||
    p.hp <= 0
  )
    return false;
  const dx = enemy.position.x - p.position.x,
    dz = enemy.position.z - p.position.z,
    length = Math.hypot(dx, dz) || 1,
    stats = ARMORY[p.weapon];
  p.heading = Math.atan2(dx, dz);
  p.cooldown = stats.cooldown;
  p.action++;
  p.actionTime = 0.45;
  if (p.weapon === 'sword') {
    if (length <= stats.range) {
      enemy.hp = Math.max(0, enemy.hp - stats.damage);
      enemy.hurt = 0.25;
    }
  } else
    room.shots.push({
      id: ++room.serial,
      owner: p.id,
      position: { ...p.position },
      direction: { x: dx / length, z: dz / length },
      remaining: stats.range,
    });
  if (enemy.hp === 0) finish(room, p.id, 'knockout');
  return true;
}
const bound = (p: Point) => {
  const ratio = Math.max(1, Math.hypot(p.x, p.z) / ARENA.radius);
  p.x /= ratio;
  p.z /= ratio;
};
export function tickRoom(room: Room, dt: number) {
  if (!Number.isFinite(dt) || dt <= 0 || dt > 0.1) return;
  if (room.phase === 'countdown') {
    room.countdown = Math.max(0, room.countdown - dt);
    if (room.countdown < 1e-8) {
      room.countdown = 0;
      room.phase = 'fighting';
    }
    return;
  }
  if (room.phase !== 'fighting') return;
  room.remaining = Math.max(0, room.remaining - dt);
  room.players.forEach((p) => {
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.actionTime = Math.max(0, p.actionTime - dt);
    p.hurt = Math.max(0, p.hurt - dt);
    p.inputAge += dt;
    p.moving = p.connected && p.inputAge < 0.35 && Math.hypot(p.input.x, p.input.z) > 0.01;
    if (p.moving) {
      p.position.x += p.input.x * ARENA.speed * dt;
      p.position.z += p.input.z * ARENA.speed * dt;
      if (p.actionTime === 0) p.heading = Math.atan2(p.input.x, p.input.z);
      bound(p.position);
    }
  });
  const [a, b] = room.players;
  if (a && b) {
    const dx = b.position.x - a.position.x,
      dz = b.position.z - a.position.z,
      len = Math.hypot(dx, dz);
    if (len < 1.05) {
      const nx = len ? dx / len : 1,
        nz = len ? dz / len : 0,
        push = (1.05 - len) / 2;
      a.position.x -= nx * push;
      a.position.z -= nz * push;
      b.position.x += nx * push;
      b.position.z += nz * push;
      bound(a.position);
      bound(b.position);
    }
  }
  room.shots = room.shots.filter((s) => {
    const enemy = room.players.find((p) => p.id !== s.owner);
    if (!enemy) return false;
    const step = Math.min(s.remaining, dt * 13),
      dx = enemy.position.x - s.position.x,
      dz = enemy.position.z - s.position.z;
    const along = Math.max(0, Math.min(step, dx * s.direction.x + dz * s.direction.z));
    if (Math.hypot(dx - s.direction.x * along, dz - s.direction.z * along) < 0.55) {
      enemy.hp = Math.max(0, enemy.hp - ARMORY.bow.damage);
      enemy.hurt = 0.25;
      return false;
    }
    s.position.x += s.direction.x * step;
    s.position.z += s.direction.z * step;
    s.remaining -= step;
    return s.remaining > 1e-8 && Math.hypot(s.position.x, s.position.z) < 9;
  });
  const defeated = room.players.find((p) => p.hp === 0);
  if (defeated) {
    const winner = room.players.find((p) => p.id !== defeated.id && p.hp > 0);
    finish(room, winner?.id ?? null, 'knockout');
  } else if (room.remaining <= 1e-8)
    finish(room, a.hp === b.hp ? null : a.hp > b.hp ? a.id : b.id, 'time');
}
