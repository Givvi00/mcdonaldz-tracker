import { useRef } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { exportData, importData } from '@/services/db';
import { readBackupSummary, saveBackup } from '@/services/backup';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'system', label: 'Sistema', icon: '⚙️' },
  { value: 'light', label: 'Chiaro', icon: '☀️' },
  { value: 'dark', label: 'Scuro', icon: '🌙' },
];

export function Profile() {
  const { user, getVisitedCount } = useMcdonaldStore();
  const { mode, setMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await saveBackup(await exportData());
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
    <div className="flex flex-col gap-6 pb-24 px-4 py-6">
      {/* User Info */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-3xl p-6 text-center shadow-lg shadow-blue-900/20">
        <div className="text-4xl mb-2">👤</div>
        <p className="text-sm opacity-90 font-display font-semibold">Profilo Utente</p>
        <p className="text-xs opacity-75 mt-2">ID: {user?.id.slice(0, 8)}...</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl text-center border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Visite Totali</p>
          <p className="text-3xl font-display font-bold text-mc-red mt-2">{getVisitedCount()}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl text-center border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Punti</p>
          <p className="text-3xl font-display font-bold text-mc-yellow mt-2">{user?.totalPoints || 0}</p>
        </div>
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

      {/* Data Management */}
      <div>
        <h3 className="font-display font-semibold text-lg mb-3 text-gray-800 dark:text-gray-100">Gestisci Dati</h3>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] shadow-sm"
          >
            📥 Esporta Dati (Backup)
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] shadow-sm"
          >
            📤 Importa Dati
          </button>
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
        <p className="font-display font-semibold mb-1">McDonaldz Tracker v0.1.0</p>
        <p className="text-xs opacity-75">Track your McDonald's visits in Italy 🍔🗺️</p>
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
                dbs.forEach(db => indexedDB.deleteDatabase(db.name));
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
