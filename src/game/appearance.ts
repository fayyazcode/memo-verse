export const SKINS = {
  meadow: { name: 'Meadow', hoodie: '#e6d8be', accent: '#c7b99c', accessory: 'none' },
  explorer: { name: 'Forest Explorer', hoodie: '#678566', accent: '#d5c28f', accessory: 'cap' },
  starlight: { name: 'Starlight', hoodie: '#9294c6', accent: '#e4d8f1', accessory: 'scarf' },
  sunset: { name: 'Sunset', hoodie: '#d58c6e', accent: '#f2d28f', accessory: 'scarf' },
  river: { name: 'River Scout', hoodie: '#72aeb5', accent: '#d2e8d6', accessory: 'cap' },
} as const;
export type SkinId = keyof typeof SKINS;
export function cameraDistance(
  settings: { distance: number; mobileDistance: number },
  mobile: boolean
) {
  return mobile ? settings.mobileDistance : settings.distance;
}
export function gaitPose(distance: number, speed: number, index: number) {
  const phase = distance * 8 + (index === 0 || index === 3 ? 0 : Math.PI);
  const blend = Math.min(1, Math.max(0, speed / 2));
  return {
    swing: Math.sin(phase) * 0.55 * blend,
    lift: Math.max(0, Math.sin(phase)) * 0.07 * blend,
  };
}
export function attackPose(now: number, start: number, duration = 650) {
  const t = Math.max(0, Math.min(1, (now - start) / duration));
  return Math.sin(t * Math.PI);
}
