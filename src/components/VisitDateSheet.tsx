import { useState } from 'react';

interface Props {
  name: string;
  /** Current date of the visit (ms) */
  visitedAt: number;
  onSave: (visitedAt: number) => void;
  onClose: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');
/** yyyy-mm-dd of the local day, as a date input wants it */
export const dayValue = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
/** Noon of that local day */
export const dayToMs = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).getTime();
};
export const formatVisitDate = (ms: number) => new Date(ms).toLocaleDateString('it-IT', { dateStyle: 'medium' });

/** Bottom sheet to change the day of a visit */
export function VisitDateSheet({ name, visitedAt, onSave, onClose }: Props) {
  const [value, setValue] = useState(dayValue(visitedAt));
  const today = dayValue(Date.now());
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value) && value <= today;

  return (
    <div className="fixed inset-0 z-[2100] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quando ci sei stato?"
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-gray-800 animate-[toast-in_0.25s_ease-out] px-5 pt-4 pb-6"
        style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3">
          <h3 className="font-display font-bold text-gray-800 dark:text-gray-100">Quando ci sei stato?</h3>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300"
          >
            ✕
          </button>
        </div>
        <p className="mb-3 truncate text-sm text-gray-500 dark:text-gray-400">{name}</p>
        <input
          type="date"
          aria-label="Data della visita"
          value={value}
          max={today}
          onChange={e => setValue(e.target.value)}
          className="w-full rounded-xl border-2 border-mc-yellow bg-white px-3 py-3 text-base font-semibold text-gray-800 dark:bg-gray-900 dark:text-gray-100"
        />
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          I timbri legati all'orario (Nottambulo, Ferragosto, Doppietta, Pioniere) valgono solo per le visite verificate, cioè
          segnate mentre eri lì: se ci torni, usa «Verifica ora».
        </p>
        <button
          disabled={!valid}
          onClick={() => {
            onSave(dayToMs(value));
            onClose();
          }}
          className="mt-4 w-full rounded-xl bg-mc-yellow py-3 font-bold text-gray-800 shadow-sm transition-all active:scale-[0.98] disabled:opacity-40"
        >
          Salva la data
        </button>
      </div>
    </div>
  );
}
