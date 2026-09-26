// What you can say you ate, in the diary of a visit. The ids are stored with the visit (and online): never rename or
// reuse one; a new product gets a new id. The order is the order shown.

export interface MenuItem {
  id: string;
  label: string;
  emoji: string;
}

export const MENU: readonly MenuItem[] = [
  { id: 'bigmac', label: 'Big Mac', emoji: '🍔' },
  { id: 'mcroyal', label: 'McRoyal', emoji: '👑' },
  { id: 'crispy', label: 'Crispy McBacon', emoji: '🥓' },
  { id: 'mcchicken', label: 'McChicken', emoji: '🐔' },
  { id: 'cheeseburger', label: 'Cheeseburger', emoji: '🧀' },
  { id: 'hamburger', label: 'Hamburger', emoji: '🍔' },
  { id: 'filetofish', label: 'Filet-O-Fish', emoji: '🐟' },
  { id: 'nuggets', label: 'Chicken McNuggets', emoji: '🍗' },
  { id: 'wrap', label: 'Wrap', emoji: '🌯' },
  { id: 'fries', label: 'Patatine', emoji: '🍟' },
  { id: 'salad', label: 'Insalata', emoji: '🥗' },
  { id: 'happymeal', label: 'Happy Meal', emoji: '🎁' },
  { id: 'mcflurry', label: 'McFlurry', emoji: '🍦' },
  { id: 'sundae', label: 'Sundae', emoji: '🍨' },
  { id: 'pie', label: 'Tortino', emoji: '🥧' },
  { id: 'drink', label: 'Bibita', emoji: '🥤' },
  { id: 'coffee', label: 'McCafé', emoji: '☕' },
  { id: 'breakfast', label: 'Colazione', emoji: '🥐' },
];

/** The items of a visit, in menu order; ids no longer on the menu are skipped */
export function menuItems(ids: readonly string[] | undefined): MenuItem[] {
  if (!ids?.length) return [];
  const set = new Set(ids);
  return MENU.filter(item => set.has(item.id));
}
