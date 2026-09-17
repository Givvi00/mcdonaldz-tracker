import { create } from 'zustand';
import type { McDonald, Visit, User, Achievement } from '@shared/types';
import mcdonaldsData from '@shared/data/mcdonalds.json';
import { getOrCreateUser, getVisits, addVisit, removeVisit } from '@/services/db';
import { checkAndUnlockAchievements } from '@/services/achievements';
import { distanceKm } from '@/utils/geo';
import type { Coords, GeoStatus } from '@/hooks/useGeolocation';

interface AppStore {
  mcdonalds: McDonald[];
  visits: Visit[];
  user: User | null;
  selectedTab: 'home' | 'map' | 'stats' | 'profile';
  searchQuery: string;
  filterRegion: string | null;
  filterVisited: boolean | null;
  userPosition: Coords | null;
  locationStatus: GeoStatus;
  newlyUnlocked: Achievement['type'][];
  mapFocusId: string | null;

  initApp: () => Promise<void>;
  toggleVisit: (mcdonaldId: string) => Promise<void>;
  dismissUnlocked: (type: Achievement['type']) => void;
  setSelectedTab: (tab: 'home' | 'map' | 'stats' | 'profile') => void;
  setSearchQuery: (query: string) => void;
  setFilterRegion: (region: string | null) => void;
  setFilterVisited: (visited: boolean | null) => void;
  setUserPosition: (pos: Coords | null) => void;
  setLocationStatus: (status: GeoStatus) => void;
  focusOnMap: (mcdonaldId: string) => void;
  clearMapFocus: () => void;
  getFilteredMcdonalds: () => McDonald[];
  isVisited: (mcdonaldId: string) => boolean;
  getVisitedCount: () => number;
  getRegionStats: () => Array<{ region: string; total: number; visited: number; percentage: number }>;
  getNearestMcdonalds: (limit?: number) => Array<McDonald & { distanceKm: number }>;
  getNearestUnvisited: () => (McDonald & { distanceKm: number }) | null;
  getTopRegions: (limit?: number) => Array<{ region: string; total: number; visited: number; percentage: number }>;
}

export const useMcdonaldStore = create<AppStore>((set, get) => ({
  mcdonalds: mcdonaldsData,
  visits: [],
  user: null,
  selectedTab: 'home',
  searchQuery: '',
  filterRegion: null,
  filterVisited: null,
  userPosition: null,
  locationStatus: 'idle',
  newlyUnlocked: [],
  mapFocusId: null,

  initApp: async () => {
    const user = await getOrCreateUser();
    const visits = await getVisits();
    set({ user, visits });
    // Catch up silently on anything already earned from past sessions (no toast).
    await checkAndUnlockAchievements(user.id, get().mcdonalds, visits);
  },

  toggleVisit: async (mcdonaldId: string) => {
    const { user, visits } = get();
    if (!user) return;

    const isVisited = visits.some(v => v.mcdonaldId === mcdonaldId);

    if (isVisited) {
      await removeVisit(mcdonaldId, user.id);
    } else {
      await addVisit(mcdonaldId, user.id);
    }

    const updatedVisits = await getVisits();
    set({ visits: updatedVisits });

    if (!isVisited) {
      const unlocked = await checkAndUnlockAchievements(user.id, get().mcdonalds, updatedVisits);
      if (unlocked.length > 0) {
        set(state => ({ newlyUnlocked: [...state.newlyUnlocked, ...unlocked] }));
      }
    }
  },

  dismissUnlocked: (type) => set(state => ({ newlyUnlocked: state.newlyUnlocked.filter(t => t !== type) })),

  setSelectedTab: (tab) => set({ selectedTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterRegion: (region) => set({ filterRegion: region }),
  setFilterVisited: (visited) => set({ filterVisited: visited }),
  setUserPosition: (pos) => set({ userPosition: pos }),
  setLocationStatus: (status) => set({ locationStatus: status }),
  focusOnMap: (mcdonaldId) => set({ mapFocusId: mcdonaldId, selectedTab: 'map' }),
  clearMapFocus: () => set({ mapFocusId: null }),

  getFilteredMcdonalds: () => {
    const { mcdonalds, searchQuery, filterRegion, filterVisited, visits } = get();
    let filtered = mcdonalds;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        mc => mc.name.toLowerCase().includes(q) || mc.city.toLowerCase().includes(q)
      );
    }

    if (filterRegion) {
      filtered = filtered.filter(mc => mc.region === filterRegion);
    }

    if (filterVisited !== null) {
      const visitedIds = new Set(visits.map(v => v.mcdonaldId));
      if (filterVisited) {
        filtered = filtered.filter(mc => visitedIds.has(mc.id));
      } else {
        filtered = filtered.filter(mc => !visitedIds.has(mc.id));
      }
    }

    return filtered;
  },

  isVisited: (mcdonaldId: string) => {
    const { visits } = get();
    return visits.some(v => v.mcdonaldId === mcdonaldId);
  },

  getVisitedCount: () => {
    const { visits } = get();
    return visits.length;
  },

  getRegionStats: () => {
    const { mcdonalds, visits } = get();
    const visitedIds = new Set(visits.map(v => v.mcdonaldId));
    const regions: Record<string, { total: number; visited: number }> = {};

    for (const mc of mcdonalds) {
      if (!regions[mc.region]) {
        regions[mc.region] = { total: 0, visited: 0 };
      }
      regions[mc.region].total += 1;
      if (visitedIds.has(mc.id)) {
        regions[mc.region].visited += 1;
      }
    }

    return Object.entries(regions).map(([region, stats]) => ({
      region,
      total: stats.total,
      visited: stats.visited,
      percentage: Math.round((stats.visited / stats.total) * 100),
    }));
  },

  getNearestMcdonalds: (limit = 6) => {
    const { mcdonalds, userPosition } = get();
    if (!userPosition) return [];
    return mcdonalds
      .map(mc => ({ ...mc, distanceKm: distanceKm(userPosition.lat, userPosition.lon, mc.lat, mc.lon) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  },

  getNearestUnvisited: () => {
    const { mcdonalds, userPosition, visits } = get();
    if (!userPosition) return null;
    const visitedIds = new Set(visits.map(v => v.mcdonaldId));
    const nearest = mcdonalds
      .filter(mc => !visitedIds.has(mc.id))
      .map(mc => ({ ...mc, distanceKm: distanceKm(userPosition.lat, userPosition.lon, mc.lat, mc.lon) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
    return nearest ?? null;
  },

  getTopRegions: (limit = 3) => {
    return get()
      .getRegionStats()
      .sort((a, b) => b.visited - a.visited || b.percentage - a.percentage || b.total - a.total)
      .slice(0, limit);
  },
}));
