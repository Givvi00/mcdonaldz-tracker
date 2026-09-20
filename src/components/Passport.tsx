import { useEffect, useRef, useState } from 'react';
import { ACHIEVEMENT_LIST, FAMILIES, type AchievementProgress } from '@/services/achievements';
import { Stamp } from '@/components/Stamp';

interface Props {
  unlocked: ReadonlySet<string>;
  progress: Record<string, AchievementProgress>;
  focused: string[];
}

const FLIP_MS = 700;
const PAGES = FAMILIES.length + 1; // the cover, then one page per family

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const GOLD_TEXT = 'bg-gradient-to-b from-[#FFE9A0] via-[#F5C542] to-[#D99A12] bg-clip-text text-transparent';

/** The cover: red leather, gold frame, the Mz. lettering of the app icon. Laid out with CSS so it fits any page height. */
function Cover({ got, total }: { got: number; total: number }) {
  return (
    <div className="passport-leather relative h-full overflow-hidden rounded-[1.2rem] border-[3px] border-[#3B2A22] shadow-xl dark:border-[#6B5546]">
      {/* binding on the left */}
      <div className="absolute inset-y-0 left-0 w-3.5 bg-black/20" />
      <div className="absolute inset-y-0 left-3.5 w-0.5 bg-black/20" />
      {/* gold frame, double line */}
      <div className="absolute inset-y-4 left-8 right-4 rounded-xl border-2 border-[#E8B830]" />
      <div className="absolute inset-y-[1.3rem] left-[2.3rem] right-[1.3rem] rounded-lg border border-[#E8B830]/80" />

      <div className="relative flex h-full flex-col items-center justify-between py-9 pl-11 pr-7 text-center">
        <p className={`font-display text-lg font-bold tracking-[0.35em] ${GOLD_TEXT}`}>PASSAPORTO</p>

        <div className="flex flex-col items-center">
          <svg viewBox="-24 -26 48 68" width="64" height="90" aria-hidden="true">
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
            className={`mt-1 font-display text-[5.5rem] font-bold leading-none ${GOLD_TEXT}`}
            style={{ filter: 'drop-shadow(1.5px 2px 0 rgba(94,42,8,.55))' }}
          >
            Mz.
          </p>
        </div>

        <div>
          <p className={`font-display text-sm font-semibold tracking-[0.25em] ${GOLD_TEXT}`}>McDONALDZ TRACKER</p>
          <p className="mt-2 text-xs font-semibold text-[#FFE9A0]/90">
            {got} / {total} timbri
          </p>
        </div>
      </div>
    </div>
  );
}

