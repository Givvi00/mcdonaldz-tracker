import { useEffect, useMemo } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { FOOD_EMOJI } from '@/utils/foodTheme';

const SMALL = 14;
const BIG = 34;
const SHOW_FOR_MS = 3600;

/** A shower of burgers, fries and drinks falling down the screen: for a new visit, more for a level up or an achievement. */
export function FoodRain() {
  const celebration = useMcdonaldStore(state => state.celebration);
  const clearCelebration = useMcdonaldStore(state => state.clearCelebration);

  const pieces = useMemo(() => {
    if (!celebration) return [];
    const count = celebration.big ? BIG : SMALL;
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      emoji: FOOD_EMOJI[Math.floor(Math.random() * FOOD_EMOJI.length)],
      left: Math.random() * 100,
      size: 20 + Math.random() * 18,
      delay: Math.random() * 0.7,
      duration: 1.7 + Math.random() * 1.1,
      drift: Math.round((Math.random() - 0.5) * 120),
      spin: Math.round((Math.random() - 0.5) * 720),
    }));
  }, [celebration]);

  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(clearCelebration, SHOW_FOR_MS);
    return () => clearTimeout(timer);
  }, [celebration, clearCelebration]);

  if (!celebration) return null;

  return (
    <div className="food-rain fixed inset-0 z-[2500] overflow-hidden pointer-events-none" aria-hidden="true">
      {pieces.map(p => (
        <span
          key={`${celebration.id}-${p.key}`}
          className="absolute top-0"
          style={
            {
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animation: `food-fall ${p.duration}s ease-in ${p.delay}s both`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            } as React.CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
