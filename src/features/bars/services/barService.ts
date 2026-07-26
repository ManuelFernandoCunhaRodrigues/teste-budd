import { BARS } from '@/mocks/bars';
import { api } from '@/services/api/client';
import { ENDPOINTS } from '@/services/api/endpoints';
import { contentSourceMode, contentUnavailable } from '@/services/content/contentSource';
import { rejectMock, resolveMock } from '@/services/mock';
import type { Bar } from '@/types/domain';

/**
 * Venue data access.
 *
 * Chooses between the real API and the explicit development mock source. With no
 * configured source, it rejects as unavailable instead of falling back to seed
 * data that would look real in a production build.
 */

export function fetchBars(): Promise<Bar[]> {
  if (contentSourceMode === 'http') return api.get<Bar[]>(ENDPOINTS.bars);
  if (contentSourceMode === 'unavailable') {
    return Promise.reject(contentUnavailable('bars.list'));
  }

  return resolveMock(BARS);
}

export function fetchBarById(id: string): Promise<Bar> {
  if (contentSourceMode === 'http') return api.get<Bar>(ENDPOINTS.bar(id));
  if (contentSourceMode === 'unavailable') {
    return Promise.reject(contentUnavailable('bars.detail'));
  }

  const bar = BARS.find((candidate) => candidate.id === id);
  return bar ? resolveMock(bar) : rejectMock('Bar não encontrado.');
}

export function fetchFavoriteBars(ids: string[]): Promise<Bar[]> {
  return fetchBars().then((bars) => bars.filter((bar) => ids.includes(bar.id)));
}

export function fetchHostBarForEvent(eventId: string): Promise<Bar | null> {
  return fetchBars().then((bars) => {
    const hosts = bars.filter((bar) => bar.eventIds.includes(eventId));
    return hosts.length === 1 ? hosts[0] : null;
  });
}

/** Case- and accent-insensitive name search for the "Bares" tab. */
export function searchBars(query: string): Promise<Bar[]> {
  const normalised = normalise(query);
  if (!normalised) return fetchBars();

  return fetchBars().then((bars) =>
    bars.filter(
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
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
