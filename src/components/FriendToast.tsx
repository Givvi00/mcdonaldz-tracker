import { useEffect } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';

const SHOW_MS = 6000;

/** "Hai superato Marco!": you went ahead of a friend on the leaderboard. Tapping it opens Amici */
export function FriendToast() {
  const toast = useMcdonaldStore(state => state.friendToast);
  const clear = useMcdonaldStore(state => state.clearFriendToast);
  const setSelectedTab = useMcdonaldStore(state => state.setSelectedTab);
  // A stamp or a celebration matters more at that moment: this one waits for the next check
  const busy = useMcdonaldStore(state => state.newlyUnlocked.length > 0 || state.celebration !== null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, SHOW_MS);
    return () => clearTimeout(t);
  }, [toast, clear]);

  if (!toast || busy) return null;

  return (
    <button
      role="status"
      onClick={() => {
        clear();
        setSelectedTab('friends');
      }}
      className="fixed inset-x-3 z-[2800] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-mc-yellow px-4 py-3 text-left text-gray-800 shadow-lg shadow-black/25 animate-[toast-in_0.35s_ease-out]"
      style={{ top: 'calc(0.75rem + var(--safe-top))' }}
    >
      <span className="text-3xl">🏆</span>
      <span className="min-w-0">
        <span className="block font-display text-base font-bold leading-tight">Hai superato {toast.name}!</span>
        <span className="mt-0.5 block text-xs opacity-80">
          {toast.place > 0 ? `Ora sei ${toast.place}° in classifica · ` : ''}Tocca per vedere
        </span>
      </span>
    </button>
  );
}
