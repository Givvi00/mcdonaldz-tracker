import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { shortMcName } from '@/utils/format';
import { VerifiedBadge } from '@/components/VerifiedBadge';

/** Asks before removing a visit: a tap by mistake on a visited card or pin must not lose it */
export function UnmarkConfirm() {
  const { unmarkRequest, cancelUnmark, toggleVisit, visits, mcdonalds } = useMcdonaldStore();
  if (!unmarkRequest) return null;
  const mc = mcdonalds.find(m => m.id === unmarkRequest);
  const visit = visits.find(v => v.mcdonaldId === unmarkRequest);
  if (!mc || !visit) return null;
  const lost = [visit.verified && 'il sigillo del GPS', visit.rating && 'il tuo voto'].filter(Boolean).join(' e ');

  const confirm = () => {
    cancelUnmark();
    void toggleVisit(mc.id);
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-end justify-center bg-black/40" onClick={cancelUnmark}>
      <div
        className="w-full max-w-lg rounded-t-3xl border-t border-gray-200 bg-white px-5 pb-6 pt-5 shadow-2xl animate-[toast-in_0.25s_ease-out] dark:border-gray-800 dark:bg-gray-900"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          {visit.verified && <VerifiedBadge size={40} />}
          <div className="min-w-0">
            <h3 className="font-display font-bold text-gray-800 dark:text-gray-100">Togli la visita?</h3>
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">{shortMcName(mc.name)}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          {lost ? `Perderai anche ${lost}.` : 'Potrai segnarla di nuovo quando vuoi.'}
          {visit.verified && ' Per riavere il sigillo dovrai tornare lì.'}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={cancelUnmark}
            className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 active:scale-[0.98] dark:bg-gray-800 dark:text-gray-200"
          >
            Annulla
          </button>
          <button
            onClick={confirm}
            className="flex-1 rounded-xl bg-mc-red py-3 text-sm font-bold text-white shadow-sm active:scale-[0.98]"
          >
            Togli
          </button>
        </div>
      </div>
    </div>
  );
}
