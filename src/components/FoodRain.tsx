import { useEffect, useMemo } from 'react';
import { FoodIcon } from '@/components/FoodIcon';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { FOOD_ICONS } from '@/utils/foodTheme';

const SPARKLE_COLORS = ['#FFC72C', '#FFFFFF', '#FFE58A', '#FFFFFF'];
const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];
const between = (min: number, max: number) => min + Math.random() * (max - min);

// A visit: a light shower of food icons.
// A level up or an achievement: no shower, fireworks made of fries and little stars. A box of fries rises from the
// bottom, fries shoot out of it, and three bursts go off one after the other.
const SMALL = { rain: 14, time: 3600 };
const BIG = {
  sticks: 8,
  launchAt: 0.55, // seconds: the fries leave the box
  friesPerBurst: 14,
  starsPerBurst: 12,
  time: 8600,
  boxMs: 3800,
};
const BURSTS = [
  { left: 50, top: 40, at: 1.3 },
  { left: 24, top: 30, at: 2.1 },
  { left: 76, top: 34, at: 2.8 },
  { left: 36, top: 22, at: 3.4 },
  { left: 64, top: 26, at: 3.9 },
  { left: 14, top: 44, at: 4.4 },
  { left: 86, top: 46, at: 4.9 },
  { left: 50, top: 28, at: 5.5 },
];
const BOX_SIZE = 120;
const BOX_BOTTOM_VH = 12;

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

    if (!celebration.big) {
      const rain = Array.from({ length: SMALL.rain }, (_, i) => ({
        key: i,
        name: pick(FOOD_ICONS),
        left: between(0, 100),
        size: between(26, 44),
        delay: between(0, 0.7),
        duration: between(1.7, 2.8),
        drift: Math.round(between(-60, 60)),
        spin: Math.round(between(-360, 360)),
      }));
      return { rain, sticks: [], fries: [], stars: [] };
    }

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

    // Each burst throws fries outwards (pointing away from the centre) and little stars
    const fries = BURSTS.flatMap((b, bi) =>
      Array.from({ length: BIG.friesPerBurst }, (_, i) => {
        const angle = (i / BIG.friesPerBurst) * Math.PI * 2 + between(-0.12, 0.12);
        const distance = between(90, 150);
        return {
          key: `${bi}-${i}`,
          left: b.left,
          top: b.top,
          angleDeg: Math.round((angle * 180) / Math.PI),
          dx: Math.round(Math.cos(angle) * distance),
          dy: Math.round(Math.sin(angle) * distance),
          delay: b.at + between(0, 0.06),
          duration: between(1.3, 1.8),
        };
      }),
    );
    const stars = BURSTS.flatMap((b, bi) =>
      Array.from({ length: BIG.starsPerBurst }, (_, i) => {
        const angle = (i / BIG.starsPerBurst) * Math.PI * 2 + between(-0.2, 0.2);
        const distance = between(60, 175);
        return {
          key: `${bi}-${i}`,
          left: b.left,
          top: b.top,
          size: between(13, 24),
          color: pick(SPARKLE_COLORS),
          dx: Math.round(Math.cos(angle) * distance),
          dy: Math.round(Math.sin(angle) * distance),
          delay: b.at + between(0, 0.1),
          duration: between(1.2, 1.9),
        };
      }),
    );
    return { rain: [], sticks, fries, stars };
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
            animation: `food-box ${BIG.boxMs}ms ease-out both`,
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

      {show.fries.map(p => (
        <span
          key={`${id}-f${p.key}`}
          className="absolute"
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}vh`,
              lineHeight: 0,
              animation: `food-firework ${p.duration}s cubic-bezier(0.2, 0.8, 0.3, 1) ${p.delay}s both`,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
            } as React.CSSProperties
          }
        >
          <span
            style={{
              display: 'block',
              width: 8,
              height: 28,
              marginLeft: -4,
              marginTop: -14,
              borderRadius: 4,
              background: '#FFC72C',
              border: '2px solid #3B2A22',
              transform: `rotate(${p.angleDeg + 90}deg)`,
            }}
          />
        </span>
      ))}

      {show.stars.map(p => (
        <span
          key={`${id}-k${p.key}`}
          className="absolute"
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}vh`,
              lineHeight: 0,
              animation: `food-firework ${p.duration}s cubic-bezier(0.2, 0.8, 0.3, 1) ${p.delay}s both`,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
            } as React.CSSProperties
          }
        >
          <span style={{ display: 'block', marginLeft: -p.size / 2, marginTop: -p.size / 2 }}>
            <Sparkle size={p.size} color={p.color} />
          </span>
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
