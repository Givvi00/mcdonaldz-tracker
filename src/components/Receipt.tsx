import { FoodIcon } from '@/components/FoodIcon';
import { levelInfo } from '@/utils/foodTheme';

interface Row {
  region: string;
  total: number;
  visited: number;
}

interface Props {
  rows: Row[];
  visited: number;
  total: number;
}

const PAPER = '#FFFDF7';

/** The visits as a till receipt: one line per region visited, a total, the level. The paper stays light in dark mode, like real paper. */
export function Receipt({ rows, visited, total }: Props) {
  const lines = rows.filter(r => r.visited > 0).sort((a, b) => b.visited - a.visited || a.region.localeCompare(b.region, 'it'));
  const { level, number } = levelInfo(visited);
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div>
      <h3 className="font-display font-semibold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 dark:bg-yellow-950/50 text-sm">🧾</span>
        Il tuo scontrino
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">I McDonald's che hai visitato, regione per regione</p>
      <div className="mx-auto max-w-sm drop-shadow-md">
        <div className="px-5 pt-5 pb-3 font-mono text-[0.8rem] text-gray-800" style={{ background: PAPER }}>
          <p className="text-center font-bold tracking-widest">McDONALDZ</p>
          <p className="text-center text-[0.72rem] font-bold tracking-wider">RISTORANTI VISITATI</p>
          <p className="text-center text-[0.7rem] text-gray-500">Ordine n. {visited} · {today}</p>
          <div className="my-3 border-t-2 border-dashed border-gray-300" />
          {lines.length === 0 ? (
            <p className="py-2 text-center text-gray-500">Nessun articolo. Ordina il primo! <FoodIcon name="fries" size={16} /></p>
          ) : (
            <ul className="space-y-1">
              <li className="flex justify-between text-[0.65rem] font-bold tracking-wide text-gray-500">
                <span>REGIONE</span>
                <span>VISITATI</span>
              </li>
              {lines.map(r => (
                <li key={r.region} className="flex items-baseline gap-1">
                  <span className="truncate">{r.region}</span>
                  <span className="flex-1 border-b border-dotted border-gray-400 translate-y-[-3px]" />
                  <span className="tabular-nums whitespace-nowrap">
                    {r.visited} su {r.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="my-3 border-t-2 border-dashed border-gray-300" />
          <p className="flex justify-between font-bold">
            <span>TOTALE VISITATI</span>
            <span className="tabular-nums whitespace-nowrap">
              {visited} su {total}
            </span>
          </p>
          <p className="mt-1 flex justify-between text-[0.75rem]">
            <span>Livello {number}</span>
            <span>
              <FoodIcon name={level.icon} size={14} /> {level.name}
            </span>
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
