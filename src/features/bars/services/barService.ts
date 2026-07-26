import { BARS } from '@/mocks/bars';
import { rejectMock, resolveMock } from '@/services/mock';
import type { Bar } from '@/types/domain';

/**
 * Venue data access.
 *
 * Currently backed by mocks; each function maps 1:1 onto an endpoint in
 * `ENDPOINTS`, so the switch to `api.get(...)` is local to this file.
 */

export function fetchBars(): Promise<Bar[]> {
  return resolveMock(BARS);
}

export function fetchBarById(id: string): Promise<Bar> {
  const bar = BARS.find((candidate) => candidate.id === id);
  return bar ? resolveMock(bar) : rejectMock('Bar não encontrado.');
}

export function fetchFavoriteBars(ids: string[]): Promise<Bar[]> {
  return resolveMock(BARS.filter((bar) => ids.includes(bar.id)));
}

/** Case- and accent-insensitive name search for the "Bares" tab. */
export function searchBars(query: string): Promise<Bar[]> {
  const normalised = normalise(query);
  if (!normalised) return resolveMock(BARS);

  return resolveMock(
    BARS.filter(
      (bar) =>
        normalise(bar.name).includes(normalised) || normalise(bar.category).includes(normalised),
    ),
  );
}

/** Lower-cases and strips accents so "terraco" matches "Terraço". */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    // Removes the combining accents that NFD decomposition leaves behind.
    .replace(/[̀-ͯ]/g, '')
    .trim();
}
