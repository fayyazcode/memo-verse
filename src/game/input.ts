export const keys = new Set<string>();
export const motion = { yaw: 0, pitch: 0.43, rotating: false };
export const playerRuntime = {
  position: [0, 1, 5] as [number, number, number],
  moving: false,
  running: false,
  grounded: true,
  action: 'idle',
  actionUntil: 0,
};
