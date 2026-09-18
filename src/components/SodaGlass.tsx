import type { CSSProperties } from 'react';

interface Props {
  region: string;
  percentage: number;
}

const BUBBLES = [
  { left: 20, delay: 0, duration: 2.6, size: 2.2 },
  { left: 42, delay: 0.7, duration: 3.1, size: 2.8 },
  { left: 62, delay: 1.4, duration: 2.7, size: 2 },
  { left: 78, delay: 0.3, duration: 3.4, size: 3 },
  { left: 32, delay: 1.9, duration: 2.3, size: 2 },
];

const WIDTH = 60;
const HEIGHT = 88;
const CUP_TOP = 6;
const CUP_BOTTOM = 86;
const STRAW_SPACE = 16;
// Tapered cup: wider at the rim, narrower at the base, rounded bottom corners
const CUP_PATH = 'M5 6 L55 6 L49 82 Q48.5 86 44 86 L16 86 Q11.5 86 11 82 Z';

export function SodaGlass({ region, percentage }: Props) {
  const fillPct = Math.max(0, Math.min(100, Math.round(percentage)));
  const safeName = region.replace(/[^a-zA-Z0-9]/g, '');
  const clipId = `soda-glass-clip-${safeName}`;
  const waveClipId = `soda-glass-wave-clip-${safeName}`;
  const liquidTop = CUP_TOP + (CUP_BOTTOM - CUP_TOP) * (1 - fillPct / 100);
  const waveBand = WIDTH * 0.14;

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
          <clipPath id={waveClipId}>
            <rect x={0} y={liquidTop - waveBand / 2} width={WIDTH} height={waveBand} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <path d={CUP_PATH} className="fill-gray-100 dark:fill-gray-800" />

          {fillPct > 0 && (
            <>
              <rect x={0} y={liquidTop} width={WIDTH} height={CUP_BOTTOM - liquidTop} className="fill-amber-900" />
              <g clipPath={`url(#${waveClipId})`}>
                <ellipse
                  cx={WIDTH / 2}
                  cy={liquidTop}
                  rx={WIDTH * 0.85}
                  ry={waveBand * 1.5}
                  className="fill-amber-700"
                  style={{
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    animation: 'soda-wave-spin 5s linear infinite',
                  }}
                />
              </g>
              {BUBBLES.map((b, i) => (
                <circle
                  key={i}
                  cx={(b.left / 100) * WIDTH}
                  cy={CUP_BOTTOM - 2}
                  r={b.size}
                  className="fill-amber-200"
                  fillOpacity={0.8}
                  style={
                    {
                      '--rise': `${Math.max(4, CUP_BOTTOM - liquidTop - 4)}px`,
                      animation: `soda-bubble-rise-svg ${b.duration}s ease-in ${b.delay}s infinite`,
                    } as CSSProperties
                  }
                />
              ))}
            </>
          )}
        </g>

        <path d={CUP_PATH} fill="none" className="stroke-white/60 dark:stroke-white/40" strokeWidth={1.4} />

        {/* Percentage overlay */}
        <text
          x={WIDTH / 2}
          y={(CUP_TOP + CUP_BOTTOM) / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-display"
          fontSize={15}
          fontWeight={700}
          fill="white"
          stroke="rgba(0,0,0,0.55)"
          strokeWidth={3}
          paintOrder="stroke"
          strokeLinejoin="round"
        >
          {fillPct}%
        </text>
      </svg>
    </div>
  );
}
