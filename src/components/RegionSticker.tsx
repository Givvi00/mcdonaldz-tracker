import { useId, useMemo } from 'react';
import { REGION_SHAPES } from '@/data/regionShapes';
import type { RegionSummary, RegionTier } from '@/services/regions';
import { pointsInside, seededRandom, splitName } from '@/utils/regionSticker';

const INK = '#3B2A22';
const RED = '#C8281C';
const MAX_DOTS = 26;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const CARD: Record<RegionTier, { card: string; frame: string; frameW: number; panel: string; land: string }> = {
  empty: { card: '#F3ECE1', frame: '#8B7D6E', frameW: 2.5, panel: '#E6DDCF', land: '#6A5D52' },
  progress: { card: '#FFFFFF', frame: INK, frameW: 3, panel: '#FBF4E2', land: '#FFF7E0' },
  silver: { card: '#F4F6F8', frame: '#8E99A4', frameW: 5, panel: '#E8ECEF', land: 'silver' },
  gold: { card: '#FFF8DC', frame: '#E0A100', frameW: 5.5, panel: '#FFEBA0', land: 'gold' },
};

/** Sine-like wave across `width`, at height `y`, closed downwards; `periods` full periods long */
function wavePath(x0: number, y: number, period: number, periods: number, amp: number, bottom: number): string {
  let d = `M ${x0} ${y} Q ${x0 + period / 4} ${y - 2 * amp} ${x0 + period / 2} ${y}`;
  for (let i = 1; i < periods * 2; i++) d += ` T ${x0 + (period / 2) * (i + 1)} ${y}`;
  return `${d} L ${x0 + period * periods} ${bottom} L ${x0} ${bottom} Z`;
}

/** Just the wavy top edge of the liquid: the foam */
function waveLine(x0: number, y: number, period: number, periods: number, amp: number): string {
  let d = `M ${x0} ${y} Q ${x0 + period / 4} ${y - 2 * amp} ${x0 + period / 2} ${y}`;
  for (let i = 1; i < periods * 2; i++) d += ` T ${x0 + (period / 2) * (i + 1)} ${y}`;
  return d;
}

// Glitter for the finished stickers: [x, y, size, delay] in card units
const GLITTER: Array<[number, number, number, number]> = [
  [22, 24, 3.2, 0],
  [96, 20, 2.6, 0.5],
  [16, 66, 2.2, 1.1],
  [100, 58, 3.4, 0.3],
  [58, 16, 2.4, 1.4],
  [34, 92, 2.8, 0.8],
  [88, 92, 2.2, 1.7],
  [48, 50, 2, 1.0],
  [74, 34, 2.6, 0.2],
  [64, 78, 2.4, 1.3],
];

/** A four-pointed star that grows and shrinks, on its own timing */
function Glint({ x, y, size, delay, still }: { x: number; y: number; size: number; delay: number; still: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M0 -3 C.3 -.8 .8 -.3 3 0 C.8 .3 .3 .8 0 3 C-.3 .8 -.8 .3 -3 0 C-.8 -.3 -.3 -.8 0 -3Z"
        fill="#FFF7C2"
        stroke="#F2AE00"
        strokeWidth=".35"
        transform={`scale(${still ? size / 2 : 0})`}
      >
        {!still && (
          <animateTransform attributeName="transform" type="scale" values={`0;${size};0`} dur="2.2s" begin={`${delay}s`} repeatCount="indefinite" />
        )}
      </path>
    </g>
  );
}

/**
 * One region as a sticker. In progress: the region fills with cola from the bottom, with a moving wave and rising
 * bubbles. Not started: a see-through card with a big question mark. Complete (gold) or complete-with-something-new
 * (silver): metallic colours, a dot per restaurant, a wide "COMPLETATA" / "1 NUOVO" stamp and a passing shine.
 */
