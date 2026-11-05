export const RIVER = { left: 34.5, right: 43.5, north: -43, south: -7, level: 0.06, bed: -0.95 };
export const BRIDGE = { left: 34.5, right: 43.5, z: -15, width: 3.4 };
export function bridgeHeight(x: number) {
  const t = Math.max(0, Math.min(1, (x - BRIDGE.left) / (BRIDGE.right - BRIDGE.left)));
  return 0.1 + 1.35 * Math.sin(Math.PI * t);
}
export function riverDepth(position: { x: number; y: number; z: number }) {
  return position.x > RIVER.left &&
    position.x < RIVER.right &&
    position.z > RIVER.north &&
    position.z < RIVER.south
    ? Math.max(0, Math.min(1.2, RIVER.level - (position.y - 0.76)))
    : 0;
}
export function waterMotion(
  position: { x: number; y: number; z: number },
  verticalSpeed: number,
  dt: number
) {
  const depth = riverDepth(position);
  return {
    depth,
    speedScale: depth > 0.12 ? 0.55 : 1,
    verticalSpeed:
      depth > 0
        ? verticalSpeed + (depth * 8 - verticalSpeed * 2.2) * Math.min(dt, 0.05)
        : verticalSpeed,
  };
}
