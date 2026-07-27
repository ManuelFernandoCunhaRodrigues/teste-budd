import { useMemo } from 'react';

import type { Coordinate } from '@/types/domain';

import { filterShows, nearbyShows } from '../services/lineupService';
import type { LineUpFilters, LineUpShow, ShowWithDistance } from '../types';

export function useNearbyShows(
  shows: LineUpShow[],
  origin: Coordinate | null,
  filters: LineUpFilters,
  query: string,
): ShowWithDistance[] {
  return useMemo(() => {
    const filtered = filterShows(shows, query, filters);
    return nearbyShows(filtered, origin, filters.radiusKm);
  }, [filters, origin, query, shows]);
}
