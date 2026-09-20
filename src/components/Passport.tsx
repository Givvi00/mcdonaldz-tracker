import { ACHIEVEMENT_LIST, FAMILIES, type AchievementProgress } from '@/services/achievements';
import { Stamp } from '@/components/Stamp';

interface Props {
  unlocked: ReadonlySet<string>;
  progress: Record<string, AchievementProgress>;
  focused: string | null;
}

/** The achievements as the stamps of a passport, one page per family. Cream in the light theme, dark brown in the dark one. */
export function Passport({ unlocked, progress, focused }: Props) {
  const got = ACHIEVEMENT_LIST.filter(a => unlocked.has(a.id)).length;

  return (
    <div className="rounded-[1.4rem] border-[3px] border-[#3B2A22] bg-[#F6ECD6] p-3 text-[#3B2A22] shadow-lg dark:border-[#6B5546] dark:bg-[#2A211B] dark:text-[#F3E7D3]">
      <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border-2 border-[#3B2A22] bg-gradient-to-br from-[#E8372A] to-[#B81F14] px-4 py-3 text-white dark:border-[#6B5546]">
        <p className="font-display text-lg font-bold leading-none tracking-wide">PASSAPORTO McDONALDZ</p>
        <span className="inline-flex h-6 flex-none items-center justify-center whitespace-nowrap rounded-full bg-black/30 px-3 text-xs font-semibold leading-none">
          {got} / {ACHIEVEMENT_LIST.length} timbri
        </span>
      </div>

      {FAMILIES.map(family => {
        const items = ACHIEVEMENT_LIST.filter(a => a.family === family.id);
        const familyGot = items.filter(a => unlocked.has(a.id)).length;
        return (
          <section
            key={family.id}
            className={`mb-3 rounded-xl border border-[#DCCDB2] p-3 last:mb-0 dark:border-[#4A3B31] ${
              family.id === 'segreti' ? 'passport-page-secret' : 'passport-page'
            }`}
          >
            <header className="flex items-baseline justify-between">
              <h4 className="font-display text-sm font-bold uppercase tracking-[0.08em]">{family.title}</h4>
              <span className="text-xs text-[#7A6657] dark:text-[#B9A793]">
                {familyGot} su {items.length}
              </span>
            </header>
            <p className="mb-2 text-xs text-[#7A6657] dark:text-[#B9A793]">{family.blurb}</p>
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
                      focused === def.id
                        ? 'animate-pulse ring-4 ring-mc-red ring-offset-2 ring-offset-[#FFFAF0] dark:ring-offset-[#362A22]'
                        : ''
                    }`}
                  >
                    <Stamp def={def} state={state} size={84} />
                    <p className={`mt-0.5 text-xs font-bold leading-tight ${has ? '' : 'text-[#A08F80] dark:text-[#8E7D6C]'}`}>
                      {state === 'secret' ? '???' : def.name}
                    </p>
                    <p className="mt-0.5 text-[0.65rem] leading-tight text-[#7A6657] dark:text-[#B9A793]">
                      {state === 'secret' ? 'Timbro segreto' : def.description}
                    </p>
                    {state === 'no' && p && p.target > 1 && (
                      <p className="mt-1 text-[0.65rem] font-bold text-mc-red dark:text-red-400">
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
