import { TRAY_SLOTS, trayFilled } from '@/utils/foodTheme';

const visitsLabel = (n: number) => `${n} ${n === 1 ? 'visita' : 'visite'}`;

/** The tray: food appears on it as the visits grow. Empty slots show a faded outline of what is coming. */
export function Tray({ visited }: { visited: number }) {
  const filled = trayFilled(visited);
  const nextIndex = filled.findIndex(f => !f);
  const next = nextIndex >= 0 ? TRAY_SLOTS[nextIndex] : null;

  return (
    <div>
      <h3 className="font-display font-semibold text-lg mb-3 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/50 text-sm">🍽️</span>
        Il tuo vassoio
      </h3>
      <div className="rounded-3xl bg-gradient-to-b from-mc-red to-mc-red-dark p-2.5 shadow-md shadow-red-900/20">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gray-50 dark:bg-gray-900 p-3">
          {TRAY_SLOTS.map((slot, i) => (
            <div
              key={slot.label}
              className={`flex flex-col items-center rounded-xl py-2 ${
                filled[i] ? 'bg-white dark:bg-gray-800 shadow-sm' : 'border-2 border-dashed border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className={`text-3xl leading-none ${filled[i] ? '' : 'opacity-20 grayscale'}`}>{slot.emoji}</span>
              <span className="mt-1 text-[0.65rem] font-semibold text-gray-600 dark:text-gray-400">{slot.label}</span>
              {!filled[i] && <span className="text-[0.6rem] text-gray-400 dark:text-gray-500">a {visitsLabel(slot.min)}</span>}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
        {next ? `Prossimo: ${next.emoji} ${next.label} a ${visitsLabel(next.min)}` : 'Vassoio completo! 🎉'}
      </p>
    </div>
  );
}

/** Empty state: a tray with nothing on it, with a line saying what to do. */
export function EmptyTray({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
      <div className="mx-auto mb-3 w-40 rounded-2xl bg-gradient-to-b from-mc-red to-mc-red-dark p-1.5 shadow-md shadow-red-900/20">
        <div className="flex justify-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-900 py-3">
          {['🥤', '🍟', '🍔'].map(emoji => (
            <span key={emoji} className="text-2xl opacity-25 grayscale">{emoji}</span>
          ))}
        </div>
      </div>
      <p className="text-lg font-display font-semibold text-gray-700 dark:text-gray-300">{title}</p>
      {hint && <p className="text-sm">{hint}</p>}
    </div>
  );
}
