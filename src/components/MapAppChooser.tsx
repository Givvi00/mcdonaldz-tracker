import { useEffect, useState } from 'react';
import { CHOOSE_MAP_APP_EVENT, openDirectionsWith, type Destination } from '@/utils/navigation';
import { MAP_APPS } from '@/utils/directions';

/** iPhone/iPad: the first "Portami lì" asks which maps app to use, then remembers it (changeable in Profilo). */
export function MapAppChooser() {
  const [dest, setDest] = useState<Destination | null>(null);

  useEffect(() => {
    const onChoose = (e: Event) => setDest((e as CustomEvent<Destination>).detail);
    window.addEventListener(CHOOSE_MAP_APP_EVENT, onChoose);
    return () => window.removeEventListener(CHOOSE_MAP_APP_EVENT, onChoose);
  }, []);

  if (!dest) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end bg-black/50" onClick={() => setDest(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Con quale app vuoi andarci?"
        className="w-full rounded-t-3xl bg-white dark:bg-gray-900 p-5 shadow-xl"
        style={{ paddingBottom: 'calc(1.25rem + var(--safe-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-display font-semibold text-lg text-gray-800 dark:text-gray-100">Con quale app vuoi andarci?</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ricorderò la scelta. La puoi cambiare dal Profilo.</p>
        <div className="mt-4 flex flex-col gap-2">
          {MAP_APPS.map(app => (
            <button
              key={app.value}
              onClick={() => {
                openDirectionsWith(app.value, dest);
                setDest(null);
              }}
              className="flex items-center gap-3 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-left font-semibold text-gray-800 dark:text-gray-100 active:scale-[0.98] transition-transform"
            >
              <span className="text-xl">{app.icon}</span>
              {app.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setDest(null)}
          className="mt-3 w-full py-2 text-sm font-semibold text-gray-500 dark:text-gray-400"
        >
          Annulla
        </button>
      </div>
    </div>
  );
}
