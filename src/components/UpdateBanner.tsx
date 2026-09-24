import { useEffect, useState } from 'react';
import { justUpdated } from '@/services/updates';

const SHOW_MS = 3500;
// Read once when the app loads (reading it clears it)
const UPDATED_NOW = justUpdated();

/**
 * "App aggiornata": for a few seconds right after a new version was applied. Updates install themselves when the app
 * goes to the background (see services/updates), so there is nothing to tap: this only says that it happened.
 */
export function UpdateBanner() {
  const [shown, setShown] = useState(UPDATED_NOW);

  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(() => setShown(false), SHOW_MS);
    return () => clearTimeout(t);
  }, [shown]);

  if (!shown) return null;

  return (
    <div
      className="fixed inset-x-3 z-[1500] mx-auto flex max-w-md items-center justify-center rounded-2xl bg-mc-yellow px-4 py-2.5 text-gray-800 shadow-lg shadow-black/20 animate-[toast-in_0.35s_ease-out]"
      style={{ bottom: 'calc(5rem + var(--safe-bottom) + 0.75rem)' }}
      role="status"
      onClick={() => setShown(false)}
    >
      <span className="text-sm font-display font-semibold">✨ App aggiornata alla nuova versione</span>
    </div>
  );
}
