import { useAsyncData } from '@/hooks/useAsyncData';
import type { Event } from '@/types/domain';

import { fetchEventById, fetchFeedEvents } from '../services/eventService';

/**
 * Events for the ROLÊ feed.
 *
 * Unfiltered on purpose: the chips narrow the result client-side through
 * `filterEvents`, so switching a filter does not re-fetch.
 */
export function useFeedEvents() {
  return useAsyncData<Event[]>(() => fetchFeedEvents(), 'events:feed');
}

/** A single event, for the detail screen. */
export function useEvent(id: string | undefined) {
  return useAsyncData<Event>(
    () => (id ? fetchEventById(id) : Promise.resolve(null as unknown as Event)),
    `event:${id ?? ''}`,
  );
}
