import { useState } from 'react';
import type { VisitRating } from '@shared/types';

type Category = { key: 'cleanliness' | 'staff' | 'outdoorSpace' | 'speed' | 'order'; label: string; icon: string };

const INSIDE: Category[] = [
  { key: 'cleanliness', label: 'Pulizia', icon: '🧼' },
  { key: 'staff', label: 'Personale', icon: '🙂' },
  { key: 'outdoorSpace', label: 'Spazi esterni', icon: '🌳' },
  { key: 'speed', label: 'Velocità', icon: '⚡' },
];
/** Only the McDrive: what you can judge from the car window */
const DRIVE: Category[] = [
  { key: 'staff', label: 'Personale', icon: '🙂' },
  { key: 'speed', label: 'Velocità', icon: '⚡' },
  { key: 'order', label: 'Ordine giusto', icon: '🧾' },
];

const categoriesOf = (drive: boolean | undefined) => (drive ? DRIVE : INSIDE);

/** The single number shown on the card: the mean of the categories voted (four inside, three at the McDrive) */
export const averageRating = (r: VisitRating): number => {
  const values = categoriesOf(r.drive).map(c => r[c.key] ?? 0);
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

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
  /** True right after marking a visit: sits above a level/region/stamp celebration's veil, so both are usable at once */
  aboveCelebration?: boolean;
}

/** Bottom sheet to vote a visited restaurant, 1 to 5 stars on a few quick categories: inside, or only the McDrive */
export function VisitRatingSheet({ name, initial, onSave, onClose, aboveCelebration }: Props) {
  // Both sets of stars are kept while switching, so going back and forth loses nothing; only the shown set is saved
  const [stars, setStars] = useState<Partial<Record<Category['key'], number>>>(() => ({ ...initial }));
  const [drive, setDrive] = useState(initial?.drive ?? false);
  const categories = categoriesOf(drive);
  const valid = categories.every(c => (stars[c.key] ?? 0) > 0);
  const save = () => {
    const rating = { staff: stars.staff!, speed: stars.speed! } as VisitRating;
    for (const c of categories) rating[c.key] = stars[c.key]!;
    if (drive) rating.drive = true;
    onSave(rating);
  };

  return (
    <div
      className={`fixed inset-0 ${aboveCelebration ? 'z-[2600]' : 'z-[2100]'} flex items-end justify-center bg-black/40`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Come ti sei trovato?"
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-gray-800 animate-[toast-in_0.25s_ease-out] px-5 pt-4 pb-6"
        style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}
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

        <div className="mb-4 flex gap-0.5 rounded-2xl bg-gray-100 p-1 dark:bg-gray-800" role="radiogroup" aria-label="Com'era la visita">
          {[
            { value: false, label: '🪑 Dentro' },
            { value: true, label: '🚗 Solo McDrive' },
          ].map(option => (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={drive === option.value}
              onClick={() => setDrive(option.value)}
              className={`flex-1 rounded-xl py-1.5 text-sm font-semibold transition-all ${
                drive === option.value ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="space-y-3.5">
          {categories.map(c => (
            <div key={c.key} className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {c.icon} {c.label}
              </span>
              <StarRow value={stars[c.key] ?? 0} label={c.label} onChange={v => setStars(s => ({ ...s, [c.key]: v }))} />
            </div>
          ))}
        </div>

        <button
          disabled={!valid}
          onClick={() => {
            save();
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
