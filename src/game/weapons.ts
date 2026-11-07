import type { Save } from './store';
import type { Vec3 } from './data';
import { damage, distance, squadOf, targets } from './squad';
import { inMeadow } from './hunting';

export type Weapon = 'sword' | 'bow';
export const WEAPONS = {
  sword: { name: 'Sword', power: 18, range: 2.8, cooldown: 0.55 },
  bow: { name: 'Bow', power: 14, range: 11, cooldown: 0.9 },
};
export type Arrow = { position: Vec3; direction: Vec3; remaining: number; target: string | null };
export const weaponOf = (s: Save): Weapon => s.weapon ?? 'sword';
const owned = (s: Save): Save => ({
  ...s,
  creatures: structuredClone(s.creatures),
  squad: structuredClone(squadOf(s)),
});
// Basic player weapons are independent of companion health, levels and position.
export function strike(s: Save, selected: string | null, heading: number) {
  const weapon = weaponOf(s),
    stats = WEAPONS[weapon];
  const available = targets(s).filter(
    (t) =>
      distance(s.position, t.position) <= stats.range &&
      Math.abs(s.position[1] - t.position[1]) < 3 &&
      (!t.id.startsWith('hunt') || inMeadow(s.position))
  );
  const target =
    available.find((t) => t.id === selected) ??
    available
      .filter((t) => !t.id.startsWith('training'))
      .sort((a, b) => distance(s.position, a.position) - distance(s.position, b.position))[0] ??
    available[0];
  const next = owned(s);
  if (target) next.squad!.target = target.id;
  next.attackCooldown = stats.cooldown;
  const start: Vec3 = [s.position[0], s.position[1] + 0.1, s.position[2]];
  const end: Vec3 = target
    ? [target.position[0], target.position[1] + 0.6, target.position[2]]
    : [
        start[0] + Math.sin(heading) * stats.range,
        start[1],
        start[2] + Math.cos(heading) * stats.range,
      ];
  const length = Math.hypot(...end.map((v, i) => v - start[i])) || 1;
  const arrow: Arrow | null =
    weapon === 'bow'
      ? {
          position: start,
          direction: end.map((v, i) => (v - start[i]) / length) as Vec3,
          remaining: stats.range,
          target: target?.id ?? null,
        }
      : null;
  if (weapon === 'sword' && target) damage(next, null, target, stats.power, 'Neutral', {});
  return { save: next, arrow, end, target: target?.id ?? null };
}
// Straight, finite arrows. Moving out of their flight path dodges them; menus pause flight.
export function flyArrows(s: Save, arrows: Arrow[], dt: number) {
  let next = s;
  const remaining: Arrow[] = [];
  for (const arrow of arrows) {
    const step = Math.min(arrow.remaining, dt * 16);
    const end = arrow.position.map((v, i) => v + arrow.direction[i] * step) as Vec3;
    const victim = targets(next)
      .filter((t) => !t.id.startsWith('hunt') || inMeadow(s.position))
      .map((t) => {
        const point: Vec3 = [t.position[0], t.position[1] + 0.6, t.position[2]];
        const along = Math.max(
          0,
          Math.min(
            step,
            point.reduce((sum, v, i) => sum + (v - arrow.position[i]) * arrow.direction[i], 0)
          )
        );
        const gap = Math.hypot(
          ...point.map((v, i) => v - arrow.position[i] - along * arrow.direction[i])
        );
        return { t, along, gap };
      })
      .filter((hit) => hit.gap < 0.65)
      .sort((a, b) => a.along - b.along)[0];
    if (victim) {
      if (next === s) next = owned(s);
      damage(next, null, victim.t, WEAPONS.bow.power, 'Neutral', {});
    } else if (arrow.remaining > step)
      remaining.push({ ...arrow, position: end, remaining: arrow.remaining - step });
  }
  return { save: next, arrows: remaining };
}
