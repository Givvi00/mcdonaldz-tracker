import { create } from 'zustand';
import type { McDonald, Visit, User, VisitRating } from '@shared/types';
import { pickInitialCatalog, type CatalogInfo } from '@/services/catalogBoot';
import { getOrCreateUser, getVisits, addVisit, removeVisit, setUserName, setVisitDate, setVisitRating } from '@/services/db';
import { checkAndUnlockAchievements } from '@/services/achievements';
import { syncRegionCompletions } from '@/services/regions';
import { distanceKm } from '@/utils/geo';
import { levelInfo } from '@/utils/foodTheme';
import { countedMcdonalds, visitedIdSet } from '@/utils/catalog';
import type { Coords, GeoStatus } from '@/hooks/useGeolocation';

/** Something worth a celebration. A visit with nothing special is a light shower; the rest have their own show. */
export type Celebration =
  | { id: number; kind: 'visit' }
  | { id: number; kind: 'level'; level: number }
  | { id: number; kind: 'region'; region: string; total: number }
  | { id: number; kind: 'stamp'; stamps: string[] };

/** Pause between two celebrations that follow each other */
const GAP_MS = 700;

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
  /** Stamps shown in the toast at the top */
  newlyUnlocked: string[];
  /** Stamps to show in the passport after tapping the toast (all of them, when there are several) */
  focusedAchievements: string[];
  mapFocusId: string | null;
  /** What to jump to when the profile opens ("name": the name field) */
  profileFocus: 'name' | null;
  updateAvailable: boolean;
  /** The celebration playing now, and the ones waiting for their turn (level, then region, then stamps) */
  celebration: Celebration | null;
  celebrationQueue: Celebration[];

  initApp: () => Promise<void>;
  renameUser: (name: string) => Promise<void>;
  toggleVisit: (mcdonaldId: string) => Promise<void>;
  /** Sets the day of an existing visit (a stamp is never lost by changing a date, so nothing is celebrated) */
  changeVisitDate: (mcdonaldId: string, visitedAt: number) => Promise<void>;
  /** Sets your vote for a visited restaurant (can unlock the "Critico gastronomico" stamp) */
  rateVisit: (mcdonaldId: string, rating: VisitRating) => Promise<void>;
  clearUnlocked: () => void;
  openAchievements: (types: string[]) => void;
  clearFocusedAchievement: () => void;
  openProfile: (focus?: 'name') => void;
  clearProfileFocus: () => void;
  enqueueCelebrations: (events: Celebration[]) => void;
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
  focusedAchievements: [],
  mapFocusId: null,
  profileFocus: null,
  updateAvailable: false,
  celebration: null,
  celebrationQueue: [],

  initApp: async () => {
    const user = await getOrCreateUser();
    const visits = await getVisits();
    set({ user, visits });
    // Catch up silently on anything already earned from past sessions (no toast).
    await checkAndUnlockAchievements(user.id, get().mcdonalds, visits);
    await syncRegionCompletions(user.id, get().mcdonalds, visits);
  },

  renameUser: async (name: string) => {
    const { user } = get();
    if (!user) return;
    const updated = await setUserName(user.id, name);
    if (updated) set({ user: updated });
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
      const mcdonalds = get().mcdonalds;
      const unlocked = await checkAndUnlockAchievements(user.id, mcdonalds, updatedVisits);
      const touched = mcdonalds.find(m => m.id === mcdonaldId);
      const newRegion = touched ? await syncRegionCompletions(user.id, mcdonalds, updatedVisits, touched.region) : null;
      const levelNow = levelInfo(get().getVisitedCount());

      // In order of importance: the level, the region, then the stamps
      const now = Date.now();
      const events: Celebration[] = [];
      if (levelNow.index > levelBefore) events.push({ id: now, kind: 'level', level: levelNow.number });
      if (newRegion) events.push({ id: now + 1, kind: 'region', region: newRegion.region, total: newRegion.total });
      if (unlocked.length > 0) events.push({ id: now + 2, kind: 'stamp', stamps: unlocked });
      if (events.length === 0) events.push({ id: now, kind: 'visit' });
      get().enqueueCelebrations(events);
    }
  },

  changeVisitDate: async (mcdonaldId: string, visitedAt: number) => {
    await setVisitDate(mcdonaldId, visitedAt);
    set({ visits: await getVisits() });
  },

  rateVisit: async (mcdonaldId: string, rating: VisitRating) => {
    const { user, mcdonalds } = get();
    if (!user) return;
    await setVisitRating(mcdonaldId, rating);
    const updatedVisits = await getVisits();
    set({ visits: updatedVisits });
    const unlocked = await checkAndUnlockAchievements(user.id, mcdonalds, updatedVisits);
    if (unlocked.length > 0) get().enqueueCelebrations([{ id: Date.now(), kind: 'stamp', stamps: unlocked }]);
  },

  enqueueCelebrations: (events) => {
    const { celebration } = get();
    if (celebration) {
      set(state => ({ celebrationQueue: [...state.celebrationQueue, ...events] }));
      return;
    }
    const [first, ...rest] = events;
    set(state => ({
      celebration: first,
      celebrationQueue: [...state.celebrationQueue, ...rest],
      newlyUnlocked: first.kind === 'stamp' ? first.stamps : state.newlyUnlocked,
    }));
  },

  clearCelebration: () => {
    set({ celebration: null });
    if (get().celebrationQueue.length === 0) return;
    // A short pause, then the next one
    setTimeout(() => {
      const [next, ...rest] = get().celebrationQueue;
      if (!next || get().celebration) return;
      set(state => ({
        celebration: next,
        celebrationQueue: rest,
        newlyUnlocked: next.kind === 'stamp' ? next.stamps : state.newlyUnlocked,
      }));
    }, GAP_MS);
  },

  clearUnlocked: () => set({ newlyUnlocked: [] }),

  openAchievements: (types) => set({ newlyUnlocked: [], celebration: null, selectedTab: 'stats', focusedAchievements: types }),

  clearFocusedAchievement: () => set({ focusedAchievements: [] }),

  openProfile: (focus) => set({ selectedTab: 'profile', profileFocus: focus ?? null }),

  clearProfileFocus: () => set({ profileFocus: null }),

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
