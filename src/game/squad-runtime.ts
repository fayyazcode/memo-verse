import type { Species, Vec3 } from './data';
import type { Effect, Positions } from './squad';
import { playerRuntime } from './input';
const createRuntime = () => ({
  ready: false,
  speed: 0,
  distance: 0,
  position: [0, 0, 0] as Vec3,
  attackStarted: 0,
  attackUntil: 0,
  elemental: false,
  target: [92, 0, 20] as Vec3,
});
export const squadRuntime: Record<Species, ReturnType<typeof createRuntime>> = {
  emberfox: createRuntime(),
  aquabub: createRuntime(),
  mosshell: createRuntime(),
  zaplet: createRuntime(),
};
export const abilityEffects: (Effect & { serial: number })[] = [];
let serial = 0;
export function combatPositions(): Positions {
  return Object.fromEntries(
    Object.entries(squadRuntime)
      .filter(
        ([, r]) =>
          r.ready &&
          Math.hypot(
            r.position[0] - playerRuntime.position[0],
            r.position[2] - playerRuntime.position[2]
          ) < 30
      )
      .map(([id, r]) => [id, r.position])
  );
}
export function showEffects(effects: Effect[]) {
  for (const e of effects) {
    const r = squadRuntime[e.species];
    r.attackStarted = Date.now();
    r.attackUntil = Date.now() + 650;
    r.elemental = e.slot !== 'basic';
    r.target = [...e.end];
    abilityEffects.push({ ...e, serial: ++serial });
  }
  if (abilityEffects.length > 32) abilityEffects.splice(0, abilityEffects.length - 32);
}
