import { useState } from 'react';
import type { VisitRating } from '@shared/types';

const CATEGORIES: { key: keyof VisitRating; label: string; icon: string }[] = [
  { key: 'cleanliness', label: 'Pulizia', icon: '🧼' },
  { key: 'staff', label: 'Personale', icon: '🙂' },
  { key: 'outdoorSpace', label: 'Spazi esterni', icon: '🌳' },
  { key: 'speed', label: 'Velocità', icon: '⚡' },
];

/** The single number shown on the card: the mean of the four categories */
export const averageRating = (r: VisitRating): number => (r.cleanliness + r.staff + r.outdoorSpace + r.speed) / 4;

function StarRow({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex gap-0.5" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} stelle`}
          onClick={() => onChange(n)}
          className="p-0.5 text-2xl leading-none active:scale-90 transition-transform"
        >
          <span className={n <= value ? 'text-mc-yellow' : 'text-gray-300 dark:text-gray-700'}>★</span>
        </button>
      ))}
    </div>
  );
}

interface Props {
  name: string;
  initial?: VisitRating;
  onSave: (rating: VisitRating) => void;
  onClose: () => void;
}

/** Bottom sheet to vote a visited restaurant on four quick categories, 1 to 5 stars each */
export function VisitRatingSheet({ name, initial, onSave, onClose }: Props) {
  const [rating, setRating] = useState<VisitRating>(initial ?? { cleanliness: 0, staff: 0, outdoorSpace: 0, speed: 0 });
  const valid = CATEGORIES.every(c => rating[c.key] > 0);

  return (
    <div className="fixed inset-0 z-[2100] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-gray-800 animate-[toast-in_0.25s_ease-out] px-5 pt-4 pb-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3">
          <h3 className="font-display font-bold text-gray-800 dark:text-gray-100">Come ti sei trovato?</h3>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 truncate text-sm text-gray-500 dark:text-gray-400">{name}</p>

        <div className="space-y-3.5">
          {CATEGORIES.map(c => (
            <div key={c.key} className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {c.icon} {c.label}
              </span>
              <StarRow value={rating[c.key]} label={c.label} onChange={v => setRating(r => ({ ...r, [c.key]: v }))} />
            </div>
          ))}
        </div>

        <button
          disabled={!valid}
          onClick={() => {
            onSave(rating);
            onClose();
          }}
          className="mt-5 w-full rounded-xl bg-mc-yellow py-3 font-bold text-gray-800 shadow-sm transition-all active:scale-[0.98] disabled:opacity-40"
        >
          Salva la recensione
        </button>
      </div>
    </div>
  );
}
