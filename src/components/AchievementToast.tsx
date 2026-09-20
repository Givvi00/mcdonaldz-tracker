import { useEffect, useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { ACHIEVEMENTS } from '@/services/achievements';
import { Stamp } from '@/components/Stamp';

const SHOW_FOR_MS = 10000;
const FADE_MS = 500;
const SHOWN = 3;

/** "Stamp unlocked": one toast for all the stamps of a visit, stays 10 seconds; a tap opens them in the passport. */
export function AchievementToast() {
  const { newlyUnlocked, clearUnlocked, openAchievements } = useMcdonaldStore();
  const defs = newlyUnlocked.map(id => ACHIEVEMENTS[id]).filter(Boolean);
  const key = newlyUnlocked.join(',');

  const [leaving, setLeaving] = useState(false);

  // The toast fades out before it goes, whether it times out or is closed
  useEffect(() => {
    if (!key) return;
    setLeaving(false);
    const fade = setTimeout(() => setLeaving(true), SHOW_FOR_MS - FADE_MS);
    const done = setTimeout(clearUnlocked, SHOW_FOR_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [key, clearUnlocked]);

  const close = () => {
    setLeaving(true);
    setTimeout(clearUnlocked, FADE_MS);
  };

  if (defs.length === 0) return null;
  const single = defs.length === 1 ? defs[0] : null;
  const secret = defs.some(d => d.secret);

  return (
    <div
      className="fixed inset-x-3 z-[3000] flex justify-center pointer-events-none"
      style={{ top: 'calc(0.75rem + var(--safe-top))' }}
    >
      <div
        className="relative w-full max-w-md pointer-events-auto"
        style={{ animation: leaving ? `toast-out ${FADE_MS}ms ease-in forwards` : 'toast-in 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) both' }}
      >
        <button
          onClick={() => openAchievements(newlyUnlocked)}
          className="w-full flex items-center gap-4 bg-gradient-to-br from-mc-yellow to-amber-500 text-gray-900 rounded-3xl pl-4 pr-10 py-4 shadow-2xl shadow-black/40 border-2 border-white/70 text-left active:scale-[0.98] transition-transform"
        >
          {single ? (
            <Stamp def={single} state="got" size={72} className="flex-none" />
          ) : (
            <div className="flex flex-none -space-x-5">
              {defs.slice(0, SHOWN).map(d => (
                <Stamp key={d.id} def={d} state="got" size={58} />
              ))}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-display font-semibold uppercase tracking-wide opacity-70">
              {single
                ? single.secret
                  ? 'Timbro segreto scoperto!'
                  : 'Timbro sbloccato!'
                : `${defs.length} timbri sbloccati${secret ? ' (anche un segreto!)' : '!'}`}
            </p>
            <p className="font-display font-bold text-xl leading-tight">
              {single ? single.name : defs.map(d => d.name).join(', ')}
            </p>
            {single && <p className="text-sm leading-snug opacity-80 mt-0.5">{single.description}</p>}
            <p className="text-xs font-semibold mt-1.5 opacity-70">
              {single ? 'Tocca per vederlo nel passaporto ›' : 'Tocca per vederli nel passaporto ›'}
            </p>
          </div>
        </button>
        <button
          onClick={close}
          aria-label="Chiudi"
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/10 text-gray-800 text-sm font-bold active:scale-95 transition-transform"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
