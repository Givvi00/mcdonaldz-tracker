import { create } from 'zustand';
import type { McDonald, Visit, User, VisitRating } from '@shared/types';
import { pickInitialCatalog, type CatalogInfo } from '@/services/catalogBoot';
import {
  getOrCreateUser,
  getVisits,
  addVisit,
  removeVisit,
  setUserName,
  setVisitDate,
  setVisitRating,
  setVisitVerified,
  replaceVisits,
  getAchievements,
  addMissingAchievements,
  setUserNameFromServer,
  wipeAllData,
} from '@/services/db';
import { onOutboxChange, readOutbox } from '@/services/syncOutbox';
import { NameTakenError, syncOnce, type Local } from '@/services/sync';
import {
  currentAccount,
  deleteAccount as deleteOnlineAccount,
  getClient,
  hasStoredSession,
  isNameAvailable,
  signOut as signOutOnline,
  supabaseRemote,
  type Account,
} from '@/services/account';
import { checkAndUnlockAchievements } from '@/services/achievements';
import { syncDiamondRegions, syncRegionCompletions } from '@/services/regions';
import { freshFix, judgeFix, type VerifyOutcome } from '@/services/gpsCheck';
import { isOnboarded, markOnboarded } from '@/services/onboarding';
import { distanceKm } from '@/utils/geo';
import { levelInfo } from '@/utils/foodTheme';
import { countedMcdonalds, visitedIdSet } from '@/utils/catalog';
import type { Coords, GeoStatus } from '@/hooks/useGeolocation';
import { matchesStatus, type StatusValue } from '@/components/StatusFilter';

/** The outcome of a GPS check, shown for a few seconds at the bottom of the screen */
export interface VerifyNotice {
  id: number;
  mcdonaldId: string;
  outcome: VerifyOutcome;
}

/** Something worth a celebration. A visit with nothing special is a light shower; the rest have their own show. */
export type Celebration =
  | { id: number; kind: 'visit' }
  | { id: number; kind: 'level'; level: number }
  /** `diamond`: the region was already complete and now every visit in it is verified */
  | { id: number; kind: 'region'; region: string; total: number; diamond?: boolean }
  | { id: number; kind: 'stamp'; stamps: string[] };

/** The online account on this phone. null: not known yet (the app is still starting) */
export type AccountState =
  | { status: 'signed-out' }
  | {
      status: 'syncing' | 'synced' | 'offline' | 'error';
      account: Account;
      /** Last time everything was sent and received */
      lastSyncAt?: number;
      error?: string;
      /** Your name could not go online because another account has it: the Profile asks for another one */
      nameTaken?: string;
    };

