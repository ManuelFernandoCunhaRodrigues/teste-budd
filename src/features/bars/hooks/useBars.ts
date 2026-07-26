import { useAsyncData } from '@/hooks/useAsyncData';
import { useDebounce } from '@/hooks/useDebounce';
import { useFavoritesStore } from '@/store/favoritesStore';
import type { Bar } from '@/types/domain';

import { fetchBarById, fetchFavoriteBars, searchBars } from '../services/barService';

/** Venue list for the ROLÊ feed, filtered by the search field. */
export function useBars(query = '') {
  const debouncedQuery = useDebounce(query, 250);
  return useAsyncData<Bar[]>(() => searchBars(debouncedQuery), `bars:${debouncedQuery}`);
}

/** A single venue, for the detail screen. */
export function useBar(id: string | undefined) {
  return useAsyncData<Bar>(
    () => (id ? fetchBarById(id) : Promise.resolve(null as unknown as Bar)),
    `bar:${id ?? ''}`,
  );
}

/** The user's saved venues, kept in sync with the favourites store. */
export function useFavoriteBars() {
  const barIds = useFavoritesStore((state) => state.barIds);
  return useAsyncData<Bar[]>(() => fetchFavoriteBars(barIds), `favorites:${barIds.join(',')}`);
}