function FamilyPage({
  family,
  number,
  unlocked,
  progress,
  focused,
}: {
  family: (typeof FAMILIES)[number];
  number: number;
  unlocked: ReadonlySet<string>;
  progress: Record<string, AchievementProgress>;
  focused: string[];
}) {
  const items = ACHIEVEMENT_LIST.filter(a => a.family === family.id);
  const familyGot = items.filter(a => unlocked.has(a.id)).length;
  return (
    <section
      className={`relative h-full overflow-hidden rounded-[1.2rem] border-[3px] border-[#3B2A22] p-3 pl-5 text-[#3B2A22] shadow-xl dark:border-[#6B5546] dark:text-[#F3E7D3] ${
        family.id === 'segreti' ? 'passport-page-secret' : 'passport-page'
      }`}
    >
      {/* binding shadow on the left edge */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-black/20 to-transparent" />
      <header className="flex items-baseline justify-between">
        <h4 className="font-display text-sm font-bold uppercase tracking-[0.08em]">{family.title}</h4>
        <span className="text-xs text-[#7A6657] dark:text-[#B9A793]">
          {familyGot} su {items.length}
        </span>
      </header>
      <p className="mb-2 text-xs text-[#7A6657] dark:text-[#B9A793]">{family.blurb}</p>
      <div className="grid grid-cols-3 gap-x-1.5 gap-y-3 pb-8">
        {items.map(def => {
          const has = unlocked.has(def.id);
          const state = has ? 'got' : def.secret ? 'secret' : 'no';
          const p = progress[def.id];
          return (
            <div
              key={def.id}
              id={`ach-${def.id}`}
              className={`flex flex-col items-center rounded-xl p-1 text-center transition-all ${
                focused.includes(def.id) ? 'animate-pulse ring-4 ring-mc-red ring-offset-2 ring-offset-[#FFFAF0] dark:ring-offset-[#362A22]' : ''
              }`}
            >
              <Stamp def={def} state={state} size={84} />
              <p className={`mt-0.5 text-xs font-bold leading-tight ${has ? '' : 'text-[#A08F80] dark:text-[#8E7D6C]'}`}>
                {state === 'secret' ? '???' : def.name}
              </p>
              <p className="mt-0.5 text-[0.65rem] leading-tight text-[#7A6657] dark:text-[#B9A793]">
                {state === 'secret' ? 'Timbro segreto' : def.description}
              </p>
              {state === 'no' && p && p.target > 1 && (
                <p className="mt-1 text-[0.65rem] font-bold text-mc-red dark:text-red-400">
                  {p.current}/{p.target}
                  {p.label ? ` · ${p.label}` : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {/* page number and a faint Mz. */}
      <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-2 text-[0.65rem] font-semibold text-[#A08F80] dark:text-[#8E7D6C]">
        <span className="font-display text-sm font-bold opacity-50">Mz.</span>
        <span>· pagina {number} ·</span>
      </div>
    </section>
  );
}

/** The achievements as a real passport: a cover to open, then a page for each family, turned with a flip. */
export function Passport({ unlocked, progress, focused }: Props) {
  const [page, setPage] = useState(0);
  const [flip, setFlip] = useState<{ from: number; to: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipe = useRef<number | null>(null);
  const got = ACHIEVEMENT_LIST.filter(a => unlocked.has(a.id)).length;

  // Arriving from a stamp toast: open the passport at the page of the first stamp
  useEffect(() => {
    if (focused.length === 0) return;
    const def = ACHIEVEMENT_LIST.find(a => a.id === focused[0]);
    const index = def ? FAMILIES.findIndex(f => f.id === def.family) + 1 : 0;
    if (index > 0) {
      setFlip(null);
      setPage(index);
    }
  }, [focused]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const goTo = (to: number) => {
    if (to < 0 || to >= PAGES || to === page || flip) return;
    if (prefersReducedMotion()) {
      setPage(to);
      return;
    }
    setFlip({ from: page, to });
    timer.current = setTimeout(() => {
      setPage(to);
      setFlip(null);
    }, FLIP_MS);
  };

  const renderPage = (index: number) =>
    index === 0 ? (
      <Cover got={got} total={ACHIEVEMENT_LIST.length} />
    ) : (
      <FamilyPage
        family={FAMILIES[index - 1]}
        number={index}
        unlocked={unlocked}
        progress={progress}
        focused={focused}
      />
    );

  // Which page is drawn how: the visible one, and during a flip the one turning and the one under it
  const goingForward = flip ? flip.to > flip.from : true;
  const turning = flip ? (goingForward ? flip.from : flip.to) : null; // the page that moves
  const under = flip ? (goingForward ? flip.to : flip.from) : null; // the page it reveals or covers

  const layer = (index: number) => {
    if (flip) {
      if (index === turning) return { visible: true, z: 3, className: goingForward ? 'book-flip-fwd' : 'book-flip-back' };
      if (index === under) return { visible: true, z: 1, className: '' };
      return { visible: false, z: 0, className: '' };
    }
    return { visible: index === page, z: 1, className: '' };
  };

  return (
    <div>
      <div
        className="grid [perspective:1500px]"
        onPointerDown={e => {
          swipe.current = e.clientX;
        }}
        onPointerUp={e => {
          if (swipe.current === null) return;
          const dx = e.clientX - swipe.current;
          swipe.current = null;
          if (Math.abs(dx) > 50) goTo(page + (dx < 0 ? 1 : -1));
        }}
        onPointerCancel={() => {
          swipe.current = null;
        }}
      >
        {Array.from({ length: PAGES }, (_, index) => {
          const l = layer(index);
          return (
            <div
              key={index}
              className={`${l.className}`}
              style={{
                gridArea: '1 / 1',
                zIndex: l.z,
                visibility: l.visible ? 'visible' : 'hidden',
                pointerEvents: l.visible && !flip ? 'auto' : 'none',
              }}
              onClick={index === 0 && !flip ? () => goTo(1) : undefined}
            >
              {renderPage(index)}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page === 0 || !!flip}
          className="rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-600 transition-transform active:scale-95 disabled:opacity-30 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          aria-label="Pagina precedente"
        >
          ‹ Indietro
        </button>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: PAGES }, (_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full transition-colors ${i === page ? 'bg-mc-red' : 'bg-gray-300 dark:bg-gray-700'}`} />
          ))}
        </div>
        <button
          onClick={() => goTo(page + 1)}
          disabled={page === PAGES - 1 || !!flip}
          className="rounded-xl bg-mc-red px-3 py-2 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-30"
          aria-label={page === 0 ? 'Apri il passaporto' : 'Pagina successiva'}
        >
          {page === 0 ? 'Apri ›' : 'Avanti ›'}
        </button>
      </div>
    </div>
  );
}
