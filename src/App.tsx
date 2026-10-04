import { Suspense, lazy, useEffect, useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { useTheme } from '@/hooks/useTheme';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Home } from '@/pages/Home';
// The map (Leaflet is about half of the app) and Stats are loaded apart, so Home appears sooner. They are fetched
// anyway right after startup (see below): opening them is then immediate, and they are cached for offline use.
const loadMap = () => import('@/components/MapView');
const loadStats = () => import('@/pages/Stats');
const MapView = lazy(() => loadMap().then(m => ({ default: m.MapView })));
const Stats = lazy(() => loadStats().then(m => ({ default: m.Stats })));
const loadFriendsPage = () => import('@/pages/Friends');
const Friends = lazy(() => loadFriendsPage().then(m => ({ default: m.Friends })));
import { Profile } from '@/pages/Profile';
import { AchievementToast } from '@/components/AchievementToast';
import { NearbyPrompt } from '@/components/NearbyPrompt';
import { levelInfo } from '@/utils/foodTheme';
import { UpdateBanner } from '@/components/UpdateBanner';
import { MapAppChooser } from '@/components/MapAppChooser';
import { FoodRain } from '@/components/FoodRain';
import { AutoRatingPrompt } from '@/components/AutoRatingPrompt';
import { VerifyToast } from '@/components/VerifyToast';
import { FriendToast } from '@/components/FriendToast';
import { WhatsNew } from '@/components/WhatsNew';
import { CheckinToast } from '@/components/CheckinToast';
import { PasswordGate } from '@/components/PasswordGate';
import { UnmarkConfirm } from '@/components/UnmarkConfirm';
import { Onboarding } from '@/components/Onboarding';
import { CelebrationLab } from '@/components/CelebrationLab';
import { FoodIconSprite } from '@/components/FoodIcon';
import { startUpdateChecks } from '@/services/updates';
import { startCatalogRefresh } from '@/services/catalogRefresh';
import { requestPersistentStorage } from '@/services/storagePersist';
import { AccessReview, reviewLink } from '@/components/AccessReview';
import { forgetInvite } from '@/services/inviteLink';
import { Icon, type IconName } from '@/components/ui/Icon';
import { LevelGlyph } from '@/components/ui/LevelIcon';
import './App.css';

