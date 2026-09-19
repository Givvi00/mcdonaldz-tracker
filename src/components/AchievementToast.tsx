import { useEffect } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { ACHIEVEMENTS } from '@/services/achievements';

export function AchievementToast() {
  const { newlyUnlocked, dismissUnlocked } = useMcdonaldStore();
  const current = newlyUnlocked[0];

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => dismissUnlocked(current), 5500);
    return () => clearTimeout(timer);
  }, [current, dismissUnlocked]);

  if (!current) return null;
  const def = ACHIEVEMENTS[current];

  return (
    <div
      className="fixed inset-x-4 z-[3000] flex justify-center pointer-events-none"
      style={{ top: 'calc(1rem + var(--safe-top))' }}
    >
      <button
        onClick={() => dismissUnlocked(current)}
        className="pointer-events-auto flex items-center gap-3 bg-gradient-to-br from-mc-yellow to-amber-500 text-gray-900 rounded-2xl pl-3 pr-4 py-3 shadow-xl shadow-black/30 border-2 border-white/60 animate-[toast-in_0.35s_ease-out]"
      >
        <span className="text-3xl">{def.icon}</span>
        <div className="text-left">
          <p className="text-[0.65rem] font-display font-semibold uppercase tracking-wide opacity-70">
            Achievement sbloccato!
          </p>
          <p className="font-display font-bold text-sm leading-tight">{def.name}</p>
        </div>
      </button>
    </div>
  );
}
