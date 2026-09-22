import { useId, useMemo } from 'react';
import { ICON, TILE_H, TILE_W, patternIcons } from '@/utils/patternLayout';

const ROWS_TILT = -10;
/** About 11 pixels per second, whatever the width of the tile */
const SLIDE_SECONDS = Math.round(TILE_W / 11);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// The drawing is anchored to the card's top-left corner, in pixels, so every card (whatever its height) shows the same
// icons in the same places: moving from the Home card to the Stats one, the pattern carries on instead of jumping.
// The SVG is much larger than any card and is rotated around that corner, so the tilted rows cover the whole card.
const ANCHOR_X = 200;
const ANCHOR_Y = 300;
const CANVAS_W = 2200;
const CANVAS_H = 1500;

/**
 * Background of food icons for the big cards: rows tilted by 10°, columns staggered both ways, sliding slowly
 * sideways. Sits behind the content and ignores taps; stands still if the phone asks for less motion. The slide
 * follows the clock, not the moment the card appeared, so it is at the same point on every page.
 */
export function FoodPattern({ opacity = 0.22 }: { opacity?: number }) {
  const id = useId().replace(/:/g, '');
  const icons = useMemo(() => patternIcons(), []);
  const still = prefersReducedMotion();
  // Start the slide as if it had been running since the epoch: every card mounted now is at the same point of it
  const begin = useMemo(() => -((Date.now() / 1000) % SLIDE_SECONDS), []);
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      <svg
        className="food-ico absolute"
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          left: -ANCHOR_X,
          top: -ANCHOR_Y,
          transform: `rotate(${ROWS_TILT}deg)`,
          transformOrigin: `${ANCHOR_X}px ${ANCHOR_Y}px`,
        }}
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
                begin={`${begin.toFixed(2)}s`}
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
