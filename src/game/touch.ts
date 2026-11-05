export const touchInput = { x: 0, z: 0, jump: false, sprint: false, remove: false };
export const touchLook = {
  pointer: null as number | null,
  x: 0,
  y: 0,
  startX: 0,
  startY: 0,
  dragged: false,
};
export function joystickVector(x: number, y: number, radius: number) {
  const distance = Math.hypot(x, y);
  if (distance < radius * 0.12) return { x: 0, z: 0 };
  const scale = Math.min(1, distance / radius) / distance;
  return { x: x * scale, z: y * scale };
}
export function resetTouch() {
  touchInput.x = 0;
  touchInput.z = 0;
  touchInput.jump = false;
  touchInput.sprint = false;
  touchInput.remove = false;
  touchLook.pointer = null;
  touchLook.dragged = false;
}
