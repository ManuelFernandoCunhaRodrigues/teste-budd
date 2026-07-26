import { EVENTS, FEED_EVENT_IDS } from '@/mocks/events';
import { api } from '@/services/api/client';
import { ENDPOINTS } from '@/services/api/endpoints';
import { contentSourceMode, contentUnavailable } from '@/services/content/contentSource';
import { rejectMock, resolveMock } from '@/services/mock';
import type { Event } from '@/types/domain';

/** Event data access. Mock data is only used when explicitly enabled for dev. */

/**
 * Events shown in the ROLÊ feed's "Eventos" tab.
 *
 * Returns the full feed. Narrowing happens in `domain/events/eventFilters`, which
 * is pure and testable and can use context the service has no business knowing:
 * "Perto de mim" needs the device position.
 */
export function fetchFeedEvents(): Promise<Event[]> {
  if (contentSourceMode === 'http') return api.get<Event[]>(ENDPOINTS.events);
  if (contentSourceMode === 'unavailable') {
    return Promise.reject(contentUnavailable('events.feed'));
  }

  return resolveMock(EVENTS.filter((event) => FEED_EVENT_IDS.includes(event.id)));
}

export function fetchEventById(id: string): Promise<Event> {
  if (contentSourceMode === 'http') return api.get<Event>(ENDPOINTS.event(id));
  if (contentSourceMode === 'unavailable') {
    return Promise.reject(contentUnavailable('events.detail'));
  }

  const event = EVENTS.find((candidate) => candidate.id === id);
  return event ? resolveMock(event) : rejectMock('Evento não encontrado.');
}

export function fetchEventsByIds(ids: string[]): Promise<Event[]> {
  if (ids.length === 0) return Promise.resolve([]);
  if (contentSourceMode === 'http') {
    return api
      .get<Event[]>(ENDPOINTS.events)
      .then((events) => events.filter((event) => ids.includes(event.id)));
  }
  if (contentSourceMode === 'unavailable') {
    return Promise.reject(contentUnavailable('events.byIds'));
  }

  return resolveMock(EVENTS.filter((event) => ids.includes(event.id)));
}
