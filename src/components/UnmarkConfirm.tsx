import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { shortMcName } from '@/utils/format';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { ConfirmSheet } from '@/components/ConfirmSheet';

/** Asks before removing a visit: a tap by mistake on a visited card or pin must not lose it */
export function UnmarkConfirm() {
  const { unmarkRequest, cancelUnmark, toggleVisit, visits, mcdonalds } = useMcdonaldStore();
  if (!unmarkRequest) return null;
  const mc = mcdonalds.find(m => m.id === unmarkRequest);
  const visit = visits.find(v => v.mcdonaldId === unmarkRequest);
  if (!mc || !visit) return null;
  const lost = [visit.verified && 'la verifica', visit.rating && 'il tuo voto'].filter(Boolean).join(' e ');

  return (
    <ConfirmSheet
      title="Togli la visita?"
      subtitle={shortMcName(mc.name)}
      icon={visit.verified ? <VerifiedBadge size={40} /> : undefined}
      body={
        <>
          {lost ? `Perderai anche ${lost}.` : 'Potrai segnarla di nuovo quando vuoi.'}
          {visit.verified && ' Per verificarla di nuovo dovrai tornare lì.'}
        </>
      }
      confirmLabel="Togli"
      onCancel={cancelUnmark}
      onConfirm={() => {
        cancelUnmark();
        void toggleVisit(mc.id);
      }}
    />
  );
}
