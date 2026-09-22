interface RegionStat {
  region: string;
  total: number;
  visited: number;
}

interface Props {
  open: boolean;
  regions: RegionStat[];
  selected: string | null;
  onSelect: (region: string | null) => void;
  onClose: () => void;
}

export function RegionSheet({ open, regions, selected, onSelect, onClose }: Props) {
  if (!open) return null;

  const pick = (region: string | null) => {
    onSelect(region);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[75vh] flex flex-col bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-gray-800 animate-[toast-in_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h3 className="font-display font-bold text-gray-800 dark:text-gray-100">Scegli una regione</h3>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-6" style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}>
          <button
            onClick={() => pick(null)}
            className={`w-full mb-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              selected === null
                ? 'bg-mc-red text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Tutte le regioni
          </button>

          <div className="grid grid-cols-2 gap-2">
            {regions.map(({ region }) => {
              const active = selected === region;
              return (
                <button
                  key={region}
                  onClick={() => pick(active ? null : region)}
                  className={`text-left px-3 py-3 rounded-2xl border transition-colors ${
                    active
                      ? 'bg-mc-red/10 dark:bg-mc-red/20 border-mc-red'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{region}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
