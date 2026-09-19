import { ACHIEVEMENT_LIST, FAMILIES, type AchievementProgress } from '@/services/achievements';
import { Stamp } from '@/components/Stamp';

interface Props {
  unlocked: ReadonlySet<string>;
  progress: Record<string, AchievementProgress>;
  focused: string | null;
}

/** The achievements as the stamps of a passport, one page per family. Kept cream in the dark theme too, like the receipt. */
export function Passport({ unlocked, progress, focused }: Props) {
  const got = ACHIEVEMENT_LIST.filter(a => unlocked.has(a.id)).length;

  return (
    <div className="rounded-[1.4rem] border-[3px] border-[#3B2A22] bg-[#F6ECD6] p-3 text-[#3B2A22] shadow-lg">
      <div className="mb-3 flex items-center justify-between rounded-xl border-2 border-[#3B2A22] bg-gradient-to-br from-[#E8372A] to-[#B81F14] px-4 py-3 text-white">
        <p className="font-display text-lg font-bold tracking-wide">PASSAPORTO McDONALDZ</p>
        <span className="rounded-full bg-black/25 px-2.5 py-0.5 text-xs font-semibold">
          {got} / {ACHIEVEMENT_LIST.length} timbri
        </span>
      </div>

      {FAMILIES.map(family => {
        const items = ACHIEVEMENT_LIST.filter(a => a.family === family.id);
        const familyGot = items.filter(a => unlocked.has(a.id)).length;
        return (
          <section
            key={family.id}
            className={`mb-3 rounded-xl border border-[#DCCDB2] p-3 last:mb-0 ${
              family.id === 'segreti' ? 'bg-[#F3ECFA]' : 'bg-[#FFFAF0]'
            }`}
          >
            <header className="flex items-baseline justify-between">
              <h4 className="font-display text-sm font-bold uppercase tracking-[0.08em]">{family.title}</h4>
              <span className="text-xs text-[#7A6657]">
                {familyGot} su {items.length}
              </span>
            </header>
            <p className="mb-2 text-xs text-[#7A6657]">{family.blurb}</p>
            <div className="grid grid-cols-3 gap-x-1.5 gap-y-3">
              {items.map(def => {
                const has = unlocked.has(def.id);
                const state = has ? 'got' : def.secret ? 'secret' : 'no';
                const p = progress[def.id];
                return (
                  <div
                    key={def.id}
                    id={`ach-${def.id}`}
                    className={`flex flex-col items-center rounded-xl p-1 text-center transition-all ${
                      focused === def.id ? 'animate-pulse ring-4 ring-mc-red ring-offset-2 ring-offset-[#FFFAF0]' : ''
                    }`}
                  >
                    <Stamp def={def} state={state} size={84} />
                    <p className={`mt-0.5 text-xs font-bold leading-tight ${has ? '' : 'text-[#A08F80]'}`}>
                      {state === 'secret' ? '???' : def.name}
                    </p>
                    <p className="mt-0.5 text-[0.65rem] leading-tight text-[#7A6657]">
                      {state === 'secret' ? 'Timbro segreto' : def.description}
                    </p>
                    {state === 'no' && p && p.target > 1 && (
                      <p className="mt-1 text-[0.65rem] font-bold text-mc-red">
                        {p.current}/{p.target}
                        {p.label ? ` · ${p.label}` : ''}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
