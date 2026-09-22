import { FoodIcon } from '@/components/FoodIcon';
import type { FoodIconName } from '@/utils/foodTheme';

/** The one look for a section heading, on every page: a drawn food icon in a yellow circle, then the title */
export function SectionTitle({
  icon,
  children,
  className = 'mb-3',
}: {
  icon: FoodIconName;
  children: React.ReactNode;
  /** spacing around it (default: some room below) */
  className?: string;
}) {
  return (
    <h2 className={`flex items-center gap-2 font-display text-lg font-semibold text-gray-800 dark:text-gray-100 ${className}`}>
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950/50">
        <FoodIcon name={icon} size={20} />
      </span>
      {children}
    </h2>
  );
}
