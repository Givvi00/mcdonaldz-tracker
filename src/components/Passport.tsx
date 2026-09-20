import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ACHIEVEMENT_LIST, FAMILIES, type AchievementProgress } from '@/services/achievements';
import { Stamp } from '@/components/Stamp';

interface Props {
  unlocked: ReadonlySet<string>;
  progress: Record<string, AchievementProgress>;
  focused: string[];
}

// The book is drawn at a fixed size and scaled to fit the phone, so it always fits on the screen
const W = 340;
const H = 452;
const PAGES = FAMILIES.length + 1; // the cover, then one page per family
const MAX_ANGLE = 180;
const SETTLE_MS = 480;
// Room to the left of the book: the pages already turned lie there and go off the edge of the screen
const PAD = 10;
// The sheet is a stack of thin rounded layers, so its thickness follows the rounded corners of the page
const HALF = 2.5;
const LAYERS = [-1.9, -0.65, 0.65, 1.9];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Scale that makes the book fit the width of its box and the height left on screen */
function useFit(box: React.RefObject<HTMLDivElement | null>) {
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const update = () => {
      const el = box.current;
      if (!el) return;
      const availH = Math.max(320, window.innerHeight - 200);
      setK(Math.min(el.clientWidth / (W + PAD), availH / H, 1));
    };
    update();
    const observer = new ResizeObserver(update);
    if (box.current) observer.observe(box.current);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [box]);
  return k;
}

const GOLD_TEXT = 'bg-gradient-to-b from-[#FFE9A0] via-[#F5C542] to-[#D99A12] bg-clip-text text-transparent';

/** The cover: red leather, double gold frame with stitching, foil lettering, a sheen that passes over it */
function Cover({ got, total, sheen }: { got: number; total: number; sheen: boolean }) {
  return (
    <div className="passport-leather relative h-full w-full overflow-hidden rounded-[14px] border-[3px] border-[#3B2A22] shadow-xl dark:border-[#6B5546]">
      <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/35 to-black/10" />
      <div className="absolute inset-y-0 left-4 w-0.5 bg-black/25" />
      <div className="absolute inset-y-3.5 left-9 right-3.5 rounded-xl border-2 border-[#E8B830] shadow-[0_0_6px_rgba(255,214,102,0.35)]" />
      <div className="absolute inset-y-[1.15rem] left-[2.6rem] right-[1.15rem] rounded-lg border border-dashed border-[#F5D57A]/70" />
      <div className="absolute inset-y-[1.55rem] left-[3rem] right-[1.55rem] rounded-md border border-[#E8B830]/60" />

      <div className="relative flex h-full flex-col items-center justify-between py-9 pl-11 pr-7 text-center">
        <div>
          <p className={`font-display text-[15px] font-bold tracking-[0.4em] ${GOLD_TEXT}`}>PASSAPORTO</p>
          <div className="mx-auto mt-1.5 h-px w-24 bg-gradient-to-r from-transparent via-[#F5C542] to-transparent" />
        </div>

        <div className="flex flex-col items-center">
          <svg viewBox="-24 -26 48 68" width="58" height="82" aria-hidden="true" style={{ filter: 'drop-shadow(0 2px 2px rgba(60,20,5,.45))' }}>
            <defs>
              <linearGradient id="pinfoil" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFE9A0" />
                <stop offset=".55" stopColor="#F5C542" />
                <stop offset="1" stopColor="#D99A12" />
              </linearGradient>
            </defs>
            <path d="M0 40C0 40 -22 16 -22 -2a22 22 0 1 1 44 0C22 16 0 40 0 40Z" fill="url(#pinfoil)" stroke="#5E2A08" strokeWidth="2" strokeLinejoin="round" />
            <path d="M-9 -3l7 7 12-14" fill="none" stroke="#B81F14" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p
            className={`mt-1 font-display text-[84px] font-bold leading-none ${GOLD_TEXT}`}
            style={{ filter: 'drop-shadow(1.5px 2px 0 rgba(94,42,8,.6)) drop-shadow(0 0 8px rgba(255,214,102,.25))' }}
          >
            Mz.
          </p>
        </div>

        <div>
          <div className="mx-auto mb-2 h-px w-24 bg-gradient-to-r from-transparent via-[#F5C542] to-transparent" />
          <p className={`font-display text-[12px] font-semibold tracking-[0.28em] ${GOLD_TEXT}`}>McDONALDZ TRACKER</p>
          <p className="mt-1.5 text-[11px] font-semibold text-[#FFE9A0]/90">
            {got} / {total} timbri
          </p>
        </div>
      </div>
      {sheen && <div className="passport-sheen pointer-events-none absolute inset-0" />}
    </div>
  );
}

