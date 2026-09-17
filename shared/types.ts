export interface McDonald {
  id: string;
  name: string;
  lat: number;
  lon: number;
  region: string;
  city: string;
  address: string;
  opened: boolean;
}

export interface Visit {
  id: string;
  mcdonaldId: string;
  visitedAt: number;
  notes?: string;
}

export interface User {
  id: string;
  createdAt: number;
  totalVisits: number;
  totalPoints: number;
}

export interface Achievement {
  id: string;
  userId: string;
  type: 'LOCAL_HERO' | 'REGIONAL_MASTER' | 'NATION_CONQUEROR' | 'STREAK_7' | 'STREAK_30';
  unlockedAt: number;
  value?: number;
}

export interface RegionStats {
  region: string;
  total: number;
  visited: number;
  percentage: number;
}
