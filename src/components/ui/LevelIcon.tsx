// The line icons of the 12 levels (DESIGN.md, "Icone": cup, fries, burger, nuggets, ice cream, bag, drive, compass,
// trophy, crown, star, diamond).
// Levels 3–12 are the design's proposal, still to be approved: they live only here, so changing one is one line.

const LEVEL_PATHS: readonly React.ReactNode[] = [
  // 1 · cup
  <>
    <path d="M7 9h10l-1.2 11H8.2z" />
    <path d="M7.5 13h9M12 9V4l3-1" />
  </>,
  // 2 · fries
  <>
    <path d="M6.5 11h11l-1.4 9H7.9z" />
    <path d="M8.5 11V5.5M11 11V4M13.5 11V5M16 11V6.5" />
  </>,
  // 3 · burger
  <>
    <path d="M4 11a8 6 0 0 1 16 0z" />
    <path d="M3.5 14h17" />
    <path d="M5 17h14a2.5 2.5 0 0 1-2.5 3h-9A2.5 2.5 0 0 1 5 17z" />
  </>,
  // 4 · nuggets
  <>
    <circle cx="8" cy="15" r="3.8" />
    <circle cx="16.5" cy="15" r="3.8" />
    <circle cx="12" cy="8.5" r="3.8" />
  </>,
  // 5 · ice cream
  <>
    <path d="M7 12h10l-2 8h-6z" />
    <path d="M6 12a6 6 0 0 1 12 0" />
    <path d="M12 6V3.5" />
  </>,
  // 6 · bag
  <>
    <path d="M5 8h14l-1 12H6z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </>,
  // 7 · drive
  <>
    <path d="M4 17v-5l2-5h12l2 5v5z" />
    <path d="M4 12h16" />
    <circle cx="8" cy="17" r="1.7" />
    <circle cx="16" cy="17" r="1.7" />
  </>,
  // 8 · compass
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="m15.5 8.5-2 5-5 2 2-5z" />
  </>,
  // 9 · trophy
  <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v2a3 3 0 0 0 3 3M16 6h4v2a3 3 0 0 1-3 3M12 13v4M8.5 20h7" />,
  // 10 · crown
  <path d="m4 8 4 4 4-6 4 6 4-4-1.5 10h-13z" />,
  // 11 · star
  <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.9z" />,
  // 12 · diamond
  <>
    <path d="M6 4h12l3 5-9 11L3 9z" />
    <path d="M3 9h18M9 4 8 9l4 11M15 4l1 5-4 11" />
  </>,
];

/** The bare icon of a level (index 0–11), in the current text colour */
export function LevelGlyph({ index, size = 24, stroke = 2 }: { index: number; size?: number; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="inline-block flex-none"
    >
      {LEVEL_PATHS[Math.max(0, Math.min(LEVEL_PATHS.length - 1, index))]}
    </svg>
  );
}
