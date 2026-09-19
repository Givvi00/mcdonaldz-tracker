import { create } from 'zustand';
import type { McDonald, Visit, User, Achievement } from '@shared/types';
import { pickInitialCatalog, type CatalogInfo } from '@/services/catalogBoot';
import { getOrCreateUser, getVisits, addVisit, removeVisit } from '@/services/db';
import { checkAndUnlockAchievements } from '@/services/achievements';
import { distanceKm } from '@/utils/geo';
import { levelInfo } from '@/utils/foodTheme';
import { countedMcdonalds, visitedIdSet } from '@/utils/catalog';
import type { Coords, GeoStatus } from '@/hooks/useGeolocation';

interface AppStore {
  mcdonalds: McDonald[];
  /** Which restaurant list is in use: the one bundled in the app or a newer one downloaded from the site */
  catalogInfo: CatalogInfo;
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
  updateAvailable: boolean;
  /** A shower of food is playing: set by a new visit; `big` for a level up or an achievement */
  celebration: { id: number; big: boolean } | null;

  initApp: () => Promise<void>;
  toggleVisit: (mcdonaldId: string) => Promise<void>;
  dismissUnlocked: (type: Achievement['type']) => void;
  clearCelebration: () => void;
  setSelectedTab: (tab: 'home' | 'map' | 'stats' | 'profile') => void;
  setSearchQuery: (query: string) => void;
  setFilterRegion: (region: string | null) => void;
  setFilterVisited: (visited: boolean | null) => void;
  setUserPosition: (pos: Coords | null) => void;
  setLocationStatus: (status: GeoStatus) => void;
  focusOnMap: (mcdonaldId: string) => void;
  clearMapFocus: () => void;
  setUpdateAvailable: (available: boolean) => void;
  setCatalog: (restaurants: McDonald[], info: CatalogInfo) => void;
  getFilteredMcdonalds: () => McDonald[];
  isVisited: (mcdonaldId: string) => boolean;
  getVisitedCount: () => number;
  /** Denominator for the progress: open restaurants plus closed ones you visited */
  getCountedTotal: () => number;
  getRegionStats: () => Array<{ region: string; total: number; visited: number; percentage: number }>;
  getNearestMcdonalds: (limit?: number) => Array<McDonald & { distanceKm: number }>;
  getTopRegions: (limit?: number) => Array<{ region: string; total: number; visited: number; percentage: number }>;
}

const initialCatalog = pickInitialCatalog();

export const useMcdonaldStore = create<AppStore>((set, get) => ({
  mcdonalds: initialCatalog.restaurants,
  catalogInfo: initialCatalog.info,
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
  updateAvailable: false,
  celebration: null,

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
    const levelBefore = levelInfo(get().getVisitedCount()).index;

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
      const leveledUp = levelInfo(get().getVisitedCount()).index > levelBefore;
      set({ celebration: { id: Date.now(), big: unlocked.length > 0 || leveledUp } });
    }
  },

  clearCelebration: () => set({ celebration: null }),

  dismissUnlocked: (type) => set(state => ({ newlyUnlocked: state.newlyUnlocked.filter(t => t !== type) })),

  setSelectedTab: (tab) => set({ selectedTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterRegion: (region) => set({ filterRegion: region }),
  setFilterVisited: (visited) => set({ filterVisited: visited }),
  setUserPosition: (pos) => set({ userPosition: pos }),
  setLocationStatus: (status) => set({ locationStatus: status }),
  focusOnMap: (mcdonaldId) => set({ mapFocusId: mcdonaldId, selectedTab: 'map' }),
  clearMapFocus: () => set({ mapFocusId: null }),
  setUpdateAvailable: (available) => set({ updateAvailable: available }),
  setCatalog: (restaurants, info) => set({ mcdonalds: restaurants, catalogInfo: info }),

  getFilteredMcdonalds: () => {
    const { mcdonalds, searchQuery, filterRegion, filterVisited, visits } = get();
    let filtered = countedMcdonalds(mcdonalds, visits);

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
    // Only visits that match a known restaurant (open or closed), so the count can never exceed the total
    const { mcdonalds, visits } = get();
    const known = new Set(mcdonalds.map(mc => mc.id));
    return new Set(visits.map(v => v.mcdonaldId).filter(id => known.has(id))).size;
  },

  getCountedTotal: () => {
    const { mcdonalds, visits } = get();
    return countedMcdonalds(mcdonalds, visits).length;
  },

  getRegionStats: () => {
    const { mcdonalds, visits } = get();
    const visitedIds = visitedIdSet(visits);
    const regions: Record<string, { total: number; visited: number }> = {};

    for (const mc of countedMcdonalds(mcdonalds, visits)) {
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
    // Closed restaurants are never "near you": there is nothing to visit
    return mcdonalds
      .filter(mc => mc.opened)
      .map(mc => ({ ...mc, distanceKm: distanceKm(userPosition.lat, userPosition.lon, mc.lat, mc.lon) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  },

  getTopRegions: (limit = 3) => {
    return get()
      .getRegionStats()
      .sort((a, b) => b.visited - a.visited || b.percentage - a.percentage || b.total - a.total)
      .slice(0, limit);
  },
}));
