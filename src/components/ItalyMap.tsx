import { ITALY_MAP, MAP_REGIONS } from '@/data/italyMap';
import type { RegionTier } from '@/services/regions';
import { TIER_FILL } from '@/utils/regionColors';

export { TIER_FILL };

/** Italy with every region in place; each one is coloured by its tier (gold, silver, in progress, not started) */
export function ItalyMap({
  tiers,
  skip,
  className,
  children,
}: {
  tiers: Record<string, RegionTier>;
  /** a region that is drawn by the caller instead (via children) */
  skip?: string;
  className?: string;
  /** drawn on top of the regions, in map coordinates */
  children?: React.ReactNode;
}) {
  return (
    <svg viewBox={`0 0 ${ITALY_MAP.width} ${ITALY_MAP.height}`} className={className} aria-hidden="true" style={{ overflow: 'visible' }}>
      {Object.entries(MAP_REGIONS).map(([name, r]) =>
        name === skip ? null : (
          <path
            key={name}
            d={r.path}
            fill={TIER_FILL[tiers[name] ?? 'empty']}
            stroke="#FFFFFF"
            strokeOpacity={0.7}
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        ),
      )}
      {children}
    </svg>
  );
}
