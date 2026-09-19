import type { AchievementDef } from '@/services/achievements';
import { STAMP_INK, STAMP_SHAPES, STAMP_SYMBOLS } from '@/components/stampArt';

export type StampState = 'got' | 'no' | 'secret';

/** A little crooked, always the same for the same stamp */
const tiltOf = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 13) - 6;
};

/** One passport stamp. Got: inked and slightly crooked. Not yet: dashed outline. Secret: dashed outline and a keyhole. */
export function Stamp({ def, state, size = 88, className = '' }: { def: AchievementDef; state: StampState; size?: number; className?: string }) {
  const shape = STAMP_SHAPES[def.shape];
  const symbol = state === 'secret' ? STAMP_SYMBOLS.key : STAMP_SYMBOLS[def.symbol];
  const symbolGroup = `<g transform="translate(21.6 21.6) scale(1.1)">${symbol}</g>`;

  if (state === 'got') {
    const inner = `<g transform="translate(48 48) scale(.84) translate(-48 -48)">${shape}</g>`;
    return (
      <svg
        className={className}
        viewBox="0 0 96 96"
        width={size}
        height={size}
        aria-hidden="true"
        style={{ color: STAMP_INK[def.family], transform: `rotate(${tiltOf(def.id)}deg)` }}
        dangerouslySetInnerHTML={{
          __html: `<g filter="url(#stamp-ink)" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round"><g stroke-width="4">${shape}</g><g stroke-width="2">${inner}</g><g stroke-width="3">${symbolGroup}</g></g>`,
        }}
      />
    );
  }

  return (
    <svg
      className={`text-stone-400 dark:text-stone-500 ${className}`}
      viewBox="0 0 96 96"
      width={size}
      height={size}
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: `<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round"><g stroke-dasharray="5 6" stroke-width="3">${shape}</g><g stroke-width="3" opacity="${state === 'secret' ? '.9' : '.55'}">${symbolGroup}</g></g>`,
      }}
    />
  );
}
