import { FoodIcon } from '@/components/FoodIcon';
import type { FoodIconName } from '@/utils/foodTheme';

/**
 * The one look for a section heading, on every page: a yellow circle with a drawn food icon (or an emoji, where the
 * symbol says something, like 📍 for "near you"), then the title.
 */
export function SectionTitle({
  icon,
  emoji,
  children,
  className = 'mb-3',
}: {
  icon?: FoodIconName;
  emoji?: string;
  children: React.ReactNode;
  /** spacing around it (default: some room below) */
  className?: string;
}) {
  return (
    <h2 className={`flex items-center gap-2 font-display text-lg font-semibold text-gray-800 dark:text-gray-100 ${className}`}>
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 text-base dark:bg-yellow-950/50">
        {icon ? <FoodIcon name={icon} size={20} /> : emoji}
      </span>
      {children}
    </h2>
  );
}
