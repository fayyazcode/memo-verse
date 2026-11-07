'use client';
import { Sword } from 'lucide-react';
import { useGame } from '@/game/store';
import { weaponOf, WEAPONS } from '@/game/weapons';
export function Bow({ size = 21 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 3c16 1 16 17 0 18L9 12 5 3Z" />
      <path d="M3 12h18m-3-3 3 3-3 3" />
    </svg>
  );
}
export default function WeaponSwitch({ chooser = false }: { chooser?: boolean }) {
  const weapon = useGame((s) => weaponOf(s.save));
  if (chooser)
    return (
      <section className="weapon-loadout" aria-label="Player weapons">
        <h3>Adventure weapons</h3>
        <p>
          Sword for close combat · Bow for ranged shots. No companion or ammo needed. Press G to
          switch.
        </p>
        <div>
          {(['sword', 'bow'] as const).map((id) => {
            const Icon = id === 'sword' ? Sword : Bow;
            return (
              <button
                key={id}
                aria-label={`Equip ${WEAPONS[id].name.toLowerCase()}`}
                aria-pressed={weapon === id}
                onClick={() => useGame.getState().switchWeapon(id)}
              >
                <Icon size={22} />
                {WEAPONS[id].name}
                <small>{WEAPONS[id].range}m range</small>
              </button>
            );
          })}
        </div>
      </section>
    );
  const Icon = weapon === 'sword' ? Sword : Bow;
  return (
    <button
      className="touch-weapon"
      aria-label={`Switch to ${weapon === 'sword' ? 'bow' : 'sword'}`}
      title={`${WEAPONS[weapon].name} equipped · G to switch`}
      onClick={() => useGame.getState().switchWeapon()}
    >
      <Icon size={21} />
      <small>{WEAPONS[weapon].name}</small>
    </button>
  );
}
