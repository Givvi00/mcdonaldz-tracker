import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { applyUpdate, checkForUpdate, type UpdateCheck } from '@/services/updates';
import { refreshCatalog, type CatalogRefresh } from '@/services/catalogRefresh';
import { InstallSection } from '@/components/InstallPrompt';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { AccountSection } from '@/components/AccountSection';
import { SectionTitle } from '@/components/SectionTitle';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';
import { FoodPattern } from '@/components/FoodPattern';
import { FoodIcon } from '@/components/FoodIcon';
import { levelInfo } from '@/utils/foodTheme';
import { LevelRoadmap } from '@/components/LevelRoadmap';
import { choosesMapApp, getSavedMapApp, saveMapApp } from '@/utils/navigation';
import { MAP_APPS, type MapApp } from '@/utils/directions';

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'system', label: 'Sistema', icon: '⚙️' },
  { value: 'light', label: 'Chiaro', icon: '☀️' },
  { value: 'dark', label: 'Scuro', icon: '🌙' },
];

export function Profile() {
  const { user, getVisitedCount, mcdonalds, catalogInfo, openOnboarding } = useMcdonaldStore();
  const { mode, setMode } = useTheme();
  const level = levelInfo(getVisitedCount());
  const [mapApp, setMapApp] = useState<MapApp | null>(getSavedMapApp);
  const [updateCheck, setUpdateCheck] = useState<UpdateCheck | 'checking' | null>(null);
  const [catalogCheck, setCatalogCheck] = useState<CatalogRefresh | null>(null);

  const openCount = mcdonalds.filter(mc => mc.opened).length;
  const catalogDate = new Date(catalogInfo.generatedAt).toLocaleDateString('it-IT', { dateStyle: 'short' });

  const buildLabel = `${new Date(__BUILD_DATE__).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })} · ${__BUILD_ID__}`;

  const handleCheckUpdate = async () => {
    setUpdateCheck('checking');
    setCatalogCheck(null);
    const [app, data] = await Promise.all([checkForUpdate(), refreshCatalog()]);
    setUpdateCheck(app);
    setCatalogCheck(data);
  };

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-8">
      {/* You: greeting and level */}
      <div className="relative overflow-hidden bg-gradient-to-br from-mc-red to-mc-red-dark text-white rounded-3xl p-6 text-center shadow-lg shadow-red-900/20">
        <FoodPattern />
        <div className="relative mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#3B2A22] bg-mc-yellow shadow-md">
          <FoodIcon name={level.level.icon} size={38} />
        </div>
        <p className="relative text-lg font-display font-bold">{user?.name ? `Ciao, ${user.name}` : 'Ciao!'}</p>
        <p className="relative mt-0.5 font-display text-sm font-semibold opacity-90">
          Livello {level.number} · {level.level.name}
        </p>
        <p className="relative mt-1 text-xs opacity-75">{getVisitedCount()} McDonald's visitati</p>
      </div>

      <div>
        <SectionTitle icon="happy">Il tuo percorso</SectionTitle>
        <LevelRoadmap visited={getVisitedCount()} />
      </div>

      <AccountSection />

      {/* Theme */}
      <div>
        <SectionTitle icon="mcflurry">Aspetto</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setMode(opt.value)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all active:scale-[0.97] ${
                mode === opt.value
                  ? 'bg-mc-red/10 border-mc-red text-mc-red'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-xl">{opt.icon}</span>
              <span className="text-xs font-semibold">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {choosesMapApp() && (
        <div>
          <SectionTitle icon="wrap">App per le indicazioni</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {MAP_APPS.map(app => (
              <button
                key={app.value}
                onClick={() => {
                  saveMapApp(app.value);
                  setMapApp(app.value);
                }}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all active:scale-[0.97] ${
                  mapApp === app.value
                    ? 'bg-mc-red/10 border-mc-red text-mc-red'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span className="text-xl">{app.icon}</span>
                <span className="text-xs font-semibold">{app.label}</span>
              </button>
            ))}
          </div>
          {!mapApp && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Non ancora scelta: te lo chiederò al primo «Portami lì».</p>
          )}
        </div>
      )}

      <InstallSection />

      {/* About */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl text-center text-sm text-gray-600 dark:text-gray-400">
        <p className="font-display font-semibold mb-1">McDonaldz Tracker v{__APP_VERSION__}</p>
        <p className="text-xs opacity-75">Build {buildLabel}</p>
        <p className="text-xs opacity-75 mt-1">
          Elenco: {openCount} aperti su {mcdonalds.length} · {catalogInfo.source === 'downloaded' ? 'aggiornato il' : 'incluso nell\'app,'} {catalogDate}
        </p>
        <button
          onClick={handleCheckUpdate}
          disabled={updateCheck === 'checking'}
          className="mt-3 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-xs font-bold active:scale-[0.97] transition-transform disabled:opacity-60"
        >
          🔄 Controlla aggiornamenti
        </button>
        <button
          onClick={openOnboarding}
          className="mt-3 ml-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-xs font-bold active:scale-[0.97] transition-transform"
        >
          📖 Rivedi la guida
        </button>
        {updateCheck && (
          <p className="text-xs mt-2 font-semibold" role="status">
            {updateCheck === 'checking' && 'Controllo in corso…'}
            {updateCheck === 'current' && '✓ Hai già l\'ultima versione'}
            {updateCheck === 'available' && (
              <>
                Nuova versione disponibile.{' '}
                <button onClick={applyUpdate} className="underline text-mc-red font-bold">
                  Aggiorna ora
                </button>
              </>
            )}
            {updateCheck === 'unavailable' &&
              (Capacitor.isNativePlatform()
                ? 'L\'app Android si aggiorna installando il nuovo APK.'
                : 'Impossibile controllare: sei offline?')}
          </p>
        )}
        {catalogCheck === 'updated' && (
          <p className="text-xs mt-1 font-semibold" role="status">✓ Elenco ristoranti aggiornato</p>
        )}
        {catalogCheck === 'rejected' && (
          <p className="text-xs mt-1 font-semibold" role="status">Nuovo elenco non applicato: non ha superato i controlli di sicurezza</p>
        )}
        <p className="text-xs opacity-75 mt-3">I McDonald's che hai visitato in Italia, uno per uno 🍔🗺️</p>
      </div>
    </div>
  );
}
