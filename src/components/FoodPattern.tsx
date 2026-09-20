import { useId, useMemo } from 'react';
import { ICON, TILE_H, TILE_W, patternIcons } from '@/utils/patternLayout';

const ROWS_TILT = -10;
/** About 11 pixels per second, whatever the width of the tile */
const SLIDE_SECONDS = Math.round(TILE_W / 11);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Background of food icons for the big cards: rows tilted by 10°, columns staggered both ways, sliding slowly
 * sideways. Sits behind the content and ignores taps; stands still if the phone asks for less motion.
 */
export function FoodPattern({ opacity = 0.22 }: { opacity?: number }) {
  const id = useId().replace(/:/g, '');
  const icons = useMemo(() => patternIcons(), []);
  const still = prefersReducedMotion();
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      {/* Larger than the card and rotated around its centre, so the tilted rows still cover every corner */}
      <svg
        className="food-ico absolute"
        style={{ left: '-25%', top: '-50%', width: '150%', height: '200%', transform: `rotate(${ROWS_TILT}deg)` }}
      >
        <defs>
          <pattern id={id} width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
            {icons.map(p => (
              <use key={p.key} href={`#food-${p.name}`} x={p.x} y={p.y} width={ICON} height={ICON} />
            ))}
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
