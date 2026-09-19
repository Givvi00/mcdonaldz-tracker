import { useId } from 'react';

// Two staggered rows, each item slightly tilted; the tile repeats seamlessly
const TILE_W = 225;
const TILE_H = 100;
const ITEMS: Array<{ emoji: string; x: number; y: number; tilt: number }> = [
  { emoji: '🍔', x: 25, y: 25, tilt: -14 },
  { emoji: '🍟', x: 100, y: 25, tilt: 10 },
  { emoji: '🥤', x: 175, y: 25, tilt: -8 },
  { emoji: '🍗', x: 62, y: 75, tilt: 12 },
  { emoji: '🍦', x: 137, y: 75, tilt: -12 },
  { emoji: '🥧', x: 212, y: 75, tilt: 9 },
];

/** Background of staggered food emoji for the big cards. Sits behind the content and ignores taps. */
export function FoodPattern({ opacity = 0.14 }: { opacity?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity }}>
      <defs>
        <pattern id={id} width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
          <g fontSize="24" textAnchor="middle" dominantBaseline="central">
            {ITEMS.map(item => (
              <text key={item.emoji} x={item.x} y={item.y} transform={`rotate(${item.tilt} ${item.x} ${item.y})`}>
                {item.emoji}
              </text>
            ))}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
