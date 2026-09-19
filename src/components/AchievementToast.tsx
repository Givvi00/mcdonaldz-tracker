import { useEffect } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { ACHIEVEMENTS } from '@/services/achievements';

const SHOW_FOR_MS = 10000;

/** "Achievement unlocked": big enough to read, stays 10 seconds, and a tap opens that achievement in Stats. */
export function AchievementToast() {
  const { newlyUnlocked, dismissUnlocked, openAchievement } = useMcdonaldStore();
  const current = newlyUnlocked[0];

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => dismissUnlocked(current), SHOW_FOR_MS);
    return () => clearTimeout(timer);
  }, [current, dismissUnlocked]);

  if (!current) return null;
  const def = ACHIEVEMENTS[current];
  const waiting = newlyUnlocked.length - 1;

  return (
    <div
      className="fixed inset-x-3 z-[3000] flex justify-center pointer-events-none"
      style={{ top: 'calc(0.75rem + var(--safe-top))' }}
    >
      <div className="relative w-full max-w-md pointer-events-auto animate-[toast-in_0.35s_ease-out]">
        <button
          onClick={() => openAchievement(current)}
          className="w-full flex items-center gap-4 bg-gradient-to-br from-mc-yellow to-amber-500 text-gray-900 rounded-3xl pl-4 pr-10 py-4 shadow-2xl shadow-black/40 border-2 border-white/70 text-left active:scale-[0.98] transition-transform"
        >
          <span className="text-5xl leading-none">{def.icon}</span>
          <div className="min-w-0">
            <p className="text-xs font-display font-semibold uppercase tracking-wide opacity-70">Achievement sbloccato!</p>
            <p className="font-display font-bold text-xl leading-tight">{def.name}</p>
            <p className="text-sm leading-snug opacity-80 mt-0.5">{def.description}</p>
            <p className="text-xs font-semibold mt-1.5 opacity-70">Tocca per vederlo ›</p>
            {waiting > 0 && <p className="text-xs font-semibold opacity-70">+{waiting} in arrivo</p>}
          </div>
        </button>
        <button
          onClick={() => dismissUnlocked(current)}
          aria-label="Chiudi"
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/10 text-gray-800 text-sm font-bold active:scale-95 transition-transform"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
