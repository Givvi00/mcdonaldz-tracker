import { useEffect } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { GPS_VERIFY_RADIUS_KM, type VerifyOutcome } from '@/services/gpsCheck';
import { formatDistance } from '@/utils/geo';
import { shortMcName } from '@/utils/format';
import { VerifiedBadge } from '@/components/VerifiedBadge';

const SHOW_MS = 4500;

function message(outcome: VerifyOutcome, name: string): { title: string; hint?: string } {
  switch (outcome.result) {
    case 'ok':
      return { title: 'Visita verificata col GPS', hint: name };
    case 'far':
      return {
        title: `Sei a ${formatDistance(outcome.distanceM / 1000)} da ${name}`,
        hint: `Per verificarla devi essere entro ${GPS_VERIFY_RADIUS_KM * 1000} m`,
      };
    case 'imprecise':
      return { title: 'Segnale GPS troppo debole', hint: `Precisione ±${outcome.accuracyM} m: riprova all'aperto, lontano dai muri` };
    case 'unavailable':
      return { title: 'Posizione non disponibile', hint: 'Controlla che la posizione sia attiva e permessa per l’app' };
  }
}

/** How a GPS check went, for a few seconds above the bottom navigation */
export function VerifyToast() {
  const notice = useMcdonaldStore(state => state.verifyNotice);
  const clear = useMcdonaldStore(state => state.clearVerifyNotice);
  const mcdonalds = useMcdonaldStore(state => state.mcdonalds);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(clear, SHOW_MS);
    return () => clearTimeout(t);
  }, [notice, clear]);

  if (!notice) return null;
  const mc = mcdonalds.find(m => m.id === notice.mcdonaldId);
  const ok = notice.outcome.result === 'ok';
  const { title, hint } = message(notice.outcome, mc ? shortMcName(mc.name) : 'il ristorante');

  return (
    <div
      key={notice.id}
      role="status"
      onClick={clear}
      className={`fixed inset-x-3 z-[2800] mx-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 shadow-lg shadow-black/25 animate-[toast-in_0.35s_ease-out] ${
        ok ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white dark:bg-gray-700'
      }`}
      style={{ bottom: 'calc(5rem + var(--safe-bottom) + 0.75rem)' }}
    >
      {ok ? <VerifiedBadge size={34} /> : <span className="text-xl">📍</span>}
      <div className="min-w-0">
        <p className="font-display text-sm font-bold leading-tight">{title}</p>
        {hint && <p className="mt-0.5 truncate text-xs opacity-85">{hint}</p>}
      </div>
    </div>
  );
}
