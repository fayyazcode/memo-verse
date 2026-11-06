export const BINDING_OPTIONS = [
  'Tab',
  'KeyQ',
  'KeyR',
  'KeyT',
  'KeyY',
  'KeyU',
  'KeyZ',
  'KeyX',
  'BracketLeft',
  'BracketRight',
  'Shift+KeyQ',
  'Shift+KeyE',
  'Shift+KeyR',
  'Shift+KeyT',
  'Shift+KeyZ',
  'Shift+KeyX',
];
export const defaultBindings = {
  squad: 'Tab',
  Q: 'KeyQ',
  E: 'Shift+KeyE',
  R: 'KeyR',
  previous: 'KeyZ',
  next: 'KeyX',
};
export type Bindings = typeof defaultBindings;
export function validBindings(b: Bindings) {
  return (
    !!b &&
    Object.keys(defaultBindings).every((k) => BINDING_OPTIONS.includes(b[k as keyof Bindings])) &&
    new Set(Object.values(b)).size === 6
  );
}
export const bindingLabel = (code: string) =>
  code.replaceAll('Key', '').replace('BracketLeft', '[').replace('BracketRight', ']');
export const eventBinding = (e: { code: string; shiftKey: boolean }) =>
  (e.shiftKey ? 'Shift+' : '') + e.code;
