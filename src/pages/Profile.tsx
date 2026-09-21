import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { applyUpdate, checkForUpdate, type UpdateCheck } from '@/services/updates';
import { refreshCatalog, type CatalogRefresh } from '@/services/catalogRefresh';
import { InstallSection } from '@/components/InstallPrompt';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { exportData, getPreMigrationBackup, importData } from '@/services/db';
import { backupFilename, readBackupSummary, saveBackup } from '@/services/backup';
import { persistState, requestPersistentStorage, type PersistState } from '@/services/storagePersist';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';
import { FoodPattern } from '@/components/FoodPattern';
import { FoodIcon } from '@/components/FoodIcon';
import { levelInfo } from '@/utils/foodTheme';
import { LevelRoadmap } from '@/components/LevelRoadmap';
import { lastBackupAt, markBackupDone, backupNudge } from '@/services/backupReminder';
import { choosesMapApp, getSavedMapApp, saveMapApp } from '@/utils/navigation';
import { MAP_APPS, type MapApp } from '@/utils/directions';

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'system', label: 'Sistema', icon: '⚙️' },
  { value: 'light', label: 'Chiaro', icon: '☀️' },
  { value: 'dark', label: 'Scuro', icon: '🌙' },
];

export function Profile() {
  const { user, getVisitedCount, mcdonalds, catalogInfo, renameUser, profileFocus, clearProfileFocus } = useMcdonaldStore();
  const nameInput = useRef<HTMLInputElement>(null);

  // Arrived from "Ciao! Registrati": bring the name field into view and start typing
  useEffect(() => {
    if (profileFocus !== 'name') return;
    const t = setTimeout(() => {
      nameInput.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nameInput.current?.focus({ preventScroll: true });
      clearProfileFocus();
    }, 250);
    return () => clearTimeout(t);
  }, [profileFocus, clearProfileFocus]);
  const [, setBackupTick] = useState(0);
  const [persist, setPersist] = useState<PersistState>('unknown');
  const [safetyCopy] = useState(getPreMigrationBackup);
  useEffect(() => {
    void persistState().then(setPersist);
    void requestPersistentStorage().then(setPersist);
  }, []);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const nameShown = nameDraft ?? user?.name ?? '';
  const { mode, setMode } = useTheme();
  const level = levelInfo(getVisitedCount());
  const [mapApp, setMapApp] = useState<MapApp | null>(getSavedMapApp);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleExport = async () => {
    try {
      await saveBackup(await exportData());
      markBackupDone();
      setBackupTick(t => t + 1);
    } catch (error) {
      alert(`Impossibile salvare il backup: ${(error as Error).message}`);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const { visits } = readBackupSummary(text);
      await importData(text);
      alert(`Backup importato: ${visits} visite.`);
      window.location.reload();
    } catch (error) {
      alert(`Errore nell'importazione: ${(error as Error).message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-8 px-4 py-6">
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

      {backupNudge(getVisitedCount()) && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-semibold">
            {lastBackupAt() ? 'È passato un po\' di tempo dall\'ultimo backup.' : 'Non hai ancora fatto un backup.'}
          </p>
          <p className="mt-0.5 text-xs opacity-80">I tuoi dati stanno solo su questo telefono: un backup li mette al sicuro.</p>
          <button
            onClick={handleExport}
            className="mt-2 rounded-xl bg-mc-yellow px-3 py-1.5 text-xs font-bold text-gray-800 active:scale-95"
          >
            Esporta ora
          </button>
        </div>
      )}

      <div>
        <h3 className="font-display font-semibold text-lg mb-3 text-gray-800 dark:text-gray-100">Il tuo percorso</h3>
        <LevelRoadmap visited={getVisitedCount()} />
      </div>

      {/* Name shown in the header */}
      <div>
        <h3 className="font-display font-semibold text-lg mb-3 text-gray-800 dark:text-gray-100">Il tuo nome</h3>
        <div className="flex gap-2">
          <input
            ref={nameInput}
            value={nameShown}
            onChange={e => setNameDraft(e.target.value)}
            maxLength={16}
            placeholder="Ospite"
            className="min-w-0 flex-1 rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:border-mc-red dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <button
            onClick={async () => {
              await renameUser(nameShown);
              setNameDraft(null);
            }}
            disabled={nameDraft === null}
            className="rounded-xl bg-mc-red px-4 py-2.5 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-40"
          >
            Salva
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Compare in alto a destra, sopra il livello. Resta solo su questo telefono.</p>
      </div>

      {/* Theme */}
      <div>
        <h3 className="font-display font-semibold text-lg mb-3 text-gray-800 dark:text-gray-100">Aspetto</h3>
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
          <h3 className="font-display font-semibold text-lg mb-3 text-gray-800 dark:text-gray-100">App per le indicazioni</h3>
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

      {/* Data Management */}
      <div>
        <h3 className="font-display font-semibold text-lg mb-1 text-gray-800 dark:text-gray-100">Gestisci Dati</h3>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Ultimo backup: {lastBackupAt() ? new Date(lastBackupAt() as number).toLocaleDateString('it-IT', { dateStyle: 'medium' }) : 'mai'}
          {persist === 'yes' && ' · Dati protetti dal browser'}
          {persist === 'no' && ' · Il browser potrebbe cancellare i dati se manca spazio: fai un backup ogni tanto'}
        </p>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full bg-mc-yellow hover:brightness-95 text-gray-800 font-bold py-3 rounded-xl transition-all active:scale-[0.98] shadow-sm"
          >
            📥 Esporta Dati (Backup)
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-white dark:bg-gray-900 border-2 border-mc-yellow text-gray-800 dark:text-gray-100 font-bold py-3 rounded-xl transition-all active:scale-[0.98] shadow-sm"
          >
            📤 Importa Dati
          </button>
          {safetyCopy && (
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              <p>
                Prima dell'ultimo aggiornamento dei dati l'app ne ha messo da parte una copia (
                {new Date(safetyCopy.savedAt).toLocaleDateString('it-IT', { dateStyle: 'medium' })}). Se qualcosa non torna, scaricala e
                poi importala qui sopra.
              </p>
              <button
                onClick={() => void saveBackup(safetyCopy.json, backupFilename().replace('backup', 'copia-di-sicurezza'))}
                className="mt-2 rounded-lg bg-gray-100 px-3 py-1.5 font-semibold text-gray-800 active:scale-95 dark:bg-gray-800 dark:text-gray-100"
              >
                Scarica la copia di sicurezza
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </div>
      </div>

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
        <p className="text-xs opacity-75 mt-3">Track your McDonald's visits in Italy 🍔🗺️</p>
      </div>

      {/* Clear Warning */}
      <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-2xl text-center text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
        <p className="font-display font-semibold">⚠️ Cancella Dati</p>
        <p className="text-xs mt-1 opacity-75">Prima di cancellare i dati, esporta un backup!</p>
        <button
          onClick={() => {
            if (confirm('Sei sicuro? Tutti i dati verranno cancellati.')) {
              localStorage.clear();
              indexedDB.databases().then(dbs => {
                dbs.forEach(db => {
                  if (db.name) indexedDB.deleteDatabase(db.name);
                });
              });
              alert('Dati cancellati. Ricarica la pagina.');
              window.location.reload();
            }
          }}
          className="mt-3 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all active:scale-[0.97] shadow-sm"
        >
          🗑️ Cancella Tutto
        </button>
      </div>
    </div>
  );
}
