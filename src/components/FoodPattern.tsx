import { useId, useMemo } from 'react';
import type { FoodIconName } from '@/utils/foodTheme';

// Lattice of icons: the columns are shifted up and down alternately, the whole thing is tilted and slides sideways.
const ICON = 34;
const COLS = 6;
const COL_PITCH = 52;
const ROW_PITCH = 62;
const TILE_W = COLS * COL_PITCH;
const TILE_H = 2 * ROW_PITCH;
const ROWS_TILT = -10;
const SLIDE_SECONDS = 28;
const ORDER: FoodIconName[] = ['burger', 'fries', 'cup', 'happy', 'toast', 'nuggets', 'mcflurry', 'wrap', 'wings', 'filet', 'basket', 'bigmac'];

interface Placed {
  key: string;
  name: FoodIconName;
  x: number;
  y: number;
}

/** Icons of one tile. One that would cross the bottom edge is drawn again above the top edge, so the repeat never cuts it. */
function placeIcons(): Placed[] {
  const placed: Placed[] = [];
  let k = 0;
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < 2; r++) {
      const name = ORDER[(k++ * 5) % ORDER.length];
      const x = c * COL_PITCH + (COL_PITCH - ICON) / 2;
      const y = r * ROW_PITCH + (c % 2) * (ROW_PITCH / 2) + 8;
      placed.push({ key: `${c}-${r}`, name, x, y });
      if (y + ICON > TILE_H) placed.push({ key: `${c}-${r}-wrap`, name, x, y: y - TILE_H });
    }
  }
  return placed;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Background of food icons for the big cards: rows tilted by 10°, columns staggered both ways, sliding slowly
 * sideways. Sits behind the content and ignores taps; stands still if the phone asks for less motion.
 */
export function FoodPattern({ opacity = 0.22 }: { opacity?: number }) {
  const id = useId().replace(/:/g, '');
  const icons = useMemo(placeIcons, []);
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
