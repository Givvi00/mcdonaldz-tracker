// Drawings of the passport stamps: symbols on a 48 grid, outlines on a 96 grid, one ink colour per family.
export const STAMP_SYMBOLS: Record<string, string> = {
  pin: '<path d="M24 42C24 42 12 29 12 20a12 12 0 1 1 24 0C36 29 24 42 24 42Z"/><circle cx="24" cy="20" r="4.5"/>',
  pincheck: '<path d="M24 42C24 42 12 29 12 20a12 12 0 1 1 24 0C36 29 24 42 24 42Z"/><path d="M18.5 20l4 4 7-8"/>',
  compass: '<circle cx="24" cy="24" r="16"/><path d="M30 18L26.5 26.5L18 30L21.5 21.5Z" fill="currentColor"/>',
  map: '<path d="M7 12L18 9L30 12L41 9V36L30 39L18 36L7 39Z"/><path d="M18 9V36M30 12V39"/>',
  mapdots: '<path d="M7 12L18 9L30 12L41 9V36L30 39L18 36L7 39Z"/><circle cx="14" cy="22" r="2" fill="currentColor"/><circle cx="24" cy="26" r="2" fill="currentColor"/><circle cx="35" cy="20" r="2" fill="currentColor"/><circle cx="30" cy="31" r="2" fill="currentColor"/>',
  flag: '<path d="M13 41V8"/><path d="M13 9H37L31.5 17L37 25H13"/>',
  star: '<path d="M24 7L28.8 18L41 19.2L31.8 27.2L34.6 39L24 32.8L13.4 39L16.2 27.2L7 19.2L19.2 18Z"/>',
  crown: '<path d="M9 34L8 16L17 24L24 11L31 24L40 16L39 34Z"/><path d="M9 40H39"/>',
  ns: '<path d="M24 6V42M17 13L24 6L31 13M17 35L24 42L31 35"/>',
  island: '<path d="M6 37C12 33 18 41 24 37S36 33 42 37"/><path d="M24 35V17"/><path d="M24 17C18 11 12 14 10 19M24 17C30 11 36 14 38 19M24 17C22 12 22 10 22 8"/>',
  skyline: '<path d="M7 40V25H16V40M18 40V11H29V40M31 40V20H41V40M5 40H43"/><path d="M22 17H25M22 23H25M22 29H25"/>',
  plane: '<path d="M24 6C26 6 27 8 27 10V20L41 28V32L27 28V36L31 39V42L24 40L17 42V39L21 36V28L7 32V28L21 20V10C21 8 22 6 24 6Z"/>',
  train: '<rect x="12" y="7" width="24" height="27" rx="6"/><path d="M12 21H36"/><circle cx="19" cy="28" r="1.6" fill="currentColor"/><circle cx="29" cy="28" r="1.6" fill="currentColor"/><path d="M17 34L12 42M31 34L36 42"/>',
  car: '<path d="M7 31V25L12 16H36L41 25V31Z"/><path d="M12 25H36"/><circle cx="16" cy="33" r="4" fill="#fff"/><circle cx="32" cy="33" r="4" fill="#fff"/>',
  bag: '<path d="M10 16H38L36 41H12Z"/><path d="M17 21V14a7 7 0 0 1 14 0V21"/>',
  road: '<path d="M17 6L9 42M31 6L39 42"/><path d="M24 8V14M24 21V27M24 34V40"/>',
  rocket: '<path d="M24 6C32 12 33 24 30 32H18C15 24 16 12 24 6Z"/><circle cx="24" cy="20" r="3"/><path d="M18 32L12 38M30 32L36 38M24 34V42"/>',
  hourglass: '<path d="M14 7H34M14 41H34"/><path d="M16 7C16 20 32 22 32 24C32 26 16 28 16 41M32 7C32 20 16 22 16 24"/>',
  moon: '<path d="M31 9A16 16 0 1 0 39 30A13 13 0 0 1 31 9Z"/>',
  sun: '<circle cx="24" cy="22" r="7"/><path d="M24 8V11M24 33V36M10 22H13M35 22H38M14 12L16 14M32 30L34 32M34 12L32 14M14 32L16 30"/><path d="M6 42H42"/>',
  two: '<circle cx="18" cy="24" r="10"/><circle cx="30" cy="24" r="10"/>',
  seven: '<path d="M12 12H36L21 41"/><path d="M15 26H30"/>',
  key: '<circle cx="24" cy="19" r="7"/><path d="M21 25L19 39H29L27 25"/>',
};

export const STAMP_SHAPES: Record<string, string> = {
  circle: '<circle cx="48" cy="48" r="41"/>',
  rect: '<rect x="8" y="14" width="80" height="68" rx="14"/>',
  shield: '<path d="M48 6L86 18V48C86 70 68 84 48 90C28 84 10 70 10 48V18Z"/>',
  hex: '<path d="M48 6L84 27V69L48 90L12 69V27Z"/>',
};

export const STAMP_INK: Record<string, string> = {
  regioni: '#C8281C',
  geo: '#1E7A44',
  tipi: '#2B5FA8',
  rari: '#B36B00',
  segreti: '#6B3FA0',
};

/** Rough-ink look for a stamp: a little displacement of the outline. Lives in the sprite (FoodIconSprite). */
export const STAMP_FILTER =
  '<filter id="stamp-ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".45" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.1"/></filter>';
