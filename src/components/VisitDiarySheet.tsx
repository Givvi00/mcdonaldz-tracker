import { useState } from 'react';
import { MENU } from '@/utils/menu';

const NOTE_MAX = 280;

interface Props {
  name: string;
  initialAte?: string[];
  initialNotes?: string;
  onSave: (diary: { ate: string[]; notes: string }) => void;
  onClose: () => void;
}

/** Bottom sheet for the diary of a visit: tap what you ate, and a short note if you like */
export function VisitDiarySheet({ name, initialAte, initialNotes, onSave, onClose }: Props) {
  const [ate, setAte] = useState<string[]>(initialAte ?? []);
  const [notes, setNotes] = useState(initialNotes ?? '');
  const toggle = (id: string) => setAte(list => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]));

  return (
    <div className="fixed inset-0 z-[2100] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Il tuo diario"
        className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl border-t border-gray-200 bg-white px-5 pt-4 shadow-2xl animate-[toast-in_0.25s_ease-out] dark:border-gray-800 dark:bg-gray-900"
        style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3">
          <h3 className="font-display font-bold text-gray-800 dark:text-gray-100">Il tuo diario</h3>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 truncate text-sm text-gray-500 dark:text-gray-400">{name}</p>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Cosa hai mangiato?</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Cosa hai mangiato">
            {MENU.map(item => {
              const on = ate.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition-all active:scale-95 ${
                    on
                      ? 'border-mc-red bg-mc-red/10 text-mc-red dark:bg-mc-red/20'
                      : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                  }`}
                >
                  <span aria-hidden="true">{item.emoji}</span>
                  {item.label}
                </button>
              );
            })}
          </div>

          <label htmlFor="diary-note" className="mt-5 mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Una nota
          </label>
          <textarea
            id="diary-note"
            value={notes}
            onChange={e => setNotes(e.target.value.slice(0, NOTE_MAX))}
            rows={3}
            placeholder="Com'era? Con chi eri? Qualcosa da ricordare…"
            className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-mc-red dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <p className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
            {notes.length}/{NOTE_MAX}
          </p>
        </div>

        <button
          onClick={() => {
            onSave({ ate, notes });
            onClose();
          }}
          className="mt-3 w-full rounded-xl bg-mc-yellow py-3 font-bold text-gray-800 shadow-sm transition-all active:scale-[0.98]"
        >
          Salva il diario
        </button>
      </div>
    </div>
  );
}
