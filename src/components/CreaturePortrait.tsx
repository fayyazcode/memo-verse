import { CREATURES, type Species } from '@/game/data';
export default function CreaturePortrait({ species }: { species: Species }) {
  const c = CREATURES[species];
  return (
    <svg
      viewBox="0 0 180 120"
      width="160"
      height="115"
      role="img"
      aria-label={`${c.name} portrait`}
    >
      <ellipse cx="90" cy="104" rx="40" ry="7" fill="#405734" opacity=".1" />
      {species === 'emberfox' && <path d="M113 92 Q162 83 133 47 Q148 80 105 76" fill="#f3c37e" />}
      {species === 'aquabub' && (
        <>
          <ellipse cx="53" cy="80" rx="20" ry="8" fill="#a6dfe0" transform="rotate(-25 53 80)" />
          <ellipse cx="127" cy="80" rx="20" ry="8" fill="#a6dfe0" transform="rotate(25 127 80)" />
        </>
      )}
      <ellipse cx="90" cy="81" rx={species === 'mosshell' ? 42 : 29} ry="25" fill={c.color} />
      {species === 'mosshell' && (
        <>
          <ellipse cx="90" cy="65" rx="37" ry="23" fill="#5c8056" />
          {[68, 90, 112].map((x, i) => (
            <path
              key={x}
              d={`M${x} ${48 + (i % 2) * 8} l10 6 v12 l-10 6 -10 -6 v-12z`}
              fill="#a5ba73"
            />
          ))}
        </>
      )}
      {species === 'zaplet' && (
        <>
          <path
            d="M53 58 l-9 -16 -4 19 -13 3 16 14zM127 58 l9 -16 4 19 13 3 -16 14z"
            fill="#b0a5cd"
          />
        </>
      )}
      {(species === 'emberfox' || species === 'zaplet') && (
        <>
          <path d="M64 53 L61 14 83 45M97 45 L119 14 116 53" fill={c.color} />
          <path
            d="M68 41 L66 25 76 44M104 44 L114 25 112 41"
            fill={species === 'emberfox' ? '#a65f59' : '#fff0b3'}
          />
        </>
      )}
      {species === 'aquabub' && <path d="M85 45 Q78 21 93 14 Q107 32 96 45" fill="#a6e0df" />}
      <ellipse cx="90" cy={species === 'mosshell' ? 82 : 60} rx="28" ry="24" fill={c.color} />
      <ellipse
        cx="90"
        cy={species === 'mosshell' ? 91 : 74}
        rx="17"
        ry="10"
        fill="#f6efd0"
        opacity=".8"
      />
      {[78, 102].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={species === 'mosshell' ? 79 : 59} rx="5" ry="7" fill="#263e35" />
          <circle cx={x - 1.5} cy={species === 'mosshell' ? 77 : 57} r="1.7" fill="#fff9ea" />
        </g>
      ))}
      <path
        d={species === 'mosshell' ? 'M85 91 Q90 96 95 91' : 'M85 74 Q90 79 95 74'}
        fill="none"
        stroke="#617452"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {species === 'zaplet' && <path d="M90 40 l-5 10 7 -2 -2 8 8 -12 -7 2z" fill="#fff3c3" />}
    </svg>
  );
}
