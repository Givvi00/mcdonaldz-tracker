const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// A coin-edge ring (knurled, like a wax seal) around the centre, built once as a plain path string
const TEETH = 16;
const OUTER_R = 17;
const INNER_R = 14;
const RING_PATH = (() => {
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

/**
 * A little "verified" seal for a visit confirmed by the phone's own GPS at the moment you marked it: a slowly
 * spinning knurled coin edge (like a wax seal) around a plain checkmark, which stays upright.
 */
export function VerifiedBadge({ size = 32 }: { size?: number }) {
  const still = prefersReducedMotion();
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} role="img" aria-label="Visita verificata col GPS">
      <defs>
        <linearGradient id="verified-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7DB8FF" />
          <stop offset="0.55" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <g>
        <path d={RING_PATH} fill="url(#verified-grad)" stroke="#12327A" strokeWidth="0.6" strokeLinejoin="round" />
        {!still && (
          <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="9s" repeatCount="indefinite" />
        )}
      </g>
      <circle cx="20" cy="20" r="12.5" fill="url(#verified-grad)" stroke="#fff" strokeWidth="2" />
      <path d="M14 20.3L18 24.3L26.5 15" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