function App() {
  // Opened from the link in a "vuole entrare" email: the answer comes before anything else
  const [review, setReview] = useState(reviewLink);
  const { selectedTab, setSelectedTab, openStats, unseen, friendNews, initApp, initAccount, getVisitedCount, setUserPosition, setLocationStatus, user, openProfile, onboarding, autoCheckin, visits, account } =
    useMcdonaldStore();
  useTheme();
  // On a first launch the browser asks for the position only after the guide has said what it is for
  const { status: geoStatus, coords } = useGeolocation(onboarding === 'done' || onboarding === 'again');

  useEffect(() => {
    // The account after the local data: a sync needs the user of this phone
    void initApp().then(initAccount);
  }, []);

  useEffect(() => {
    const preload = () => void Promise.all([loadMap(), loadStats()]).catch(() => {
      // offline before they were ever fetched: they load when opened
    });
    const idle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 1500));
    idle(preload);
  }, []);

  useEffect(() => startUpdateChecks(), []);
  useEffect(() => startCatalogRefresh(), []);
  useEffect(() => {
    void requestPersistentStorage();
  }, []);

  useEffect(() => {
    setLocationStatus(geoStatus);
    setUserPosition(coords);
  }, [geoStatus, coords, setLocationStatus, setUserPosition]);

  // Signed in: an invite opened on this phone is no longer needed
  const signedIn = account?.status !== undefined && account.status !== 'signed-out';
  useEffect(() => {
    if (signedIn) forgetInvite();
  }, [signedIn]);

  // Back at a restaurant you already visited: counted by itself (at most once every 4 hours, see utils/checkins)
  useEffect(() => {
    if (coords && user) void autoCheckin();
  }, [coords, user, visits.length, onboarding, autoCheckin]);

  const NAV_ITEMS: Array<{ tab: 'home' | 'map' | 'stats' | 'friends'; icon: IconName; label: string }> = [
    { tab: 'home', icon: 'home', label: 'Home' },
    { tab: 'map', icon: 'map', label: 'Mappa' },
    { tab: 'stats', icon: 'stats', label: 'Stats' },
    { tab: 'friends', icon: 'users', label: 'Amici' },
  ];
  const level = levelInfo(getVisitedCount());

  return (
    <div className="fixed inset-0 flex flex-col bg-mz-bg text-mz-text transition-colors">
      {review && (
        <AccessReview
          id={review.id}
          token={review.token}
          onClose={() => {
            window.history.replaceState(null, '', window.location.pathname);
            setReview(null);
          }}
        />
      )}
      <AchievementToast />
      <NearbyPrompt />
      <UpdateBanner />
      <MapAppChooser />
      <FoodIconSprite />
      <FoodRain />
      <AutoRatingPrompt />
      <VerifyToast />
      <FriendToast />
      <WhatsNew />
      <CheckinToast />
      <UnmarkConfirm />
      <Onboarding />
      <PasswordGate />
      {import.meta.env.DEV && <CelebrationLab />}

      {/* Wordmark header: red, with the way to the profile (who you are, your level) */}
      {selectedTab !== 'map' && (
        <header
          className="flex flex-none items-center justify-between gap-3 bg-mz-red px-5 pb-3.5 text-white"
          style={{ paddingTop: 'max(var(--safe-top), 16px)' }}
        >
          <div className="flex flex-col gap-[5px]">
            <span className="font-display text-2xl font-bold leading-none tracking-[-0.01em]">
              McDonaldz<span className="text-mz-yellow">.</span>
            </span>
            <span className="text-[11px] font-bold tracking-[0.16em] text-[#FFE9E4]">TRACKER</span>
          </div>
          <button
            onClick={() => openProfile(user?.name ? undefined : 'name')}
            aria-label={user?.name ? `Profilo di ${user.name}, Livello ${level.number}` : 'Apri il profilo e scegli il tuo nome'}
            className="flex min-h-[44px] min-w-0 max-w-[60%] items-center gap-2.5 rounded-3xl bg-black/30 py-1 pl-1.5 pr-4 transition-transform active:scale-95"
          >
            <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-mz-yellow text-[#4A2B00]">
              <LevelGlyph index={level.index} size={20} />
            </span>
            <span className="flex min-w-0 flex-col text-left leading-[1.15]">
              <span className="truncate text-xs text-[#FFE9E4]">{user?.name ?? 'Come ti chiami?'}</span>
              <span className="font-display text-base font-semibold">Livello {level.number}</span>
            </span>
          </button>
        </header>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {selectedTab === 'home' && <Home />}
        <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">Un attimo…</div>}>
          {selectedTab === 'map' && <MapView />}
          {selectedTab === 'stats' && <Stats />}
          {selectedTab === 'friends' && <Friends />}
        </Suspense>
        {selectedTab === 'profile' && <Profile />}
      </div>

      {/* Bottom navigation: four places, the current one a raised pill with yellow icon and label */}
      <nav
        aria-label="Navigazione principale"
        className="relative z-10 flex flex-none gap-1.5 border-t border-mz-line bg-mz-nav px-2.5 pt-2 transition-colors"
        style={{ paddingBottom: 'max(var(--safe-bottom), 10px)' }}
      >
        {NAV_ITEMS.map(({ tab, icon, label }) => {
          const active = selectedTab === tab;
          // The dot: stamps and regions not seen yet on Stats, leaderboard news on Amici (not while you are looking)
          const dot = tab === 'stats' ? unseen.length : tab === 'friends' && !active ? friendNews.length : 0;
          return (
            <button
              key={tab}
              onClick={() => (tab === 'stats' ? openStats() : setSelectedTab(tab))}
              aria-current={active ? 'page' : undefined}
              aria-label={dot > 0 ? `${label}: ${dot} novità da vedere` : undefined}
              className={`relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-[18px] text-xs font-bold transition-colors ${
                active ? 'bg-mz-surface-2 text-mz-chosen' : 'text-mz-muted'
              }`}
            >
              <Icon name={icon} stroke={2.1} />
              <span>{label}</span>
              {dot > 0 && (
                <span className="absolute right-1/2 top-1 flex h-5 min-w-5 translate-x-5 items-center justify-center rounded-full bg-mz-red px-1 text-[0.65rem] font-bold text-white ring-2 ring-mz-nav">
                  {dot}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
