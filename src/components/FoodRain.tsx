import { useEffect, useMemo } from 'react';
import { FoodIcon } from '@/components/FoodIcon';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { FOOD_ICONS, LEVELS } from '@/utils/foodTheme';
import { ACHIEVEMENTS } from '@/services/achievements';
import { STAMP_INK, STAMP_SHAPES } from '@/components/stampArt';
import { Stamp } from '@/components/Stamp';

const SPARKLE_COLORS = ['#FFC72C', '#FFFFFF', '#FFE58A', '#FFFFFF'];
const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];
const between = (min: number, max: number) => min + Math.random() * (max - min);

// A visit: a light shower of food icons.
// A level up or an achievement: no shower, fireworks made of fries and little stars. A box of fries rises from the
// bottom; its fries leave one by one, each towards its own point in the sky where it bursts. The box ends up empty
// and fades away.
const SMALL = { rain: 14, time: 3600 };
const BIG = {
  firstLaunch: 0.8, // seconds
  launchEvery: 0.55,
  flight: 0.9,
  friesPerBurst: 8,
  starsPerBurst: 10,
  time: 8400,
  boxMs: 6000,
};
// Where each fry bursts: horizontal position in % of the width, vertical in % of the height
const BURSTS = [
  { left: 50, top: 32 },
  { left: 20, top: 40 },
  { left: 80, top: 36 },
  { left: 36, top: 22 },
  { left: 66, top: 24 },
  { left: 10, top: 52 },
  { left: 90, top: 54 },
  { left: 50, top: 46 },
];
const STAMP_SHOWN = 3; // stamps drawn at once; more are just counted
const stampTime = (n: number) => 3400 + (Math.min(n, STAMP_SHOWN) - 1) * 900;
const LEVEL_AT = 2.6; // seconds: the level popup appears
const BOX_SIZE = 120;
const BOX_BOTTOM_VH = 12;
const FRIES_IN_BOX = BURSTS.length;
const launchAt = (i: number) => BIG.firstLaunch + i * BIG.launchEvery;
const burstAt = (i: number) => launchAt(i) + BIG.flight;

/** Position of fry i inside the box, in box units (48) and the px it maps to at BOX_SIZE */
const fryGeom = (i: number) => {
  const t = i / (FRIES_IN_BOX - 1);
  const k = BOX_SIZE / 48;
  const x = 8 + t * 29;
  const h = i % 2 ? 24 : 21;
  const y = i % 2 ? 5 : 8;
  return { x, y, h, rot: Math.round(-15 + t * 30), offX: (x + 2.3 - 24) * k, top: y * k, height: h * k };
};

