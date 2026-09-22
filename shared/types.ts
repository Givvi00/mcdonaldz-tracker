export interface McDonald {
  id: string;
  name: string;
  lat: number;
  lon: number;
  region: string;
  city: string;
  address: string;
  /** true while the restaurant is open. Closed ones are kept (never deleted) so visit history stays valid. */
  opened: boolean;
  /** ISO date (YYYY-MM-DD) when it was seen closing */
  closedAt?: string;
  /** ISO date (YYYY-MM-DD) when it first appeared in the list; absent for the original dataset */
  addedAt?: string;
}

/** Your own vote for a visited restaurant, 1 to 5 on each */
export interface VisitRating {
  cleanliness: number;
  staff: number;
  outdoorSpace: number;
  speed: number;
}

export interface Visit {
  id: string;
  mcdonaldId: string;
  visitedAt: number;
  /** The date was changed by hand: the time of day is no longer reliable, so time-based stamps ignore this visit */
  dateEdited?: boolean;
  /** True when the phone's own position was within GPS_VERIFY_RADIUS_KM of the restaurant the moment it was marked visited */
  verified?: boolean;
  rating?: VisitRating;
  notes?: string;
}

export interface User {
  id: string;
  /** Shown in the header; set in the Profile */
  name?: string;
  createdAt: number;
  totalVisits: number;
  totalPoints: number;
}

export interface Achievement {
  id: string;
  userId: string;
  /** A stamp id (see services/achievements) or `REGION:<name>` for a completed region */
  type: string;
  unlockedAt: number;
  value?: number;
}

export interface RegionStats {
  region: string;
  total: number;
  visited: number;
  percentage: number;
}
