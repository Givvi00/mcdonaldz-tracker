import { useState } from 'react';
import { FoodIcon } from '@/components/FoodIcon';
import { LEVELS, levelInfo } from '@/utils/foodTheme';

const Padlock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

/** All the levels as a path: reached ones in the open, the next one with its bar, the others locked and unnamed. */
export function LevelRoadmap({ visited }: { visited: number }) {
  const { index: current, toNext } = levelInfo(visited);
  const [showPassed, setShowPassed] = useState(false);
  const next = LEVELS[current + 1];
  const prevMin = LEVELS[current].min;
  const pct = next ? Math.min(100, Math.round(((visited - prevMin) / (next.min - prevMin)) * 100)) : 100;

  const row = (i: number) => {
    const level = LEVELS[i];
    const state = i < current ? 'done' : i === current ? 'cur' : i === current + 1 ? 'next' : 'lock';
    const medal =
      state === 'cur'
        ? 'bg-mc-red ring-4 ring-[#FFD75E]'
        : state === 'done'
          ? 'bg-mc-yellow'
          : state === 'next'
            ? 'bg-[#FFF4DC] dark:bg-amber-950/40 border-dashed'
            : 'bg-stone-200 dark:bg-stone-800 border-stone-400 dark:border-stone-600 text-stone-500 dark:text-stone-400';
    return (
      <li key={i} className="relative flex items-center gap-3 py-2">
        <div
          className={`relative z-[1] flex h-14 w-14 flex-none items-center justify-center rounded-full border-[3px] border-[#3B2A22] ${medal}`}
        >
          {state === 'lock' ? <Padlock /> : <FoodIcon name={level.icon} size={32} />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className={`text-sm font-bold ${state === 'lock' ? 'text-stone-400 dark:text-stone-500' : 'text-gray-800 dark:text-gray-100'}`}>
            Livello {i + 1} · {state === 'lock' ? '???' : level.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {state === 'cur'
              ? next
                ? 'Sei qui'
                : 'Sei al livello massimo!'
              : state === 'done'
                ? `Raggiunto a ${level.min} ristoranti`
                : state === 'next'
                  ? `Mancano ${toNext} ${toNext === 1 ? 'visita' : 'visite'}`
                  : `Si sblocca a ${level.min} ristoranti`}
          </p>
          {state === 'next' && (
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
              <div className="h-full rounded-full bg-mc-red transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="isolate rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {current > 0 && (
        <button
          onClick={() => setShowPassed(v => !v)}
          className="mb-1 w-full rounded-xl bg-stone-100 py-2 text-xs font-semibold text-gray-600 active:scale-[0.98] dark:bg-stone-800 dark:text-gray-300"
        >
          {showPassed ? 'Nascondi i livelli superati' : `Livelli superati (${current})`}
        </button>
      )}
      <ul className="relative m-0 list-none p-0">
        <span
          aria-hidden="true"
          className="absolute bottom-7 left-[1.7rem] top-7 w-1 opacity-60"
          style={{ background: 'repeating-linear-gradient(#d9c9b4 0 8px, transparent 8px 14px)' }}
        />
        {showPassed && Array.from({ length: current }, (_, i) => row(i))}
        {Array.from({ length: LEVELS.length - current }, (_, k) => row(current + k))}
      </ul>
    </div>
  );
}