/** The box of fries drawn here (not from the sprite) so each fry can leave it on its own. */
function FriesBox({ size }: { size: number }) {
  return (
    <svg className="food-ico" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <g fill="#FFC72C">
        {Array.from({ length: FRIES_IN_BOX }, (_, i) => {
          const { x, y, h, rot } = fryGeom(i);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="4.6"
              height={h}
              rx="1.6"
              transform={`rotate(${rot} ${x + 2.3} 20)`}
              style={{ animation: `food-fry-out 0.01s linear ${launchAt(i)}s both` }}
            />
          );
        })}
      </g>
      <path d="M8 24 C14 26 34 26 40 24 L37 44 H11 Z" fill="#DA291C" />
      <g clipPath="url(#food-clip-fries)">
        <rect x="4" y="33" width="40" height="5" fill="#FFC72C" stroke="none" />
      </g>
    </svg>
  );
}

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
    if (!celebration || celebration.kind === 'stamp') return null;

    if (celebration.kind === 'visit') {
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
      return { rain, rockets: [], fries: [], stars: [] };
    }

    // One fry per burst leaves the box, pointing at where it will burst (rough phone proportions)
    const rockets = BURSTS.map((b, i) => {
      const dx = (b.left - 50) * 4.3;
      const dy = b.top * 9 - 792 + 60;
      const g = fryGeom(i);
      return { key: i, left: b.left, top: b.top, rot: Math.round((Math.atan2(dx, -dy) * 180) / Math.PI), rot0: g.rot, offX: g.offX, top0: g.top, height: g.height, delay: launchAt(i) };
    });

    // Each burst throws little fries outwards (pointing away from the centre) and little stars
    const fries = BURSTS.flatMap((b, bi) =>
      Array.from({ length: BIG.friesPerBurst }, (_, i) => {
        const angle = (i / BIG.friesPerBurst) * Math.PI * 2 + between(-0.12, 0.12);
        const distance = between(80, 140);
        return {
          key: `${bi}-${i}`,
          left: b.left,
          top: b.top,
          angleDeg: Math.round((angle * 180) / Math.PI),
          dx: Math.round(Math.cos(angle) * distance),
          dy: Math.round(Math.sin(angle) * distance),
          delay: burstAt(bi) + between(0, 0.05),
          duration: between(1.3, 1.8),
        };
      }),
    );
    const stars = BURSTS.flatMap((b, bi) =>
      Array.from({ length: BIG.starsPerBurst }, (_, i) => {
        const angle = (i / BIG.starsPerBurst) * Math.PI * 2 + between(-0.2, 0.2);
        const distance = between(55, 165);
        return {
          key: `${bi}-${i}`,
          left: b.left,
          top: b.top,
          size: between(13, 24),
          color: pick(SPARKLE_COLORS),
          dx: Math.round(Math.cos(angle) * distance),
          dy: Math.round(Math.sin(angle) * distance),
          delay: burstAt(bi) + between(0, 0.1),
          duration: between(1.2, 1.9),
        };
      }),
    );
    return { rain: [], rockets, fries, stars };
  }, [celebration]);

  useEffect(() => {
    if (!celebration) return;
    const time =
      celebration.kind === 'visit' ? SMALL.time : celebration.kind === 'stamp' ? stampTime(celebration.stamps.length) : BIG.time;
    const timer = setTimeout(clearCelebration, time);
    return () => clearTimeout(timer);
  }, [celebration, clearCelebration]);

  if (celebration?.kind === 'stamp') return <StampShow key={celebration.id} stamps={celebration.stamps} />;
  if (!celebration || !show) return null;
  const id = celebration.id;
  const big = celebration.kind === 'level' || celebration.kind === 'region';
  const level = celebration.kind === 'level' ? LEVELS[celebration.level - 1] : null;
  const visited = useMcdonaldStore.getState().getVisitedCount();

  return (
    <div className="food-rain fixed inset-0 z-[2500] overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Under the box, so a fry comes out from behind its front */}
      {show.rockets.map(p => (
        <span
          key={`${id}-s${p.key}`}
          className="absolute"
          style={
            {
              left: `calc(50% + ${p.offX}px)`,
              top: `calc(${100 - BOX_BOTTOM_VH}vh - ${BOX_SIZE}px + ${p.top0}px)`,
              marginLeft: -5.75,
              width: 11.5,
              height: p.height,
              borderRadius: 4,
              background: '#FFC72C',
              border: '2px solid #3B2A22',
              opacity: 0,
              animation: `food-rocket ${BIG.flight}s cubic-bezier(0.25, 0.6, 0.45, 1) ${p.delay}s forwards`,
              '--bl': p.left,
              '--bt': p.top,
              '--rot': `${p.rot}deg`,
              '--rot0': `${p.rot0}deg`,
              '--ox': `${p.offX}px`,
              '--yt': `${p.top0}px`,
            } as React.CSSProperties
          }
        />
      ))}

      {big && (
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
          <FriesBox size={BOX_SIZE} />
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
              width: 7,
              height: 22,
              marginLeft: -3.5,
              marginTop: -11,
              borderRadius: 3.5,
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

      {celebration.kind === 'level' && level && (
        <div
          className="absolute w-[19rem] max-w-[86vw] overflow-hidden rounded-[2rem] border-[3px] border-[#3B2A22] bg-gradient-to-b from-[#FFD75E] to-mc-yellow text-center text-[#3B2A22] shadow-2xl"
          style={{
            left: '50%',
            top: '48%',
            animation: `level-pop ${BIG.time - LEVEL_AT * 1000}ms ease-out ${LEVEL_AT}s both`,
          }}
        >
          <div className="bg-mc-red px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white">
            Nuovo livello
          </div>
          <div className="px-5 pb-4 pt-3">
            <div className="mx-auto -mt-0.5 flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#3B2A22] bg-mc-red font-display text-4xl font-bold text-white shadow-md ring-4 ring-white/70">
              {celebration.level}
            </div>
            <p className="mt-2 font-display text-2xl font-bold leading-tight">Livello {celebration.level} raggiunto!</p>
            <p className="mt-2 inline-block rounded-full bg-[#3B2A22] px-3 py-0.5 text-sm font-semibold text-mc-yellow">
              {level.name}
            </p>
            <p className="mt-2 text-sm font-semibold">
              Hai visitato {visited} {visited === 1 ? 'ristorante' : 'ristoranti'}
            </p>
          </div>
        </div>
      )}

      {celebration.kind === 'region' && (
        <div
          className="absolute w-[19rem] max-w-[86vw] overflow-hidden rounded-[2rem] border-[3px] border-[#3B2A22] bg-gradient-to-b from-[#FFF6CF] to-[#FFE27A] text-center text-[#3B2A22] shadow-2xl"
          style={{
            left: '50%',
            top: '48%',
            animation: `level-pop ${BIG.time - LEVEL_AT * 1000}ms ease-out ${LEVEL_AT}s both`,
          }}
        >
          <div className="bg-mc-red px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white">
            Regione completata
          </div>
          <div className="px-5 pb-4 pt-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#3B2A22] bg-gradient-to-br from-[#FFE27A] to-[#F2AE00] text-3xl text-white shadow-md ring-4 ring-white/70">
              ★
            </div>
            <p className="mt-2 font-display text-2xl font-bold leading-tight">{celebration.region}</p>
            <p className="mt-2 inline-block rounded-full bg-[#3B2A22] px-3 py-0.5 text-sm font-semibold text-mc-yellow">
              Figurina d'oro
            </p>
            <p className="mt-2 text-sm font-semibold">
              Hai visitato tutti i {celebration.total} ristoranti
            </p>
          </div>
        </div>
      )}

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

/** A stamp slams onto the screen, a little ink ring spreads and a few stars fly, then it flies away. */
function StampShow({ stamps }: { stamps: string[] }) {
  const shown = stamps.slice(0, STAMP_SHOWN);
  const extra = stamps.length - shown.length;
  const total = stampTime(stamps.length) / 1000;
  const size = shown.length === 1 ? 190 : 118;

  return (
    <div className="food-rain fixed inset-0 z-[2500] overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0 bg-black/30"
        style={{ animation: `stamp-dim ${total}s ease-in-out both` }}
      />
      <div className="absolute inset-x-0 flex items-center justify-center gap-3" style={{ top: '38%', transform: 'translateY(-50%)' }}>
        {shown.map((id, i) => {
          const def = ACHIEVEMENTS[id];
          if (!def) return null;
          const at = 0.15 + i * 0.9;
          const ink = STAMP_INK[def.family];
          return (
            <div
              key={id}
              className="relative"
              style={{ width: size, height: size, animation: `stamp-out 0.6s ease-in ${total - 0.6}s both` }}
            >
              <svg
                className="absolute inset-0"
                viewBox="0 0 96 96"
                width={size}
                height={size}
                fill="none"
                stroke={ink}
                strokeWidth="3"
                strokeLinejoin="round"
                style={{ opacity: 0, animation: `stamp-ring 0.8s ease-out ${at + 0.45}s forwards` }}
                dangerouslySetInnerHTML={{ __html: STAMP_SHAPES[def.shape] }}
              />
              <div className="absolute inset-0" style={{ animation: `stamp-slam 0.9s cubic-bezier(0.2, 0.9, 0.3, 1.2) ${at}s both` }}>
                <Stamp def={def} state="got" size={size} />
              </div>
              {Array.from({ length: 10 }, (_, k) => {
                const angle = (k / 10) * Math.PI * 2;
                const distance = 90 + (k % 3) * 25;
                return (
                  <span
                    key={k}
                    className="absolute"
                    style={
                      {
                        left: '50%',
                        top: '50%',
                        lineHeight: 0,
                        animation: `food-firework 1.3s cubic-bezier(0.2, 0.8, 0.3, 1) ${at + 0.5}s both`,
                        '--dx': `${Math.round(Math.cos(angle) * distance)}px`,
                        '--dy': `${Math.round(Math.sin(angle) * distance)}px`,
                      } as React.CSSProperties
                    }
                  >
                    <span style={{ display: 'block', marginLeft: -8, marginTop: -8 }}>
                      <Sparkle size={16} color={k % 2 ? '#FFFFFF' : '#FFC72C'} />
                    </span>
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
      {extra > 0 && (
        <p
          className="absolute inset-x-0 text-center font-display text-xl font-bold text-white drop-shadow-lg"
          style={{ top: '52%', animation: `stamp-dim ${total}s ease-in-out both` }}
        >
          +{extra} {extra === 1 ? 'altro timbro' : 'altri timbri'}
        </p>
      )}
    </div>
  );
}
