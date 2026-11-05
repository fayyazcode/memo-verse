import { describe, it, expect } from 'vitest';
import { joystickVector, resetTouch, touchInput, touchLook } from '../src/game/touch';
describe('touch movement', () => {
  it('has a dead zone and preserves analog strength', () => {
    expect(joystickVector(2, 2, 40)).toEqual({ x: 0, z: 0 });
    expect(joystickVector(20, 0, 40)).toEqual({ x: 0.5, z: 0 });
  });
  it('clamps diagonal movement to a circle', () => {
    const v = joystickVector(100, -100, 40);
    expect(Math.hypot(v.x, v.z)).toBeCloseTo(1);
    expect(v.x).toBeGreaterThan(0);
    expect(v.z).toBeLessThan(0);
  });
  it('clears held controls on interruptions', () => {
    Object.assign(touchInput, { x: 1, z: -1, jump: true, sprint: true, remove: true });
    touchLook.pointer = 2;
    touchLook.dragged = true;
    resetTouch();
    expect(touchInput).toMatchObject({ x: 0, z: 0, jump: false, sprint: false, remove: false });
    expect(touchLook.pointer).toBeNull();
    expect(touchLook.dragged).toBe(false);
  });
});
