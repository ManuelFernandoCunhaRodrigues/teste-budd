import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Coordinate } from '@/types/domain';

import {
  DEFAULT_LINEUP_FILTERS,
  filterShows,
  searchArtists,
  withDistances,
} from '../services/lineupService';
import type {
  LineUpArtist,
  LineUpFilters,
  LineUpMode,
  LineUpShow,
  ShowWithDistance,
} from '../types';

const SEARCH_DEBOUNCE_MS = 260;

export interface LineUpSearchState {
  query: string;
  debouncedQuery: string;
  mode: LineUpMode;
  filters: LineUpFilters;
  isSearching: boolean;
  filteredArtists: LineUpArtist[];
  filteredShows: ShowWithDistance[];
  setQuery: (query: string) => void;
  clearQuery: () => void;
  setMode: (mode: LineUpMode) => void;
  setFilters: (filters: LineUpFilters) => void;
  resetFilters: () => void;
}

export function useLineUpSearch(
  artists: LineUpArtist[],
  shows: LineUpShow[],
  origin: Coordinate | null,
): LineUpSearchState {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [mode, setMode] = useState<LineUpMode>('nearby');
  const [filters, setFilters] = useState<LineUpFilters>(DEFAULT_LINEUP_FILTERS);

  /**
   * Derived rather than stored.
   *
   * The two queries differ exactly while a keystroke is waiting out the
   * debounce, which is the definition of "searching". Keeping it in state meant
   * writing to it from inside the effect — the case `react-hooks` rejects — and
   * gave the flag its own chance to drift from the values it describes.
   */
  const isSearching = query !== debouncedQuery;

  useEffect(() => {
    // The cleanup is what discards a superseded search: a new keystroke clears
    // the pending timer before it can publish, so only the last one lands. The
    // request counter this replaced was tracking the same thing by hand.
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Stable across renders so the header and chips that receive them are not
  // re-rendered by a new function identity on every keystroke.
  const clearQuery = useCallback(() => setQuery(''), []);
  const resetFilters = useCallback(() => setFilters(DEFAULT_LINEUP_FILTERS), []);

  const filteredArtists = useMemo(
    () => searchArtists(debouncedQuery, artists, shows),
    [artists, debouncedQuery, shows],
  );

  const filteredShows = useMemo(() => {
    const next = filterShows(shows, debouncedQuery, filters);
    return withDistances(next, origin);
  }, [debouncedQuery, filters, origin, shows]);

  return {
    query,
    debouncedQuery,
    mode,
    filters,
    isSearching,
    filteredArtists,
    filteredShows,
    setQuery,
    clearQuery,
    setMode,
    setFilters,
    resetFilters,
  };
}
