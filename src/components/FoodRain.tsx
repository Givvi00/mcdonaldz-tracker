import { useEffect, useMemo } from 'react';
import { FoodIcon } from '@/components/FoodIcon';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { FOOD_ICONS } from '@/utils/foodTheme';

const STREAMER_COLORS = ['#DA291C', '#FFC72C', '#F2AE00', '#7B3F1D', '#DA291C'];
const SPARKLE_COLORS = ['#FFC72C', '#FFFFFF', '#FFE58A', '#FFFFFF'];
const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];
const between = (min: number, max: number) => min + Math.random() * (max - min);

// A visit: a light shower. A level up or an achievement: a box of fries rises from the bottom, fries shoot out of it
// and burst into food, streamers and sparkles, while a thicker, longer shower falls.
const SMALL = { rain: 14, time: 3600 };
const BIG = {
  rain: 70,
  burstFood: 30,
  burstStreamers: 36,
  burstSparkles: 20,
  ambientSparkles: 22,
  sticks: 8,
  launchAt: 0.55, // seconds: the fries leave the box
  burstAt: 1.3, // seconds: they burst at the top
  time: 10500,
};
const BOX_SIZE = 120;
const BOX_BOTTOM_VH = 12;
const BURST_TOP_VH = 42;

const Sparkle = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 0C12.9 7.5 16.5 11.1 24 12C16.5 12.9 12.9 16.5 12 24C11.1 16.5 7.5 12.9 0 12C7.5 11.1 11.1 7.5 12 0Z"
      fill={color}
      stroke="#F2AE00"
      strokeWidth="1"
      strokeLinejoin="round"
    />
  </svg>
);