function FamilyPage({
  family,
  number,
  unlocked,
  progress,
  focused,
  selected,
  onSelect,
}: {
  family: (typeof FAMILIES)[number];
  number: number;
  unlocked: ReadonlySet<string>;
  progress: Record<string, AchievementProgress>;
  focused: string[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const items = ACHIEVEMENT_LIST.filter(a => a.family === family.id);
  const familyGot = items.filter(a => unlocked.has(a.id)).length;
  const current = items.find(a => a.id === selected) ?? null;
  const currentHas = current ? unlocked.has(current.id) : false;
  const currentProgress = current ? progress[current.id] : undefined;

  return (
    <section
      className={`relative h-full w-full overflow-hidden rounded-[14px] border-[3px] border-[#3B2A22] pb-3 pl-7 pr-4 pt-4 text-[#3B2A22] shadow-xl dark:border-[#6B5546] dark:text-[#F3E7D3] ${
        family.id === 'segreti' ? 'passport-page-secret' : 'passport-page'
      }`}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-9 bg-gradient-to-r from-black/25 to-transparent" />
      <div className="pointer-events-none absolute inset-1.5 left-5 rounded-lg border border-[#C9A24A]/50" />

      <header className="relative flex items-baseline justify-between">
        <h4 className="font-display text-[15px] font-bold uppercase tracking-[0.1em]">{family.title}</h4>
        <span className="text-[11px] text-[#7A6657] dark:text-[#B9A793]">
          {familyGot} su {items.length}
        </span>
      </header>
      <p className="relative text-[11px] text-[#7A6657] dark:text-[#B9A793]">{family.blurb}</p>

      <div className="relative mt-3 grid grid-cols-3 gap-x-1 gap-y-1">
        {items.map(def => {
          const has = unlocked.has(def.id);
          const state = has ? 'got' : def.secret ? 'secret' : 'no';
          const p = progress[def.id];
          return (
            <button
              key={def.id}
              id={`ach-${def.id}`}
              onClick={() => onSelect(def.id)}
              className={`flex select-none flex-col items-center rounded-lg p-0.5 text-center transition-transform active:scale-95 ${
                focused.includes(def.id) ? 'animate-pulse ring-2 ring-mc-red' : ''
              } ${selected === def.id ? 'bg-black/5 dark:bg-white/10' : ''}`}
            >
              <Stamp def={def} state={state} size={56} />
              <span className={`mt-0.5 text-[10.5px] font-bold leading-tight ${has ? '' : 'text-[#A08F80] dark:text-[#8E7D6C]'}`}>
                {state === 'secret' ? '???' : def.name}
              </span>
              {state === 'no' && p && p.target > 1 && (
                <span className="text-[10px] font-bold text-mc-red dark:text-red-400">
                  {p.current}/{p.target}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* details of the tapped stamp */}
      <div className="absolute bottom-8 left-7 right-4 min-h-[44px] rounded-lg border border-[#C9A24A]/60 bg-white/60 px-2.5 py-1.5 text-[11px] leading-snug dark:bg-black/25">
        {current ? (
          <>
            <p className="font-bold">
              {current.secret && !currentHas ? '???' : current.name}
              {currentHas && <span className="ml-1 text-green-700 dark:text-green-400">✓</span>}
            </p>
            <p className="text-[#7A6657] dark:text-[#B9A793]">
              {current.secret && !currentHas ? 'Timbro segreto: lo scopri per caso.' : current.description}
              {!currentHas && currentProgress && currentProgress.target > 1 && (
                <span className="font-bold text-mc-red dark:text-red-400">
                  {' '}
                  · {currentProgress.current}/{currentProgress.target}
                  {currentProgress.label ? ` · ${currentProgress.label}` : ''}
                </span>
              )}
            </p>
          </>
        ) : (
          <p className="text-[#7A6657] dark:text-[#B9A793]">Tocca un timbro per vedere come si ottiene.</p>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-2 text-[10px] font-semibold text-[#A08F80] dark:text-[#8E7D6C]">
        <span className="font-display text-[13px] font-bold opacity-50">Mz.</span>
        <span className="flex items-center gap-1" aria-label={`Pagina ${number} di ${PAGES - 1}`}>
          {Array.from({ length: PAGES }, (_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === number ? 'bg-mc-red' : 'bg-[#C9A24A]/50'}`} />
          ))}
        </span>
      </div>
    </section>
  );
}

type Dir = 'next' | 'prev';

/**
 * The achievements as a real passport: a leather cover, then a page for each family, turned by hand.
 * While a page turns nothing is re-rendered: its transform is written straight to the element on every frame,
 * which keeps the animation light on a phone. The turned pages stay on the left and run off the edge of the screen.
 */
export function Passport({ unlocked, progress, focused }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const k = useFit(box);
  const [page, setPage] = useState(0);
  const [turnDir, setTurnDir] = useState<Dir | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const pageRef = useRef(0);
  const pages = useRef<(HTMLDivElement | null)[]>([]);
  const frame = useRef<number | null>(null);
  const busy = useRef(false);
  const drag = useRef<{ x: number; y: number; active: boolean; dir?: Dir; progress: number } | null>(null);
  const got = ACHIEVEMENT_LIST.filter(a => unlocked.has(a.id)).length;
  pageRef.current = page;

  // Arriving from a stamp toast: open the passport at the page of the first stamp
  useEffect(() => {
    if (focused.length === 0) return;
    const def = ACHIEVEMENT_LIST.find(a => a.id === focused[0]);
    const index = def ? FAMILIES.findIndex(f => f.id === def.family) + 1 : 0;
    if (index > 0) {
      if (frame.current) cancelAnimationFrame(frame.current);
      busy.current = false;
      setTurnDir(null);
      setPage(index);
      setSelected(focused[0]);
    }
  }, [focused]);

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const canGo = (dir: Dir) => (dir === 'next' ? page < PAGES - 1 : page > 0);

  /** Write the position of the turning page straight to the DOM (amount = how far the gesture has gone, 0..1) */
  const applyTurn = (dir: Dir, amount: number) => {
    const index = dir === 'next' ? pageRef.current : pageRef.current - 1;
    const el = pages.current[index];
    if (!el) return;
    const angle = MAX_ANGLE * (dir === 'next' ? amount : 1 - amount);
    el.style.transform = `rotateY(${-angle}deg)`;
    const front = el.querySelector<HTMLElement>('[data-shade="front"]');
    const back = el.querySelector<HTMLElement>('[data-shade="back"]');
    if (front) front.style.opacity = String(0.32 * Math.min(1, angle / 90));
    if (back) back.style.opacity = String(0.05 + 0.3 * (1 - Math.max(0, (angle - 90) / 90)));
  };

  /** Let go of a page: it finishes turning or falls back */
  const settle = (dir: Dir, complete: boolean, from: number) => {
    busy.current = true;
    const to = complete ? 1 : 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / SETTLE_MS);
      applyTurn(dir, from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) {
        frame.current = requestAnimationFrame(step);
        return;
      }
      busy.current = false;
      if (complete) setPage(p => p + (dir === 'next' ? 1 : -1));
      setTurnDir(null);
    };
    frame.current = requestAnimationFrame(step);
  };

  const turnBy = (dir: Dir) => {
    if (busy.current || !canGo(dir)) return;
    if (prefersReducedMotion()) {
      setPage(p => p + (dir === 'next' ? 1 : -1));
      return;
    }
    busy.current = true;
    setTurnDir(dir);
    settle(dir, true, 0);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (busy.current) return;
    drag.current = { x: e.clientX, y: e.clientY, active: false, progress: 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      const dir: Dir = dx < 0 ? 'next' : 'prev';
      if (!canGo(dir)) {
        drag.current = null;
        return;
      }
      d.active = true;
      d.dir = dir;
      setTurnDir(dir);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    d.progress = Math.min(1, Math.abs(dx) / (W * k));
    applyTurn(d.dir as Dir, d.progress);
  };
  const onPointerEnd = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.active || !d.dir) return;
    settle(d.dir, d.progress > 0.35, d.progress);
  };
  const onCoverTap = () => {
    if (page === 0 && !turnDir) turnBy('next');
  };

  const turning = turnDir ? (turnDir === 'next' ? page : page - 1) : null;

  return (
    <div>
      {/* wider than the column, so the pages that go off to the left are cut by the edge of the screen and not by the column */}
      <div className="-mx-4 overflow-x-clip px-4">
        <div ref={box} className="flex justify-center">
          <div className="relative" style={{ width: (W + PAD) * k, height: H * k }}>
            <div
              className="absolute top-0 touch-pan-y select-none [perspective:1500px]"
              style={{ left: PAD * k, width: W, height: H, transform: `scale(${k})`, transformOrigin: 'top left' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
            >
              {Array.from({ length: PAGES }, (_, index) => {
                const isTurning = index === turning;
                const turned = index < page;
                const visible = index <= page || (turnDir === 'next' && index === page + 1);
                const showFront = index >= page - 1 && index <= page + 1;
                const showBack = index <= page;
                return (
                  <div
                    key={index}
                    ref={el => {
                      pages.current[index] = el;
                    }}
                    className="absolute inset-0"
                    style={{
                      zIndex: isTurning ? 100 : index,
                      visibility: visible ? 'visible' : 'hidden',
                      transformOrigin: 'left center',
                      transformStyle: 'preserve-3d',
                      transform: turned ? `rotateY(-${MAX_ANGLE}deg)` : undefined,
                      willChange: isTurning ? 'transform' : undefined,
                    }}
                    onClick={index === 0 ? onCoverTap : undefined}
                  >
                    {showFront && (
                      <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: `translateZ(${HALF}px)` }}>
                        {index === 0 ? (
                          <Cover got={got} total={ACHIEVEMENT_LIST.length} sheen={page === 0} />
                        ) : (
                          <FamilyPage
                            family={FAMILIES[index - 1]}
                            number={index}
                            unlocked={unlocked}
                            progress={progress}
                            focused={focused}
                            selected={selected}
                            onSelect={setSelected}
                          />
                        )}
                        <div data-shade="front" className="pointer-events-none absolute inset-0 rounded-[14px] bg-black" style={{ opacity: 0 }} />
                      </div>
                    )}
                    {showBack && (
                      <>
                        {/* the back of the sheet, seen once it is past the vertical */}
                        <div
                          className={`absolute inset-0 rounded-[14px] border-[3px] border-[#3B2A22] dark:border-[#6B5546] ${index === 0 ? 'passport-leather' : 'passport-page'}`}
                          style={{ transform: `rotateY(180deg) translateZ(${HALF}px)`, backfaceVisibility: 'hidden' }}
                        >
                          <div className="absolute inset-y-0 right-0 w-9 bg-gradient-to-l from-black/25 to-transparent" />
                          <div data-shade="back" className="absolute inset-0 rounded-[11px] bg-black" style={{ opacity: 0.05 }} />
                        </div>
                        {/* the thickness of the sheet: rounded layers between the two faces */}
                        {LAYERS.map(z => (
                          <div
                            key={z}
                            className={`absolute inset-0 rounded-[14px] border ${index === 0 ? 'border-[#3B2A22] bg-[#8F1A10]' : 'border-[#C9A24A]/60 bg-[#E9DDBE]'}`}
                            style={{ transform: `translateZ(${z}px)` }}
                          />
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-[0.65rem] text-gray-500 dark:text-gray-400">
        {page === 0 ? 'Scorri con il dito per aprirlo' : 'Scorri con il dito per girare pagina'}
      </p>
    </div>
  );
}