/** After a change, wait this long before sending it (several taps in a row go out together) */
const SYNC_DELAY_MS = 3000;
let syncTimer: ReturnType<typeof setTimeout> | undefined;
let syncRunning: Promise<void> | null = null;
let syncAgain = false;
/** initAccount runs once (in development React starts the app twice) */
let accountStarted = false;

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
  filterVisited: StatusValue;
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
  /** A restaurant just marked visited, to ask about once its celebration is done (not a change of date or an unmark) */
  pendingRatingFor: string | null;
  /** Restaurants whose GPS check is running now */
  verifying: string[];
  verifyNotice: VerifyNotice | null;
  /** A visit you asked to remove, waiting for you to confirm (a tap by mistake must not lose it, least of all a verified one) */
  unmarkRequest: string | null;
  /**
   * The guide: 'unknown' until the visits are loaded, 'first' on a first launch (the position is asked only after it),
   * 'again' when opened from the Profile, 'signin' when only signing in is missing (the app needs an account), 'done'
   * otherwise.
   */
  onboarding: 'unknown' | 'first' | 'again' | 'signin' | 'done';
  account: AccountState | null;

  initApp: () => Promise<void>;
  renameUser: (name: string) => Promise<void>;
  toggleVisit: (mcdonaldId: string) => Promise<void>;
  /** What every "visited" button calls: marks straight away, but asks before removing a visit */
  requestToggle: (mcdonaldId: string) => void;
  cancelUnmark: () => void;
  /** Sets the day of an existing visit (a stamp is never lost by changing a date, so nothing is celebrated) */
  changeVisitDate: (mcdonaldId: string, visitedAt: number) => Promise<void>;
  /** Sets your vote for a visited restaurant (can unlock the "Critico gastronomico" stamp) */
  rateVisit: (mcdonaldId: string, rating: VisitRating) => Promise<void>;
  /**
   * Reads a fresh, precise position and, if it proves you are at the restaurant, marks its visit as verified (and
   * checks the stamps that need it). `quiet`: only a success is announced (the automatic check after marking a
   * visit from home is expected to fail, it is not worth a message).
   */
  verifyVisit: (mcdonaldId: string, options?: { quiet?: boolean }) => Promise<VerifyOutcome>;
  clearVerifyNotice: () => void;
  clearUnlocked: () => void;
  openAchievements: (types: string[]) => void;
  clearFocusedAchievement: () => void;
  openProfile: (focus?: 'name') => void;
  clearProfileFocus: () => void;
  enqueueCelebrations: (events: Celebration[]) => void;
  clearCelebration: () => void;
  clearPendingRating: () => void;
  /** Reads the account from the stored session (used by initAccount and by a sync that starts offline) */
  initAccountState: () => Promise<void>;
  /** After a sync brought something from another phone: read the data again, record stamps and regions, no fanfare */
  reloadQuietly: () => Promise<void>;
  /** The session is gone (expired, or the account deleted elsewhere): back to the sign-in screen */
  requireSignIn: () => void;
  openOnboarding: () => void;
  /** Reads the account signed in on this phone (if any), syncs, and from then on keeps syncing after every change */
  initAccount: () => Promise<void>;
  /** Right after signing in with the code */
  accountSignedIn: (account: Account) => Promise<void>;
  /** Sends and receives now (after a change, when the app comes back on screen, when the connection returns) */
  syncNow: () => Promise<void>;
  /**
   * Leaves the account: the last changes go online first (refused, with a readable error, if they cannot), then the
   * data leaves this phone and the sign-in screen comes back. Signing in again brings everything back.
   */
  signOut: () => Promise<void>;
  /** Deletes the account and everything with it, online and on this phone; the app starts again from the guide */
  deleteAccount: () => Promise<void>;
  finishOnboarding: () => void;
  setSelectedTab: (tab: 'home' | 'map' | 'stats' | 'profile') => void;
  setSearchQuery: (query: string) => void;
  setFilterRegion: (region: string | null) => void;
  setFilterVisited: (visited: StatusValue) => void;
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
  pendingRatingFor: null,
  verifying: [],
  verifyNotice: null,
  unmarkRequest: null,
  onboarding: 'unknown',
  account: null,

  initApp: async () => {
    const user = await getOrCreateUser();
    const visits = await getVisits();
    // The guide is for a first launch only: an install that already has visits has been in use for a while
    const first = !isOnboarded() && visits.length === 0;
    if (!first) markOnboarded();
    // Nobody signed in on this phone: straight to signing in (read without waiting for the account library)
    set({ user, visits, onboarding: first ? 'first' : hasStoredSession() ? 'done' : 'signin' });
    // Catch up silently on anything already earned from past sessions (no toast).
    await checkAndUnlockAchievements(user.id, get().mcdonalds, visits);
    await syncRegionCompletions(user.id, get().mcdonalds, visits);
    await syncDiamondRegions(user.id, get().mcdonalds, visits);
  },

  renameUser: async (name: string) => {
    const { user, account } = get();
    if (!user) return;
    // With an account, a name belongs to one person only. Offline it cannot be checked now: the sync checks it later.
    const signedIn = account !== null && account.status !== 'signed-out';
    if (signedIn && name.trim() && navigator.onLine !== false) {
      if (!(await isNameAvailable(name))) throw new NameTakenError(name.trim());
    }
    const updated = await setUserName(user.id, name);
    if (updated) set({ user: updated });
    const now = get().account;
    if (now && now.status !== 'signed-out' && now.nameTaken) set({ account: { ...now, nameTaken: undefined } });
  },

  toggleVisit: async (mcdonaldId: string) => {
    const { user, visits, locationStatus } = get();
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
    // In the background, with a fresh reading: if you are really there, the new visit becomes verified a moment later
    if (!isVisited && locationStatus === 'granted') void get().verifyVisit(mcdonaldId, { quiet: true });

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
      set({ pendingRatingFor: mcdonaldId });
    }
  },

  changeVisitDate: async (mcdonaldId: string, visitedAt: number) => {
    // A verified visit is proof of exactly when you were there: changing the date would defeat the point
    if (get().visits.find(v => v.mcdonaldId === mcdonaldId)?.verified) return;
    await setVisitDate(mcdonaldId, visitedAt);
    set({ visits: await getVisits() });
  },

  rateVisit: async (mcdonaldId: string, rating: VisitRating) => {
    const { user, mcdonalds } = get();
    if (!user) return;
    await setVisitRating(mcdonaldId, rating);
    const updatedVisits = await getVisits();
    set({ visits: updatedVisits });
    if (get().pendingRatingFor === mcdonaldId) set({ pendingRatingFor: null });
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

  clearPendingRating: () => set({ pendingRatingFor: null }),

  initAccountState: async () => {
    try {
      const account = await currentAccount();
      set({ account: account ? { status: 'synced', account } : { status: 'signed-out' } });
      if (!account) get().requireSignIn();
    } catch {
      // Offline and the library not downloaded yet: the next sync (when the connection comes back) tries again
      set({ account: null });
    }
  },

  requireSignIn: () => {
    if (get().onboarding === 'done') set({ onboarding: 'signin' });
  },

  reloadQuietly: async () => {
    const user = await getOrCreateUser();
    const visits = await getVisits();
    set({ user, visits });
    const { mcdonalds } = get();
    await checkAndUnlockAchievements(user.id, mcdonalds, visits);
    await syncRegionCompletions(user.id, mcdonalds, visits);
    await syncDiamondRegions(user.id, mcdonalds, visits);
  },

  openOnboarding: () => set({ onboarding: 'again' }),

  initAccount: async () => {
    if (accountStarted) return;
    accountStarted = true;
    // Nobody ever signed in here: nothing to load (the library is downloaded only when it is needed)
    if (hasStoredSession()) await get().initAccountState();
    else set({ account: { status: 'signed-out' } });
    onOutboxChange(() => {
      if (get().account?.status === 'signed-out') return;
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => void get().syncNow(), SYNC_DELAY_MS);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void get().syncNow();
    });
    window.addEventListener('online', () => void get().syncNow());
    await get().syncNow();
  },

  accountSignedIn: async (account) => {
    set({ account: { status: 'synced', account } });
    await get().syncNow();
  },

  syncNow: async () => {
    if (syncRunning) {
      syncAgain = true;
      return syncRunning;
    }
    syncRunning = (async () => {
      do {
        syncAgain = false;
        let state = get().account;
        const { user } = get();
        if (state === null && hasStoredSession()) {
          // Could not read the account at startup (offline): try now
          await get().initAccountState();
          state = get().account;
        }
        if (!state || state.status === 'signed-out' || !user) return;
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          set({ account: { ...state, status: 'offline' } });
          return;
        }
        set({ account: { ...state, status: 'syncing', error: undefined } });
        try {
          const client = await getClient();
          const local: Local = {
            getVisits,
            replaceVisits,
            getAchievements: () => getAchievements(user.id),
            addMissingAchievements: earned => addMissingAchievements(user.id, earned),
            getName: async () => get().user?.name,
            setNameFromServer: name => setUserNameFromServer(user.id, name),
          };
          const result = await syncOnce(supabaseRemote(client, state.account.id), local, state.account.id);
          if (result.changedHere) await get().reloadQuietly();
          // A name refused online stays to be fixed until you choose a new one
          const before = get().account;
          const stillTaken = before && before.status !== 'signed-out' && !get().user?.name ? before.nameTaken : undefined;
          set({
            account: { status: 'synced', account: state.account, lastSyncAt: Date.now(), nameTaken: result.nameTaken ?? stillTaken },
          });
        } catch (error) {
          const message = (error as Error).message ?? '';
          // The session is no longer valid (account deleted, or signed out everywhere)
          const expired = /jwt|refresh token|not authenticated|401/i.test(message);
          if (expired) get().requireSignIn();
          set({
            account: expired
              ? { status: 'signed-out' }
              : { status: navigator.onLine === false ? 'offline' : 'error', account: state.account, lastSyncAt: state.lastSyncAt, error: message, nameTaken: state.nameTaken },
          });
        }
      } while (syncAgain);
    })().finally(() => {
      syncRunning = null;
    });
    return syncRunning;
  },

  signOut: async () => {
    await get().syncNow();
    if (Object.keys(readOutbox()).length > 0) {
      throw new Error('Alcune modifiche non sono ancora salvate: collegati a internet e riprova.');
    }
    await signOutOnline().catch(() => {}); // the session is removed from the phone below anyway
    await wipeAllData();
    markOnboarded(); // back to signing in, not to the whole guide
    window.location.reload();
  },

  deleteAccount: async () => {
    await deleteOnlineAccount();
    await wipeAllData();
    window.location.reload();
  },

  finishOnboarding: () => {
    markOnboarded();
    set({ onboarding: 'done' });
  },

  requestToggle: (mcdonaldId: string) => {
    if (get().visits.some(v => v.mcdonaldId === mcdonaldId)) set({ unmarkRequest: mcdonaldId });
    else void get().toggleVisit(mcdonaldId);
  },

  cancelUnmark: () => set({ unmarkRequest: null }),

  verifyVisit: async (mcdonaldId, options = {}) => {
    const { user, mcdonalds, visits, verifying } = get();
    const mc = mcdonalds.find(m => m.id === mcdonaldId);
    const visit = visits.find(v => v.mcdonaldId === mcdonaldId);
    if (!user || !mc || !visit) return { result: 'unavailable' };
    if (visit.verified) return { result: 'ok' };
    if (verifying.includes(mcdonaldId)) return { result: 'unavailable' };

    set(state => ({ verifying: [...state.verifying, mcdonaldId] }));
    const fix = await freshFix(mc);
    const outcome = judgeFix(fix, mc);
    // The visit may have been undone while waiting for the reading
    const stillVisited = get().visits.some(v => v.mcdonaldId === mcdonaldId);

    if (outcome.result === 'ok' && stillVisited) {
      await setVisitVerified(mcdonaldId, Date.now());
      const updatedVisits = await getVisits();
      set({ visits: updatedVisits });
      const unlocked = await checkAndUnlockAchievements(user.id, get().mcdonalds, updatedVisits);
      const diamond = await syncDiamondRegions(user.id, get().mcdonalds, updatedVisits, mc.region);
      const now = Date.now();
      const events: Celebration[] = [];
      if (diamond) events.push({ id: now, kind: 'region', region: diamond.region, total: diamond.verifiable ?? diamond.total, diamond: true });
      if (unlocked.length > 0) events.push({ id: now + 1, kind: 'stamp', stamps: unlocked });
      if (events.length > 0) get().enqueueCelebrations(events);
    }
    set(state => ({ verifying: state.verifying.filter(id => id !== mcdonaldId) }));
    if (stillVisited && (!options.quiet || outcome.result === 'ok')) {
      set({ verifyNotice: { id: Date.now(), mcdonaldId, outcome } });
    }
    return outcome;
  },

  clearVerifyNotice: () => set({ verifyNotice: null }),

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
      const byId = new Map(visits.map(v => [v.mcdonaldId, v]));
      filtered = filtered.filter(mc => matchesStatus(filterVisited, byId.get(mc.id)));
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
