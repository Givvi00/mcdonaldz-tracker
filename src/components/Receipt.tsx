import { FoodIcon } from '@/components/FoodIcon';
import { VerifiedBadge } from '@/components/VerifiedBadge';

interface Row {
  region: string;
  total: number;
  visited: number;
  /** visits verified (you were really there) */
  verified?: number;
}

interface Props {
  name?: string | null;
  rows: Row[];
  visited: number;
  total: number;
  verified?: number;
}

const PAPER = '#FFFFFF';
/** One number column: visited (green), verified (blue), total */
const COL = 'inline-flex w-8 flex-shrink-0 justify-end tabular-nums';

/** The visits as a till receipt: one line per region visited, a total, the level. The paper stays light in dark mode, like real paper. */
export function Receipt({ name, rows, visited, total, verified = 0 }: Props) {
  const lines = rows.filter(r => r.visited > 0).sort((a, b) => b.visited - a.visited || a.region.localeCompare(b.region, 'it'));
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div>
      <div className="mx-auto max-w-sm [filter:drop-shadow(0_0_1px_rgba(59,42,34,0.6))_drop-shadow(0_6px_10px_rgba(59,42,34,0.25))]">
        <div className="px-5 pt-5 pb-3 font-mono text-[0.8rem] text-gray-800" style={{ background: PAPER }}>
          <p className="text-center font-bold tracking-widest">McDONALDZ</p>
          <p className="text-center text-[0.7rem] tracking-wide">
            {name ? `Benvenuto al McDrive, ${name}` : 'Benvenuto al McDrive'}
          </p>
          <p className="text-center text-[0.72rem] font-bold tracking-wider">RISTORANTI VISITATI</p>
          <p className="text-center text-[0.7rem] text-gray-500">Ordine n. {visited} · {today}</p>
          <div className="my-3 border-t-2 border-dashed border-gray-300" />
          {lines.length === 0 ? (
            <p className="py-2 text-center text-gray-500">Nessun articolo. Ordina il primo! <FoodIcon name="fries" size={16} /></p>
          ) : (
            <ul className="space-y-1">
              <li className="flex items-center gap-1 text-[0.65rem] font-bold tracking-wide text-gray-500">
                <span className="flex-1">REGIONE</span>
                <span className={COL} title="Visitati" aria-label="Visitati">
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-600 text-[0.55rem] text-white">✓</span>
                </span>
                <span className={COL} title="Verificati" aria-label="Verificati">
                  <VerifiedBadge size={16} />
                </span>
                <span className={COL}>TOT</span>
              </li>
              {lines.map(r => (
                <li key={r.region} className="flex items-baseline gap-1">
                  <span className="min-w-0 truncate">{r.region}</span>
                  <span className="flex-1 border-b border-dotted border-gray-400 translate-y-[-3px]" />
                  <span className={`${COL} text-green-700`}>{r.visited}</span>
                  <span className={`${COL} text-blue-700`}>{r.verified || '·'}</span>
                  <span className={COL}>{r.total}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="my-3 border-t-2 border-dashed border-gray-300" />
          <p className="flex items-baseline gap-1 font-bold">
            <span className="flex-1">TOTALE</span>
            <span className={`${COL} text-green-700`}>{visited}</span>
            <span className={`${COL} text-blue-700`}>{verified || '·'}</span>
            <span className={COL}>{total}</span>
          </p>
          <p className="mt-4 text-center text-[0.7rem] text-gray-500">Grazie e a presto! <FoodIcon name="fries" size={14} /></p>
        </div>
        {/* Torn edge */}
        <div
          className="h-2"
          style={{
            backgroundImage: `linear-gradient(135deg, ${PAPER} 25%, transparent 25%), linear-gradient(225deg, ${PAPER} 25%, transparent 25%)`,
            backgroundSize: '12px 12px',
            backgroundPosition: '-6px 0',
          }}
        />
      </div>
    </div>
  );
}
