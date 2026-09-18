import type { CSSProperties } from 'react';

interface Props {
  region: string;
  percentage: number;
}

const WIDTH = 60;
const HEIGHT = 88;
const CUP_TOP = 6;
const CUP_BOTTOM = 86;
const STRAW_SPACE = 16;
// Tapered cup: wider at the rim, narrower at the base, rounded bottom corners
const CUP_PATH = 'M5 6 L55 6 L49 82 Q48.5 86 44 86 L16 86 Q11.5 86 11 82 Z';

// Liquid surface: a sine wave several periods wide, slid sideways by exactly one period so the loop is seamless
const WAVE_LENGTH = 40;
const WAVE_PERIODS = 3;
const WAVE_AMPLITUDE = 2.2;

// Bubbles stay inside the cup interior at any height (the base is the narrowest part: x 11..49)
const BUBBLE_MIN_X = 15;
const BUBBLE_MAX_X = 45;
const MIN_LIQUID_FOR_BUBBLES = 6;

const frac = (n: number) => n - Math.floor(n);

function wavePath(closeToY: number | null): string {
  const half = WAVE_LENGTH / 2;
  const ctrl = WAVE_AMPLITUDE * 2;
  let d = `M0 0 q ${WAVE_LENGTH / 4} ${-ctrl} ${half} 0`;
  for (let i = 1; i < WAVE_PERIODS * 2; i++) d += ` t ${half} 0`;
  if (closeToY !== null) d += ` L ${WAVE_LENGTH * WAVE_PERIODS} ${closeToY} L 0 ${closeToY} Z`;
  return d;
}

// Deterministic (not Math.random) so re-renders do not restart the animation
function makeBubbles(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const duration = 2.4 + frac(i * 0.41) * 2.6;
    return {
      x: BUBBLE_MIN_X + frac(i * 0.618 + 0.13) * (BUBBLE_MAX_X - BUBBLE_MIN_X),
      r: 0.55 + frac(i * 0.37 + 0.2) * 0.85,
      duration,
      delay: -frac(i * 0.29 + 0.11) * duration,
      sway: (frac(i * 0.53) - 0.5) * 4,
    };
  });
}

export function SodaGlass({ region, percentage }: Props) {
  const fillPct = Math.max(0, Math.min(100, Math.round(percentage)));
  const safeName = region.replace(/[^a-zA-Z0-9]/g, '');
  const clipId = `soda-glass-clip-${safeName}`;
  const liquidTop = CUP_TOP + (CUP_BOTTOM - CUP_TOP) * (1 - fillPct / 100);
  const liquidHeight = CUP_BOTTOM - liquidTop;

  // More liquid, more fizz; bubbles only travel through the liquid, from the base up to the surface
  const bubbleCount = liquidHeight < MIN_LIQUID_FOR_BUBBLES ? 0 : Math.round(6 + liquidHeight * 0.45);
  const bubbles = makeBubbles(bubbleCount);
  const rise = Math.max(2, liquidHeight - 4);
  const bodyBottom = liquidHeight + WAVE_AMPLITUDE + 4;

  return (
    <div className="relative" style={{ width: WIDTH, height: HEIGHT + STRAW_SPACE }}>
      {/* Straw */}
      <div
        className="absolute bg-[repeating-linear-gradient(45deg,#DA291C_0px,#DA291C_4px,white_4px,white_8px)] rounded-sm shadow-sm"
        style={{
          width: 5,
          height: STRAW_SPACE + 30,
          top: 0,
          left: WIDTH * 0.55,
          transform: 'rotate(14deg)',
          transformOrigin: 'top center',
        }}
      />

      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ position: 'absolute', left: 0, top: STRAW_SPACE, overflow: 'visible' }}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={CUP_PATH} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <path d={CUP_PATH} className="fill-gray-100 dark:fill-gray-800" />

          {fillPct > 0 && (
            <g transform={`translate(0 ${liquidTop})`}>
              {/* Back wave: slightly lighter, slower, opposite direction */}
              <path
                d={wavePath(bodyBottom)}
                className="fill-amber-800"
                fillOpacity={0.85}
                style={
                  {
                    '--wave-w': `${WAVE_LENGTH}px`,
                    animation: 'soda-wave-slide 5.2s linear -1.7s infinite reverse',
                  } as CSSProperties
                }
              />

              {/* Front wave = the liquid itself, same colour as the body, with a soft foam line on the surface */}
              <g
                style={
                  {
                    '--wave-w': `${WAVE_LENGTH}px`,
                    animation: 'soda-wave-slide 3.4s linear infinite',
                  } as CSSProperties
                }
              >
                <path d={wavePath(bodyBottom)} className="fill-amber-900" />
                <path
                  d={wavePath(null)}
                  fill="none"
                  className="stroke-amber-600"
                  strokeOpacity={0.75}
                  strokeWidth={1}
                  strokeLinecap="round"
                />
              </g>

              {/* Fizz: many small bubbles rising from the base to the surface */}
              {bubbles.map((b, i) => (
                <circle
                  key={i}
                  cx={b.x}
                  cy={liquidHeight - 3}
                  r={b.r}
                  className="fill-amber-100"
                  style={
                    {
                      '--rise': `${rise}px`,
                      '--sway': `${b.sway}px`,
                      animation: `soda-bubble-fizz ${b.duration}s ease-in ${b.delay}s infinite`,
                    } as CSSProperties
                  }
                />
              ))}
            </g>
          )}
        </g>

        <path d={CUP_PATH} fill="none" className="stroke-white/60 dark:stroke-white/40" strokeWidth={1.4} />

        {/* Percentage overlay: white on a dark pill so it reads on any liquid level, in light and dark mode */}
        <rect
          x={WIDTH / 2 - 19}
          y={(CUP_TOP + CUP_BOTTOM) / 2 - 10}
          width={38}
          height={20}
          rx={10}
          fill="rgba(35,26,24,0.72)"
        />
        <text
          x={WIDTH / 2}
          y={(CUP_TOP + CUP_BOTTOM) / 2 + 0.5}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-display"
          fontSize={13}
          fontWeight={700}
          fill="white"
        >
          {fillPct}%
        </text>
      </svg>
    </div>
  );
}
