import { EVENTS, FEED_EVENT_IDS } from '@/mocks/events';
import { rejectMock, resolveMock } from '@/services/mock';
import type { Event } from '@/types/domain';

/** Event data access. Mock-backed; mirrors the `ENDPOINTS.events` shape. */

/**
 * Events shown in the ROLÊ feed's "Eventos" tab.
 *
 * Returns the full feed. Narrowing happens in `domain/events/eventFilters`, which
 * is pure and testable and can use context the service has no business knowing —
 * "Perto de mim" needs the device position. When the API takes over, the filter
 * ids become query parameters here.
 */
export function fetchFeedEvents(): Promise<Event[]> {
  return resolveMock(EVENTS.filter((event) => FEED_EVENT_IDS.includes(event.id)));
}

export function fetchEventById(id: string): Promise<Event> {
  const event = EVENTS.find((candidate) => candidate.id === id);
  return event ? resolveMock(event) : rejectMock('Evento não encontrado.');
}
