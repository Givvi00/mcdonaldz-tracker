import { FOOD_SPRITE } from '@/components/foodSprite';
import type { FoodIconName } from '@/utils/foodTheme';

/** The drawings of every food icon, once per page. Mounted in App; every FoodIcon (and the map) refers to it. */
export function FoodIconSprite() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute' }}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: FOOD_SPRITE }}
    />
  );
}

/** One food icon; the size comes from className or size (pixels). The outline is set in App.css (.food-ico). */
export function FoodIcon({ name, size, className = '' }: { name: FoodIconName; size?: number; className?: string }) {
  return (
    <svg
      className={`food-ico ${className}`}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#food-${name}`} />
    </svg>
  );
}
