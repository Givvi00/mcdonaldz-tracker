import { useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { applyUpdate } from '@/services/updates';

/** "New version available" strip, shown above the bottom navigation. Dismissed until the next launch. */
export function UpdateBanner() {
  const updateAvailable = useMcdonaldStore(state => state.updateAvailable);
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <div
      className="fixed inset-x-3 z-[1500] flex items-center gap-2 rounded-2xl bg-mc-yellow text-gray-800 pl-4 pr-2 py-2 shadow-lg shadow-black/20 animate-[toast-in_0.35s_ease-out]"
      style={{ bottom: 'calc(5rem + var(--safe-bottom) + 0.75rem)' }}
      role="status"
    >
      <span className="flex-1 text-sm font-display font-semibold">✨ Nuova versione disponibile</span>
      <button
        onClick={applyUpdate}
        className="rounded-full bg-mc-red text-white text-xs font-bold px-4 py-2 active:scale-95 transition-transform"
      >
        Aggiorna
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Nascondi"
        className="w-8 h-8 rounded-full text-gray-600 text-sm active:scale-95 transition-transform"
      >
        ✕
      </button>
    </div>
  );
}
