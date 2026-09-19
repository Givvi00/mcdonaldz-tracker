import type { McDonald, Visit, Achievement } from '@shared/types';
import { getAchievements, addAchievement } from './db';
import { countedMcdonalds } from '@/utils/catalog';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Record<Achievement['type'], AchievementDef> = {
  LOCAL_HERO: {
    id: 'LOCAL_HERO',
    name: 'Local Hero',
    description: "Visita 5 McDonald's nella stessa regione",
    icon: '🦸',
  },
  REGIONAL_MASTER: {
    id: 'REGIONAL_MASTER',
    name: 'Regional Master',
    description: "Completa tutti i McDonald's di una regione",
    icon: '👑',
  },
  NATION_CONQUEROR: {
    id: 'NATION_CONQUEROR',
    name: 'Nation Conqueror',
    description: "Visita almeno un McDonald's in ogni regione d'Italia",
    icon: '🌍',
  },
  STREAK_7: {
    id: 'STREAK_7',
    name: '7 Day Streak',
    description: 'Visita un McDonald\'s per 7 giorni consecutivi',
    icon: '🔥',
  },
  STREAK_30: {
    id: 'STREAK_30',
    name: '30 Day Streak',
    description: 'Visita un McDonald\'s per 30 giorni consecutivi',
    icon: '💥',
  },
};

export interface AchievementProgress {
  current: number;
  target: number;
  label?: string;
}

function longestActiveStreak(visits: Visit[]): number {
  if (visits.length === 0) return 0;

  const DAY = 24 * 60 * 60 * 1000;
  const days = [...new Set(visits.map(v => new Date(v.visitedAt).setHours(0, 0, 0, 0)))].sort((a, b) => a - b);

  let longest = 1;
  let current = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] - days[i - 1] === DAY) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

export function getAchievementProgress(
  mcdonalds: McDonald[],
  visits: Visit[]
): Record<Achievement['type'], AchievementProgress> {
  const visitedIds = new Set(visits.map(v => v.mcdonaldId));
  const visitedByRegion: Record<string, number> = {};
  const totalByRegion: Record<string, number> = {};
  // Open restaurants plus closed ones you visited: a closure never undoes a regional completion
  const counted = countedMcdonalds(mcdonalds, visits);

  for (const mc of counted) {
    totalByRegion[mc.region] = (totalByRegion[mc.region] || 0) + 1;
    if (visitedIds.has(mc.id)) {
      visitedByRegion[mc.region] = (visitedByRegion[mc.region] || 0) + 1;
    }
  }

  let topRegion = { region: '', count: 0 };
  let bestPartial = { region: '', current: 0, target: 1 };
  let anyRegionComplete = false;

  for (const [region, count] of Object.entries(visitedByRegion)) {
    const total = totalByRegion[region];
    if (count > topRegion.count) topRegion = { region, count };
    if (count === total) anyRegionComplete = true;
    if (count / total > bestPartial.current / bestPartial.target) {
      bestPartial = { region, current: count, target: total };
    }
  }

  const totalRegions = new Set(counted.map(m => m.region)).size;
  const streak = longestActiveStreak(visits);

  return {
    LOCAL_HERO: {
      current: Math.min(topRegion.count, 5),
      target: 5,
      label: topRegion.region || undefined,
    },
    REGIONAL_MASTER: anyRegionComplete
      ? { current: bestPartial.target, target: bestPartial.target, label: bestPartial.region }
      : { current: bestPartial.current, target: bestPartial.target, label: bestPartial.region || undefined },
    NATION_CONQUEROR: {
      current: Object.keys(visitedByRegion).length,
      target: totalRegions,
    },
    STREAK_7: { current: Math.min(streak, 7), target: 7 },
    STREAK_30: { current: Math.min(streak, 30), target: 30 },
  };
}

export async function checkAndUnlockAchievements(
  userId: string,
  mcdonalds: McDonald[],
  visits: Visit[]
): Promise<Achievement['type'][]> {
  const unlocked: Achievement['type'][] = [];
  const existing = await getAchievements(userId);
  const existingIds = new Set(existing.map(a => a.type));
  const progress = getAchievementProgress(mcdonalds, visits);

  for (const type of Object.keys(progress) as Achievement['type'][]) {
    if (existingIds.has(type)) continue;
    const { current, target } = progress[type];
    if (current >= target) {
      unlocked.push(type);
      await addAchievement({
        id: `ach_${Date.now()}_${type}`,
        userId,
        type,
        unlockedAt: Date.now(),
      });
    }
  }

  return unlocked;
}
