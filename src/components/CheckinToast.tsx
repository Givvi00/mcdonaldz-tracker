import { useEffect } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { shortMcName } from '@/utils/format';

const SHOW_MS = 5000;

/** "Sei tornato da …": a visit more, counted by itself when you opened the app at a restaurant you already visited */
export function CheckinToast() {
  const notice = useMcdonaldStore(state => state.checkinNotice);
  const clear = useMcdonaldStore(state => state.clearCheckinNotice);
  const mcdonalds = useMcdonaldStore(state => state.mcdonalds);
  // A stamp or a celebration from the same visit matters more: this one waits
  const busy = useMcdonaldStore(state => state.newlyUnlocked.length > 0 || state.celebration !== null);

  useEffect(() => {
    if (!notice || busy) return;
    const t = setTimeout(clear, SHOW_MS);
    return () => clearTimeout(t);
  }, [notice, busy, clear]);

  if (!notice || busy) return null;
  const mc = mcdonalds.find(m => m.id === notice.mcdonaldId);

  return (
    <div
      key={notice.id}
      role="status"
      onClick={clear}
      className="fixed inset-x-3 z-[2800] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-green-600 px-4 py-3 text-white shadow-lg shadow-black/25 animate-[toast-in_0.35s_ease-out]"
      style={{ top: 'calc(0.75rem + var(--safe-top))' }}
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white/20 font-display text-lg font-bold">
        {notice.count}
      </span>
      <div className="min-w-0">
        <p className="font-display text-sm font-bold leading-tight">Bentornato da {mc ? shortMcName(mc.name) : 'questo Mc'}!</p>
        <p className="mt-0.5 truncate text-xs opacity-90">È la tua {notice.count}ª visita qui</p>
      </div>
    </div>
  );
}
