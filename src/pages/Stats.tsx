import { useEffect, useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { getAchievements } from '@/services/db';
import { getAchievementProgress } from '@/services/achievements';
import { regionRecordType, regionSummaries } from '@/services/regions';
import { FoodIcon } from '@/components/FoodIcon';
import { LevelRoadmap } from '@/components/LevelRoadmap';
import { Passport } from '@/components/Passport';
import { RegionAlbum } from '@/components/RegionAlbum';
import type { FoodIconName } from '@/utils/foodTheme';
import { FoodPattern } from '@/components/FoodPattern';
import { FoodProgressBar } from '@/components/FoodProgressBar';
import { LevelPill } from '@/components/LevelPill';
import { Receipt } from '@/components/Receipt';
import type { Achievement } from '@shared/types';

export function Stats() {
  const { user, visits, getVisitedCount, getCountedTotal, getRegionStats, mcdonalds, focusedAchievements, clearFocusedAchievement } =
    useMcdonaldStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (user) {
      getAchievements(user.id).then(setAchievements);
    }
  }, [user, visits]);

  // Arrived from an achievement toast: scroll to that achievement and highlight it for a few seconds
  useEffect(() => {
    if (focusedAchievements.length === 0) return;
    const scroll = setTimeout(() => {
      document.getElementById(`ach-${focusedAchievements[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
    const clear = setTimeout(clearFocusedAchievement, 5000);
    return () => {
      clearTimeout(scroll);
      clearTimeout(clear);
    };
  }, [focusedAchievements, clearFocusedAchievement]);

  const visitedCount = getVisitedCount();
  const regionStats = getRegionStats();
  const totalMcdonalds = getCountedTotal();
  const percentage = totalMcdonalds > 0 ? Math.round((visitedCount / totalMcdonalds) * 100) : 0;
  const progress = getAchievementProgress(mcdonalds, visits);
  const summaries = regionSummaries(mcdonalds, visits);
  const unlockedIds = new Set(achievements.map(a => a.type));
  const wasComplete = new Set(summaries.map(r => r.region).filter(r => unlockedIds.has(regionRecordType(r))));

  return (
    <div className="flex flex-col gap-6 pb-24 px-4 py-6">
      {/* Big Counter */}
      <div className="relative bg-gradient-to-br from-mc-red to-red-700 text-white rounded-3xl p-6 text-center shadow-lg shadow-red-900/20 overflow-hidden">
        <FoodPattern />
        <div className="relative">
          <p className="text-sm opacity-90 font-display font-semibold">Totale McDonald's Visitati</p>
          <p className="text-6xl font-display font-bold mt-2">{visitedCount}</p>
          <p className="text-sm opacity-90 mt-1">di {totalMcdonalds} in Italia</p>
          <p className="text-2xl font-display font-bold mt-3">{percentage}%</p>
          <FoodProgressBar percentage={percentage} />
          <LevelPill visited={visitedCount} />
        </div>
      </div>

      <Section icon="fries" title="Il tuo percorso">
        <LevelRoadmap visited={visitedCount} />
      </Section>

      <Section icon="burger" title="Passaporto">
        <Passport unlocked={unlockedIds} progress={progress} focused={focusedAchievements} />
      </Section>

      <Section icon="mcflurry" title="Regioni">
        <RegionAlbum summaries={summaries} wasComplete={wasComplete} />
        <div className="mt-5">
          <Receipt rows={regionStats} visited={visitedCount} total={totalMcdonalds} />
        </div>
      </Section>
    </div>
  );
}

function Section({ icon, title, children }: { icon: FoodIconName; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display font-semibold text-lg mb-3 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-950/50">
          <FoodIcon name={icon} size={20} />
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}
