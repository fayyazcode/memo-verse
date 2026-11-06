export const keys = new Set<string>();
export const motion = { yaw: 0, pitch: 0.68, rotating: false };
export const playerRuntime = {
  position: [0, 1, 5] as [number, number, number],
  moving: false,
  running: false,
  grounded: true,
  sheltered: false,
  heading: 0,
  action: 'idle',
  actionUntil: 0,
  actionStarted: 0,
  harvest: null as null | {
    id: string;
    item: import('./data').ItemId;
    position: [number, number, number];
    started: number;
  },
};

// Transient intent, deliberately excluded from saved adventures.
export const navigation = {
  destination: null as { x: number; z: number; interaction?: string } | null,
};

export const companionRuntime = {
  speed: 0,
  distance: 0,
  position: [0, 0, 0] as [number, number, number],
  attackStarted: 0,
  attackUntil: 0,
  elemental: false,
  target: [92, 0, 20] as [number, number, number],
};
