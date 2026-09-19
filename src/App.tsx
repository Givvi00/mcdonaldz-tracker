import { useEffect } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { useTheme } from '@/hooks/useTheme';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Home } from '@/pages/Home';
import { MapView } from '@/components/MapView';
import { Stats } from '@/pages/Stats';
import { Profile } from '@/pages/Profile';
import { AchievementToast } from '@/components/AchievementToast';
import { NearbyPrompt } from '@/components/NearbyPrompt';
import { UpdateBanner } from '@/components/UpdateBanner';
import { MapAppChooser } from '@/components/MapAppChooser';
import { FoodRain } from '@/components/FoodRain';
import { startUpdateChecks } from '@/services/updates';
import { startCatalogRefresh } from '@/services/catalogRefresh';
import './App.css';

function App() {
  const { selectedTab, setSelectedTab, initApp, getVisitedCount, setUserPosition, setLocationStatus } =
    useMcdonaldStore();
  useTheme();
  const { status: geoStatus, coords } = useGeolocation();

  useEffect(() => {
    initApp();
  }, []);

  useEffect(() => startUpdateChecks(), []);
  useEffect(() => startCatalogRefresh(), []);

  useEffect(() => {
    setLocationStatus(geoStatus);
    setUserPosition(coords);
  }, [geoStatus, coords, setLocationStatus, setUserPosition]);

  const NAV_ITEMS = [
    { tab: 'home' as const, icon: '🏠', label: 'Home' },
    { tab: 'map' as const, icon: '🗺️', label: 'Mappa' },
    { tab: 'stats' as const, icon: '📊', label: 'Stats' },
    { tab: 'profile' as const, icon: '👤', label: 'Profilo' },
  ];

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors">
      <AchievementToast />
      <NearbyPrompt />
      <UpdateBanner />
      <MapAppChooser />
      <FoodRain />

      {/* Wordmark header */}
      {selectedTab !== 'map' && (
        <header
          className="flex items-center gap-2.5 px-4 pb-3 bg-gradient-to-b from-mc-red to-mc-red-dark text-white shadow-md shadow-red-900/20"
          style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-mc-yellow text-mc-red font-display font-bold text-lg shadow-sm ring-2 ring-white/30">
            M
          </span>
          <div>
            <p className="font-display font-semibold text-lg leading-tight">
              McDonaldz<span className="text-mc-yellow">.</span>
            </p>
            <p className="text-[0.65rem] uppercase tracking-wider text-white/70 -mt-0.5">Tracker</p>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedTab === 'home' && <Home />}
        {selectedTab === 'map' && <MapView />}
        {selectedTab === 'stats' && <Stats />}
        {selectedTab === 'profile' && <Profile />}
      </div>

      {/* Bottom Navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center transition-colors"
        style={{ height: 'calc(5rem + var(--safe-bottom))', paddingBottom: 'var(--safe-bottom)' }}
      >
        {NAV_ITEMS.map(({ tab, icon, label }) => {
          const active = selectedTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 py-3"
            >
              <span
                className={`flex items-center justify-center w-10 h-7 rounded-full transition-all ${
                  active ? 'bg-mc-yellow/40 dark:bg-mc-yellow/20' : ''
                }`}
              >
                <span className="text-xl">{icon}</span>
              </span>
              <span
                className={`text-xs font-display font-medium transition-colors ${
                  active ? 'text-mc-red' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {label}
              </span>
              {tab === 'stats' && getVisitedCount() > 0 && (
                <span className="absolute top-1 right-1/2 translate-x-3 bg-mc-red text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] ring-2 ring-white dark:ring-gray-900">
                  {getVisitedCount()}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default App;
