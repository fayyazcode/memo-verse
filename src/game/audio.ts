let context: AudioContext | undefined;
let ambient: OscillatorNode | undefined;
let ambientGain: GainNode | undefined;
export function sound(
  kind: 'gather' | 'reward' | 'click' | 'hit' | 'friend' | 'jump',
  volume = 0.35
) {
  try {
    context ??= new AudioContext();
    void context.resume();
    const osc = context.createOscillator(),
      gain = context.createGain();
    const now = context.currentTime;
    const frequencies = { gather: 540, reward: 660, click: 320, hit: 140, friend: 880, jump: 240 };
    osc.type = kind === 'hit' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(frequencies[kind], now);
    osc.frequency.exponentialRampToValueAtTime(
      frequencies[kind] * (kind === 'hit' ? 0.4 : 1.5),
      now + 0.15
    );
    gain.gain.setValueAtTime(volume * 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain).connect(context.destination);
    osc.start();
    osc.stop(now + 0.26);
  } catch {
    /* Audio must never block gameplay. */
  }
}
export function ambience(volume: number) {
  if (volume <= 0 && !context) return;
  try {
    context ??= new AudioContext();
    void context.resume();
    if (!ambient) {
      ambient = context.createOscillator();
      ambientGain = context.createGain();
      ambient.type = 'sine';
      ambient.frequency.value = 110;
      ambient.connect(ambientGain).connect(context.destination);
      ambient.start();
    }
    ambientGain!.gain.setTargetAtTime(volume * 0.012, context.currentTime, 0.5);
  } catch {}
}
