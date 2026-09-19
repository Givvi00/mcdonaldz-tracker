import { levelInfo } from '@/utils/foodTheme';

/** Current level (a rank, not a prize) and how many visits the next one is away. For use on the red cards. */
export function LevelPill({ visited }: { visited: number }) {
  const { level, number, next, toNext } = levelInfo(visited);
  return (
    <p className="mt-3 inline-flex flex-wrap items-center gap-x-2 rounded-full bg-black/20 px-3 py-1 text-xs font-semibold">
      <span>
        {level.icon} Livello {number} · {level.name}
      </span>
      <span className="opacity-75">
        {next ? `· prossimo livello tra ${toNext} ${toNext === 1 ? 'visita' : 'visite'}` : '· livello massimo!'}
      </span>
    </p>
  );
}
