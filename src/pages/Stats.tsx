import { useEffect, useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { getAchievements } from '@/services/db';
import { ACHIEVEMENTS, getAchievementProgress } from '@/services/achievements';
import { SodaGlass } from '@/components/SodaGlass';
import type { Achievement } from '@shared/types';

export function Stats() {
  const { user, visits, getVisitedCount, getCountedTotal, getRegionStats, mcdonalds } = useMcdonaldStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (user) {
      getAchievements(user.id).then(setAchievements);
    }
  }, [user, visits]);

  const visitedCount = getVisitedCount();
  const regionStats = getRegionStats();
  const totalMcdonalds = getCountedTotal();
  const progress = getAchievementProgress(mcdonalds, visits);

  return (
    <div className="flex flex-col gap-6 pb-24 px-4 py-6">
      {/* Big Counter */}
      <div className="relative bg-gradient-to-br from-mc-red to-red-700 text-white rounded-3xl p-6 text-center shadow-lg shadow-red-900/20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '18px 18px' }}
        />
        <div className="relative">
          <p className="text-sm opacity-90 font-display font-semibold">Totale McDonald's Visitati</p>
          <p className="text-6xl font-display font-bold mt-2">{visitedCount}</p>
          <p className="text-sm opacity-90 mt-1">di {totalMcdonalds} in Italia</p>
          <p className="text-2xl font-display font-bold mt-3">
            {totalMcdonalds > 0 ? Math.round((visitedCount / totalMcdonalds) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Punti */}
      <div className="bg-mc-yellow text-gray-800 rounded-2xl p-4 text-center shadow-sm">
        <p className="text-sm font-semibold opacity-75">Punti Totali</p>
        <p className="text-4xl font-display font-bold">{user?.totalPoints || 0}⭐</p>
      </div>

      {/* Region Stats */}
      <div>
        <h3 className="font-display font-semibold text-lg mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/50 text-sm">📈</span>
          Statistiche per Regione
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {regionStats
            .sort((a, b) => b.percentage - a.percentage || b.visited - a.visited)
            .map(stat => (
              <div
                key={stat.region}
                className="flex flex-col items-center text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-2 shadow-sm"
              >
                <div className="flex items-center justify-center" style={{ height: 105 }}>
                  <SodaGlass region={stat.region} percentage={stat.percentage} />
                </div>
                <p className="font-semibold text-[0.65rem] text-gray-800 dark:text-gray-100 truncate w-full mt-1">
                  {stat.region}
                </p>
                <p className="text-[0.6rem] font-bold text-mc-red dark:text-red-400">
                  {stat.visited}/{stat.total} · {stat.percentage}%
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="font-display font-semibold text-lg mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 dark:bg-yellow-950/50 text-sm">🏆</span>
          Achievements
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(ACHIEVEMENTS).map(ach => {
            const unlocked = achievements.some(a => a.type === ach.id);
            const p = progress[ach.id as Achievement['type']];
            const pct = Math.min(100, Math.round((p.current / p.target) * 100));
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl text-center border-2 transition-all active:scale-[0.97] ${
                  unlocked
                    ? 'bg-yellow-100 dark:bg-yellow-950/40 border-yellow-400 dark:border-yellow-700'
                    : 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700'
                }`}
              >
                <div className={`text-3xl mb-1 ${unlocked ? '' : 'grayscale opacity-50'}`}>{ach.icon}</div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{ach.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-[0.65rem]">{ach.description}</p>
                {unlocked ? (
                  <p className="text-xs text-green-600 dark:text-green-400 font-bold mt-2 text-[0.65rem]">✓ Sbloccato</p>
                ) : (
                  <div className="mt-2">
                    <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-mc-red to-red-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[0.6rem] font-bold text-gray-500 dark:text-gray-400 mt-1">
                      {p.current}/{p.target}
                      {p.label ? ` · ${p.label}` : ''}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
