import type { CSSProperties } from 'react';
import { REGION_SHAPES } from '@/data/regionShapes';

interface Props {
  region: string;
  percentage: number;
}

const BUBBLES = [
  { left: 20, delay: 0, duration: 2.6, size: 2.4 },
  { left: 45, delay: 0.7, duration: 3.1, size: 3 },
  { left: 65, delay: 1.4, duration: 2.7, size: 2.2 },
  { left: 80, delay: 0.3, duration: 3.4, size: 3.4 },
  { left: 32, delay: 1.9, duration: 2.3, size: 2.2 },
];

export function SodaRegion({ region, percentage }: Props) {
  const shape = REGION_SHAPES[region];
  if (!shape) return null;

  const { path, width, height } = shape;
  const strawSpace = height * 0.3;
  const fillHeight = Math.max(0, Math.min(100, Math.round(percentage)));
  const safeName = region.replace(/[^a-zA-Z0-9]/g, '');
  const clipId = `soda-region-clip-${safeName}`;
  const waveClipId = `soda-region-wave-clip-${safeName}`;
  const liquidTop = height * (1 - fillHeight / 100);
  const waveBand = width * 0.14;

  return (
    <div className="relative" style={{ width, height: height + strawSpace }}>
      {/* Straw */}
      <div
        className="absolute bg-[repeating-linear-gradient(45deg,#DA291C_0px,#DA291C_4px,white_4px,white_8px)] rounded-sm shadow-sm"
        style={{
          width: Math.max(3, width * 0.09),
          height: strawSpace + height * 0.45,
          top: 0,
          left: width * 0.5,
          transform: 'rotate(14deg)',
          transformOrigin: 'top center',
        }}
      />

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: 'absolute', left: 0, top: strawSpace, overflow: 'visible' }}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>
          <clipPath id={waveClipId}>
            <rect x={0} y={liquidTop - waveBand / 2} width={width} height={waveBand} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <path d={path} className="fill-gray-100 dark:fill-gray-800" />

          {fillHeight > 0 && (
            <>
              <rect x={0} y={liquidTop} width={width} height={height - liquidTop} className="fill-amber-900" />
              <g clipPath={`url(#${waveClipId})`}>
                <ellipse
                  cx={width / 2}
                  cy={liquidTop}
                  rx={width * 0.85}
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
                  cx={(b.left / 100) * width}
                  cy={height - 2}
                  r={b.size}
                  className="fill-amber-200"
                  fillOpacity={0.8}
                  style={
                    {
                      '--rise': `${Math.max(4, height - liquidTop - 4)}px`,
                      animation: `soda-bubble-rise-svg ${b.duration}s ease-in ${b.delay}s infinite`,
                    } as CSSProperties
                  }
                />
              ))}
            </>
          )}
        </g>

        <path d={path} fill="none" className="stroke-white/60 dark:stroke-white/40" strokeWidth={1.2} />
      </svg>
    </div>
  );
}