export function RegionSticker({ summary, tier, completedAt }: { summary: RegionSummary; tier: RegionTier; /** when the region was completed (ms), shown on gold and silver */ completedAt?: number }) {
  const uid = useId().replace(/:/g, '');
  const shape = REGION_SHAPES[summary.region];
  const still = prefersReducedMotion();
  const st = CARD[tier];
  const empty = tier === 'empty';
  const shiny = tier === 'gold' || tier === 'silver';
  const pct = summary.total > 0 ? Math.max(summary.visited > 0 ? 1 : 0, Math.round((summary.visited / summary.total) * 100)) : 0;

  const scale = shape ? 72 / Math.max(shape.width, shape.height) : 1;
  const width = shape ? shape.width * scale : 0;
  const height = shape ? shape.height * scale : 0;

  // Liquid level in shape units: never invisible once you have started, never full before you finish
  const level = shape ? shape.height * (1 - Math.min(0.96, Math.max(0.06, summary.visited / Math.max(1, summary.total)))) : 0;

  const dots = useMemo(() => {
    if (!shape || !shiny) return [];
    const n = Math.min(summary.total, MAX_DOTS);
    return pointsInside(shape.path, shape.width, shape.height, n, summary.region);
  }, [shape, shiny, summary.total, summary.region]);

  const bubbles = useMemo(() => {
    if (!shape || tier !== 'progress') return [];
    const random = seededRandom(`${summary.region}-b`);
    const points = pointsInside(shape.path, shape.width, shape.height, 12, `${summary.region}-bub`, level);
    return points.map(([x, y]) => ({ x, y, r: 0.4 + random() * 0.7, dur: 2.6 + random() * 2.6, delay: -random() * 3 }));
  }, [shape, tier, summary.region, level]);

  const lines = splitName(empty ? '???' : summary.region.toUpperCase());
  const two = lines.length === 2;
  const nameSize = two ? (lines.some(l => l.length > 10) ? 8.8 : 9.6) : 11.5;
  // Room for a name before the percentage starts; a longer line is squeezed to fit
  const NAME_ROOM = 58;
  const pctColor = empty ? '#6A5D52' : tier === 'progress' ? RED : tier === 'gold' ? '#B87F00' : '#5F6F7D';
  const period = shape ? shape.width / 2.5 : 10;
  const amp = shape ? Math.max(0.8, shape.height * 0.018) : 1;

  const stampInk = tier === 'gold' ? RED : '#5F6F7D';
  const stampText = tier === 'gold' ? 'COMPLETATA' : '1 NUOVO';

  return (
    <div className="relative overflow-hidden rounded-[14px]">
      <svg viewBox="0 0 120 150" width="100%" className="block" role="img" aria-label={`${summary.region}: ${summary.visited} su ${summary.total}`}>
        <defs>
          <linearGradient id={`gold${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFE27A" />
            <stop offset=".5" stopColor="#FFC72C" />
            <stop offset="1" stopColor="#F2AE00" />
          </linearGradient>
          <linearGradient id={`silver${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F4F6F8" />
            <stop offset=".5" stopColor="#D5DBE0" />
            <stop offset="1" stopColor="#B3BCC4" />
          </linearGradient>
          <linearGradient id={`cola${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7A3418" />
            <stop offset=".55" stopColor="#4A1F0E" />
            <stop offset="1" stopColor="#24100A" />
          </linearGradient>
          {shape && (
            <clipPath id={`clip${uid}`}>
              <path d={shape.path} />
            </clipPath>
          )}
        </defs>

        <g opacity={empty ? 0.5 : 1}>
          <rect
            x="3"
            y="3"
            width="114"
            height="144"
            rx="11"
            fill={st.card}
            stroke={st.frame}
            strokeWidth={st.frameW}
            strokeDasharray={empty ? '6 4' : undefined}
          />
          {shiny && (
            <rect x="7.5" y="7.5" width="105" height="135" rx="8" fill="none" stroke={tier === 'gold' ? '#FFD75E' : '#C7CED5'} strokeWidth="1.4" />
          )}
          <rect x="11" y="11" width="98" height="92" rx="6" fill={st.panel} stroke={empty ? st.frame : INK} strokeWidth="1.4" />

          {shape && (
            <g transform={`translate(${60 - width / 2} ${57 - height / 2}) scale(${scale})`}>
              <path d={shape.path} transform={`translate(${1 / scale} ${1.6 / scale})`} fill="rgba(59,42,34,.22)" />
              <path
                d={shape.path}
                fill={tier === 'gold' ? `url(#gold${uid})` : tier === 'silver' ? `url(#silver${uid})` : st.land}
              />
              {tier === 'progress' && (
                <g clipPath={`url(#clip${uid})`}>
                  <g>
                    {!still && (
                      <animateTransform attributeName="transform" type="translate" from="0 0" to={`${-period} 0`} dur="2.8s" repeatCount="indefinite" />
                    )}
                    <path d={wavePath(-period, level, period, Math.ceil(shape.width / period) + 3, amp, shape.height + 6)} fill={`url(#cola${uid})`} />
                    <path d={waveLine(-period, level, period, Math.ceil(shape.width / period) + 3, amp)} fill="none" stroke="#F1D9B5" strokeWidth={1.6 / scale} strokeLinecap="round" />
                  </g>
                  {bubbles.map((b, i) => (
                    <circle key={i} cx={b.x} cy={b.y} r={b.r / scale} fill="#fff" fillOpacity=".75">
                      {!still && (
                        <animate attributeName="cy" from={b.y} to={Math.max(level + 1, b.y - shape.height * 0.35)} dur={`${b.dur}s`} begin={`${b.delay}s`} repeatCount="indefinite" />
                      )}
                    </circle>
                  ))}
                </g>
              )}
              <path d={shape.path} fill="none" stroke={INK} strokeWidth={1.7 / scale} strokeLinejoin="round" />
              {dots.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={(1.9 * 1.4) / scale} fill="#DA291C" stroke="#fff" strokeWidth={(0.6 * 1.4) / scale} />
              ))}
            </g>
          )}

          {empty && (
            <text x="60" y="74" textAnchor="middle" fontFamily="Fredoka, system-ui" fontWeight="700" fontSize="50" fill="#fff" stroke={INK} strokeWidth="1.8" paintOrder="stroke">
              ?
            </text>
          )}

          {shiny && completedAt && (
            <text x="105" y="98.5" textAnchor="end" fontFamily="system-ui" fontWeight="700" fontSize="6.6" fill={tier === 'gold' ? '#8A5A00' : '#5F6F7D'}>
              {new Date(completedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
            </text>
          )}

          {lines.map((line, i) => (
            <text
              key={i}
              x="12"
              y={two ? 117 + i * 10 : 123}
              fontFamily="Fredoka, system-ui"
              fontWeight="700"
              fontSize={nameSize}
              fill={INK}
              textLength={line.length * nameSize * 0.6 > NAME_ROOM ? NAME_ROOM : undefined}
              lengthAdjust="spacingAndGlyphs"
            >
              {line}
            </text>
          ))}
          <text x="12" y={two ? 139 : 136} fontFamily="system-ui" fontWeight="700" fontSize="7.8" fill={empty ? '#6A5D52' : RED}>
            {empty ? `${summary.total} ${summary.total === 1 ? 'ristorante' : 'ristoranti'}` : `${summary.visited} su ${summary.total} visitati`}
          </text>
          <text x="109" y="134" textAnchor="end" fontFamily="Fredoka, system-ui" fontWeight="700" fontSize="15" fill={pctColor}>
            {pct}%
          </text>
        </g>

        {shiny && GLITTER.slice(0, tier === 'gold' ? GLITTER.length : 4).map(([x, y, size, delay], i) => <Glint key={i} x={x} y={y} size={size} delay={delay} still={still} />)}

        {shiny && (
          <g transform="rotate(-16 60 58)" filter="url(#stamp-ink)" opacity=".92">
            <rect x="14" y="44" width="92" height="28" rx="4.5" fill="#fff" fillOpacity=".38" stroke={stampInk} strokeWidth="2.6" />
            <rect x="18.5" y="48.2" width="83" height="19.6" rx="2.5" fill="none" stroke={stampInk} strokeWidth=".9" />
            <text
              x="60"
              y="62.6"
              textAnchor="middle"
              fontFamily="Fredoka, system-ui"
              fontWeight="700"
              fontSize="12.5"
              fill={stampInk}
              textLength={tier === 'gold' ? 74 : 60}
              lengthAdjust="spacingAndGlyphs"
            >
              {stampText}
            </text>
          </g>
        )}
      </svg>
      {shiny && (
        <>
          <i className={`fig-fx fig-sweep ${tier === 'gold' ? 'fig-sweep-gold' : ''}`} />
          <i className="fig-fx fig-spark" style={{ top: '12%', left: '12%' }} />
          <i className="fig-fx fig-spark" style={{ top: '52%', right: '10%', animationDelay: '0.8s' }} />
          {tier === 'gold' && <i className="fig-fx fig-spark" style={{ top: '20%', right: '22%', animationDelay: '1.5s' }} />}
        </>
      )}
    </div>
  );
}
