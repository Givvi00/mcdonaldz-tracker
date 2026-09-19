import { useId } from 'react';

// Two staggered rows, each item slightly tilted; the tile repeats seamlessly
const TILE_W = 225;
const TILE_H = 100;
const ROWS_TILT = -10;
const SLIDE_SECONDS = 50;
const ITEMS: Array<{ emoji: string; x: number; y: number; tilt: number }> = [
  { emoji: '🍔', x: 25, y: 25, tilt: -14 },
  { emoji: '🍟', x: 100, y: 25, tilt: 10 },
  { emoji: '🥤', x: 175, y: 25, tilt: -8 },
  { emoji: '🍗', x: 62, y: 75, tilt: 12 },
  { emoji: '🍦', x: 137, y: 75, tilt: -12 },
  { emoji: '🥧', x: 212, y: 75, tilt: 9 },
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Background of staggered food emoji for the big cards: the rows are tilted by 10° and slide slowly
 * sideways. Sits behind the content and ignores taps; stands still if the phone asks for less motion.
 */
export function FoodPattern({ opacity = 0.14 }: { opacity?: number }) {
  const id = useId().replace(/:/g, '');
  const still = prefersReducedMotion();
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      {/* Larger than the card and rotated around its centre, so the tilted rows still cover every corner */}
      <svg
        className="absolute"
        style={{ left: '-25%', top: '-50%', width: '150%', height: '200%', transform: `rotate(${ROWS_TILT}deg)` }}
      >
        <defs>
          <pattern id={id} width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
            <g fontSize="24" textAnchor="middle" dominantBaseline="central">
              {ITEMS.map(item => (
                <text key={item.emoji} x={item.x} y={item.y} transform={`rotate(${item.tilt} ${item.x} ${item.y})`}>
                  {item.emoji}
                </text>
              ))}
            </g>
            {!still && (
              <animateTransform
                attributeName="patternTransform"
                type="translate"
                from="0 0"
                to={`${-TILE_W} 0`}
                dur={`${SLIDE_SECONDS}s`}
                repeatCount="indefinite"
              />
            )}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}
