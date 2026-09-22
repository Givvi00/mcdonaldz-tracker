import { useId } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// A coin-edge ring (knurled, like a wax seal) around the centre, built once as a plain path string
const TEETH = 16;
const OUTER_R = 18.5;
const INNER_R = 16;
export const RING_PATH = (() => {
  const pts: string[] = [];
  for (let i = 0; i < TEETH * 2; i++) {
    const r = i % 2 === 0 ? OUTER_R : INNER_R;
    const angle = (i / (TEETH * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = 20 + r * Math.cos(angle);
    const y = 20 + r * Math.sin(angle);
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ') + ' Z';
})();

const SPARKLES = [
  { x: 5, y: 8, size: 3.2, delay: 0 },
  { x: 34, y: 30, size: 2.6, delay: 0.9 },
];

function Sparkle({ x, y, size, delay, still }: { x: number; y: number; size: number; delay: number; still: boolean }) {
  return (
    <path
      d={`M${x} ${y - size}C${x + size * 0.1} ${y - size * 0.25} ${x + size * 0.25} ${y - size * 0.1} ${x + size} ${y}C${x + size * 0.25} ${y + size * 0.1} ${x + size * 0.1} ${y + size * 0.25} ${x} ${y + size}C${x - size * 0.1} ${y + size * 0.25} ${x - size * 0.25} ${y + size * 0.1} ${x - size} ${y}C${x - size * 0.25} ${y - size * 0.1} ${x - size * 0.1} ${y - size * 0.25} ${x} ${y - size}Z`}
      fill="#EAF4FF"
    >
      {!still && (
        <animate attributeName="opacity" values="0;1;0" dur="2.4s" begin={`${delay}s`} repeatCount="indefinite" />
      )}
    </path>
  );
}

/**
 * A little "verified" seal for a visit confirmed by the phone's own GPS at the moment you marked it: a slowly
 * spinning knurled coin edge (like a wax seal), a soft blue glow behind it and a couple of sparkles, around a
 * plain checkmark that stays upright.
 */
export function VerifiedBadge({ size = 38 }: { size?: number }) {
  const still = prefersReducedMotion();
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      role="img"
      aria-label="Visita verificata"
      style={{ overflow: 'visible', filter: `drop-shadow(0 1px 3px rgba(15,52,122,.55)) drop-shadow(0 0 6px rgba(59,130,246,.55))` }}
    >
      <defs>
        <linearGradient id={`verified-grad-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9DCCFF" />
          <stop offset="0.5" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1541A8" />
        </linearGradient>
        <radialGradient id={`verified-glow-${uid}`}>
          <stop offset="0" stopColor="#7DB8FF" stopOpacity=".65" />
          <stop offset="1" stopColor="#7DB8FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill={`url(#verified-glow-${uid})`} />
      <g>
        <path d={RING_PATH} fill={`url(#verified-grad-${uid})`} stroke="#0C2A66" strokeWidth="0.6" strokeLinejoin="round" />
        {!still && (
          <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="7s" repeatCount="indefinite" />
        )}
      </g>
      {SPARKLES.map((s, i) => (
        <Sparkle key={i} {...s} still={still} />
      ))}
      <circle cx="20" cy="20" r="15" fill={`url(#verified-grad-${uid})`} stroke="#fff" strokeWidth="2" />
      {/* a glossy highlight across the top, like a polished stone */}
      <path d="M11.19,12.61 A11.5,11.5 0 0 1 28.81,12.61" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 20.3L18 24.3L26.5 15" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
