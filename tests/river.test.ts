import { describe, it, expect } from 'vitest';
import { RIVER, BRIDGE, bridgeHeight, riverDepth, waterMotion } from '../src/game/river';
import { CREATURES, OBJECTS } from '../src/game/data';
describe('arched river crossing', () => {
  it('raises the center and keeps the arch symmetric with reachable ends', () => {
    expect(bridgeHeight(BRIDGE.left)).toBeCloseTo(0.1);
    expect(bridgeHeight(BRIDGE.right)).toBeCloseTo(0.1);
    expect(bridgeHeight(39)).toBeCloseTo(1.45);
    expect(bridgeHeight(37)).toBeCloseTo(bridgeHeight(41));
  });
  it('keeps Aquabub on dry ground outside the bridge footprint', () => {
    const [x, , z] = CREATURES.aquabub.pos;
    expect(x > RIVER.right || x < RIVER.left || z < RIVER.north || z > RIVER.south).toBe(true);
    expect(Math.abs(z - BRIDGE.z)).toBeGreaterThan(BRIDGE.width / 2 + 1);
  });
});
describe('shallow water response', () => {
  it('does not affect the player on the bank or above the bridge', () => {
    expect(riverDepth({ x: 46, y: 0.76, z: -22 })).toBe(0);
    expect(riverDepth({ x: 39, y: bridgeHeight(39) + 0.76, z: -15 })).toBe(0);
  });
  it('slows submerged movement and damps falling with buoyancy', () => {
    const wet = waterMotion({ x: 39, y: -0.19, z: -25 }, -2, 1 / 60);
    expect(wet.depth).toBeGreaterThan(0.9);
    expect(wet.speedScale).toBe(0.55);
    expect(wet.verticalSpeed).toBeGreaterThan(-2);
  });
  it('leaves dry movement unchanged and bounds unstable frame deltas', () => {
    expect(waterMotion({ x: 30, y: 1, z: 0 }, 3, 0.02)).toEqual({
      depth: 0,
      speedScale: 1,
      verticalSpeed: 3,
    });
    expect(waterMotion({ x: 39, y: -0.19, z: -25 }, -2, 10)).toEqual(
      waterMotion({ x: 39, y: -0.19, z: -25 }, -2, 0.05)
    );
  });
});

it('keeps ground resources out of the lowered river and bridge walkway', () => {
  expect(
    OBJECTS.filter(
      (o) =>
        o.kind === 'resource' &&
        o.pos[0] > RIVER.left &&
        o.pos[0] < RIVER.right &&
        o.pos[2] > RIVER.north &&
        o.pos[2] < RIVER.south
    )
  ).toEqual([]);
});