export function FoodRain() {
  const celebration = useMcdonaldStore(state => state.celebration);
  const clearCelebration = useMcdonaldStore(state => state.clearCelebration);

  const show = useMemo(() => {
    if (!celebration) return null;
    const big = celebration.big;
    const rain = Array.from({ length: big ? BIG.rain : SMALL.rain }, (_, i) => ({
      key: i,
      name: pick(FOOD_ICONS),
      left: between(0, 100),
      size: between(26, 44),
      delay: big ? between(0.5, 5.2) : between(0, 0.7),
      duration: big ? between(2, 3.8) : between(1.7, 2.8),
      drift: Math.round(between(-60, 60)),
      spin: Math.round(between(-360, 360)),
    }));
    if (!big) return { rain, sticks: [], burst: [], sparkles: [], ambient: [] };

    // Fries leaving the box, fanning out upwards
    const sticks = Array.from({ length: BIG.sticks }, (_, i) => {
      const spread = (i - (BIG.sticks - 1) / 2) / ((BIG.sticks - 1) / 2);
      return {
        key: i,
        dx: Math.round(spread * between(40, 90)),
        dy: -Math.round(between(40, 48)),
        spin: Math.round(spread * between(160, 420)),
        delay: BIG.launchAt + i * 0.03,
      };
    });

    // Burst from the top: food and streamers go out in every direction, then everything falls with gravity
    const burst = Array.from({ length: BIG.burstFood + BIG.burstStreamers }, (_, i) => {
      const angle = between(0, Math.PI * 2);
      const distance = between(90, 240);
      const streamer = i >= BIG.burstFood;
      return {
        key: i,
        streamer,
        name: pick(FOOD_ICONS),
        color: pick(STREAMER_COLORS),
        size: between(26, 42),
        length: Math.round(between(18, 40)),
        dx: Math.round(Math.cos(angle) * distance),
        dy: Math.round(Math.sin(angle) * distance),
        delay: BIG.burstAt + between(0, 0.12),
        duration: between(2.3, 3.6),
        spin: Math.round(between(-540, 540)),
      };
    });

    // Sparkles flying out with the burst, and twinkles scattered around the screen for a few seconds
    const sparkles = Array.from({ length: BIG.burstSparkles }, (_, i) => {
      const angle = between(0, Math.PI * 2);
      const distance = between(60, 190);
      return {
        key: i,
        size: between(12, 26),
        color: pick(SPARKLE_COLORS),
        dx: Math.round(Math.cos(angle) * distance),
        dy: Math.round(Math.sin(angle) * distance),
        delay: BIG.burstAt + between(0, 0.2),
        duration: between(1.1, 1.8),
      };
    });
    const ambient = Array.from({ length: BIG.ambientSparkles }, (_, i) => ({
      key: i,
      size: between(10, 22),
      color: pick(SPARKLE_COLORS),
      left: between(4, 94),
      top: between(6, 78),
      delay: between(BIG.burstAt, 6.5),
      duration: between(0.9, 1.6),
    }));
    return { rain, sticks, burst, sparkles, ambient };
  }, [celebration]);

  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(clearCelebration, celebration.big ? BIG.time : SMALL.time);
    return () => clearTimeout(timer);
  }, [celebration, clearCelebration]);

  if (!celebration || !show) return null;
  const id = celebration.id;

  return (
    <div className="food-rain fixed inset-0 z-[2500] overflow-hidden pointer-events-none" aria-hidden="true">
      {celebration.big && (
        <div
          className="absolute"
          style={{
            left: '50%',
            bottom: `${BOX_BOTTOM_VH}vh`,
            width: BOX_SIZE,
            height: BOX_SIZE,
            marginLeft: -BOX_SIZE / 2,
            animation: `food-box ${BIG.time * 0.4}ms ease-out both`,
          }}
        >
          <FoodIcon name="fries" size={BOX_SIZE} />
          {show.sticks.map(p => (
            <span
              key={`${id}-s${p.key}`}
              className="absolute"
              style={
                {
                  left: '50%',
                  top: '46%',
                  marginLeft: -5,
                  width: 10,
                  height: 36,
                  borderRadius: 4,
                  background: '#FFC72C',
                  border: '2px solid #3B2A22',
                  animation: `food-launch 0.8s cubic-bezier(0.15, 0.85, 0.3, 1) ${p.delay}s both`,
                  '--dx': `${p.dx}px`,
                  '--dy': `${p.dy}vh`,
                  '--spin': `${p.spin}deg`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {show.burst.map(p => (
        <span
          key={`${id}-b${p.key}`}
          className="absolute"
          style={
            {
              left: '50%',
              top: `${BURST_TOP_VH}vh`,
              lineHeight: 0,
              animation: `food-burst ${p.duration}s cubic-bezier(0.2, 0.7, 0.3, 1) ${p.delay}s both`,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--spin': `${p.spin}deg`,
              ...(p.streamer ? { width: 6, height: p.length, borderRadius: 3, background: p.color } : {}),
            } as React.CSSProperties
          }
        >
          {p.streamer ? null : <FoodIcon name={p.name} size={p.size} />}
        </span>
      ))}

      {show.sparkles.map(p => (
        <span
          key={`${id}-k${p.key}`}
          className="absolute"
          style={
            {
              left: '50%',
              top: `${BURST_TOP_VH}vh`,
              lineHeight: 0,
              animation: `food-sparkle-out ${p.duration}s ease-out ${p.delay}s both`,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
            } as React.CSSProperties
          }
        >
          <Sparkle size={p.size} color={p.color} />
        </span>
      ))}

      {show.ambient.map(p => (
        <span
          key={`${id}-a${p.key}`}
          className="absolute"
          style={{ left: `${p.left}%`, top: `${p.top}%`, lineHeight: 0, animation: `food-twinkle ${p.duration}s ease-in-out ${p.delay}s 2 both` }}
        >
          <Sparkle size={p.size} color={p.color} />
        </span>
      ))}

      {show.rain.map(p => (
        <span
          key={`${id}-r${p.key}`}
          className="absolute top-0"
          style={
            {
              left: `${p.left}%`,
              lineHeight: 0,
              animation: `food-fall ${p.duration}s ease-in ${p.delay}s both`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            } as React.CSSProperties
          }
        >
          <FoodIcon name={p.name} size={p.size} />
        </span>
      ))}
    </div>
  );
}
