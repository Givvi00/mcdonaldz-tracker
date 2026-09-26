import type { RegionTier } from '@/services/regions';

/** The colour of a region on every map of Italy (the app's and the card to share) */
export const TIER_FILL: Record<RegionTier, string> = {
  diamond: '#8FD3FF',
  gold: '#F5C542',
  silver: '#C7CDD3',
  progress: '#F6E7B0',
  empty: '#D9D3CA',
};
