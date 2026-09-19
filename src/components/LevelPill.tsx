import { levelInfo } from '@/utils/foodTheme';

/** Current level, named after the menu, and how far the next one is. For use on the red cards. */
export function LevelPill({ visited }: { visited: number }) {
  const { level, next, toNext } = levelInfo(visited);
  return (
    <p className="mt-3 inline-flex flex-wrap items-center gap-x-2 rounded-full bg-black/20 px-3 py-1 text-xs font-semibold">
      <span>
        {level.icon} {level.name}
      </span>
      <span className="opacity-75">
        {next ? `· ancora ${toNext} per ${next.icon} ${next.name}` : '· livello massimo!'}
      </span>
    </p>
  );
}
