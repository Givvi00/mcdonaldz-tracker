import { useEffect, useMemo } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { FOOD_EMOJI } from '@/utils/foodTheme';

const STREAMER_COLORS = ['#DA291C', '#FFC72C', '#F2AE00', '#7B3F1D', '#DA291C'];
const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];
const between = (min: number, max: number) => min + Math.random() * (max - min);

// A visit: a light shower. A level up or an achievement: fries pop up from the bottom, burst into food and
// streamers, and a thicker, longer shower falls at the same time.
const SMALL = { rain: 14, time: 3600 };
const BIG = { rain: 60, burstFood: 26, burstStreamers: 34, time: 7500, burstDelay: 0.75 };

/** A shower of burgers, fries and drinks falling down the screen, with a burst of fries for the big moments. */
export function FoodRain() {
  const celebration = useMcdonaldStore(state => state.celebration);
  const clearCelebration = useMcdonaldStore(state => state.clearCelebration);

  const shower = useMemo(() => {
    if (!celebration) return { rain: [], burst: [] };
    const big = celebration.big;
    const rain = Array.from({ length: big ? BIG.rain : SMALL.rain }, (_, i) => ({
      key: i,
      emoji: pick(FOOD_EMOJI),
      left: between(0, 100),
      size: between(20, 38),
      delay: between(0, big ? 2.4 : 0.7),
      duration: big ? between(2, 3.8) : between(1.7, 2.8),
      drift: Math.round(between(-60, 60)),
      spin: Math.round(between(-360, 360)),
    }));
    if (!big) return { rain, burst: [] };

    // The burst goes out from where the fries stop: mostly upwards, then everything falls with gravity
    const burst = Array.from({ length: BIG.burstFood + BIG.burstStreamers }, (_, i) => {
      const angle = between(-Math.PI * 0.95, -Math.PI * 0.05);
      const distance = between(110, 260);
      const streamer = i >= BIG.burstFood;
      return {
        key: i,
        streamer,
        emoji: pick(FOOD_EMOJI),
        color: pick(STREAMER_COLORS),
        size: between(20, 34),
        length: Math.round(between(18, 40)),
        dx: Math.round(Math.cos(angle) * distance),
        dy: Math.round(Math.sin(angle) * distance),
        delay: BIG.burstDelay + between(0, 0.15),
        duration: between(2.2, 3.4),
        spin: Math.round(between(-540, 540)),
      };
    });
    return { rain, burst };
  }, [celebration]);

  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(clearCelebration, celebration.big ? BIG.time : SMALL.time);
    return () => clearTimeout(timer);
  }, [celebration, clearCelebration]);

  if (!celebration) return null;

  return (
    <div className="food-rain fixed inset-0 z-[2500] overflow-hidden pointer-events-none" aria-hidden="true">
      {celebration.big && (
        <span
          key={`${celebration.id}-pop`}
          className="absolute text-[88px] leading-none drop-shadow-lg"
          style={{ left: '50%', top: '58%', marginLeft: -44, animation: `food-pop ${BIG.burstDelay + 0.1}s ease-out both` }}
        >
          🍟
        </span>
      )}

      {shower.burst.map(p => (
        <span
          key={`${celebration.id}-b${p.key}`}
          className="absolute"
          style={
            {
              left: '50%',
              top: '58%',
              fontSize: `${p.size}px`,
              lineHeight: 1,
              animation: `food-burst ${p.duration}s cubic-bezier(0.2, 0.7, 0.3, 1) ${p.delay}s both`,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--spin': `${p.spin}deg`,
              ...(p.streamer ? { width: 6, height: p.length, borderRadius: 3, background: p.color } : {}),
            } as React.CSSProperties
          }
        >
          {p.streamer ? null : p.emoji}
        </span>
      ))}

      {shower.rain.map(p => (
        <span
          key={`${celebration.id}-r${p.key}`}
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
