import { useState } from 'react';
import { useMcdonaldStore, type Celebration } from '@/store/mcdonaldStore';
import { LEVELS } from '@/utils/foodTheme';
import { ACHIEVEMENT_LIST } from '@/services/achievements';

type NoId<T> = T extends unknown ? Omit<T, 'id'> : never;

/** Development only (never in the published app): a small panel to play any celebration without making real visits. */
export function CelebrationLab() {
  const [open, setOpen] = useState(false);
  const { enqueueCelebrations, clearCelebration } = useMcdonaldStore();
  const play = (event: NoId<Celebration>) => enqueueCelebrations([{ ...event, id: Date.now() } as Celebration]);
  const stamps = ACHIEVEMENT_LIST.map(a => a.id);

  const button = 'rounded-lg bg-white/15 px-2 py-1 text-xs font-semibold text-white active:scale-95';

  return (
    <div className="fixed bottom-20 left-2 z-[3100] text-white">
      {open ? (
        <div className="w-60 rounded-2xl bg-black/85 p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide">Prova le feste</p>
            <button onClick={() => setOpen(false)} className="text-sm" aria-label="Chiudi">
              ✕
            </button>
          </div>
          <p className="mb-1 text-[0.65rem] opacity-70">Nuovo livello</p>
          <div className="mb-2 grid grid-cols-6 gap-1">
            {LEVELS.slice(1).map((l, i) => (
              <button key={l.name} className={button} onClick={() => play({ kind: 'level', level: i + 2 })} title={l.name}>
                {i + 2}
              </button>
            ))}
          </div>
          <p className="mb-1 text-[0.65rem] opacity-70">Altro</p>
          <div className="flex flex-wrap gap-1">
            <button className={button} onClick={() => play({ kind: 'region', region: 'Abruzzo', total: 18 })}>
              Regione
            </button>
            <button className={button} onClick={() => play({ kind: 'stamp', stamps: stamps.slice(0, 1) })}>
              1 timbro
            </button>
            <button className={button} onClick={() => play({ kind: 'stamp', stamps: stamps.slice(0, 3) })}>
              3 timbri
            </button>
            <button className={button} onClick={() => play({ kind: 'visit' })}>
              Visita
            </button>
            <button className={`${button} bg-red-600/60`} onClick={clearCelebration}>
              Stop
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="rounded-full bg-black/70 px-3 py-2 text-lg shadow-lg" aria-label="Prova le feste">
          🎆
        </button>
      )}
    </div>
  );
}
