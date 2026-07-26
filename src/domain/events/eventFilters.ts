import type { Coordinate, Event } from '@/types/domain';

/**
 * Event feed filtering.
 *
 * Pure and data-driven so it can be tested without a screen, and keyed by stable
 * ids rather than the visible label — renaming a chip must not silently disable
 * a filter, which is what happened when the service compared against the string
 * `'Gratuitos'`.
 */

export type EventFilterId = 'all' | 'free' | 'today' | 'weekend' | 'nearby';

export interface EventFilterOption {
  id: EventFilterId;
  label: string;
  /** Why the filter cannot run right now, if it cannot. */
  requires?: 'location';
}

export const EVENT_FILTER_OPTIONS: readonly EventFilterOption[] = [
  { id: 'all', label: 'Todos' },
  { id: 'today', label: 'Hoje' },
  { id: 'weekend', label: 'Fim de semana' },
  { id: 'nearby', label: 'Perto de mim', requires: 'location' },
  { id: 'free', label: 'Gratuitos' },
];

/** Radius for "Perto de mim", in kilometres. */
export const NEARBY_RADIUS_KM = 10;

export interface EventFilterContext {
  /** Reference instant. Injected so tests are not tied to the wall clock. */
  now?: Date;
  /** Present only when a real fix exists. */
  userCoordinate?: Coordinate | null;
}

/** Parses an ISO instant, returning `null` rather than an Invalid Date. */
function parseInstant(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Whether two instants fall on the same calendar day, in device local time. */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * True when the event is happening on `now`'s calendar day.
 *
 * Uses the whole interval rather than just the start, so a party running from
 * 22:00 to 04:00 still counts as "today" while it is in progress — checking only
 * `startsAt` would drop it the moment midnight passed.
 */
export function isToday(event: Event, now: Date): boolean {
  const start = parseInstant(event.startsAt);
  if (!start) return false;

  if (isSameDay(start, now)) return true;

  const end = parseInstant(event.endsAt);
  if (!end) return false;

  // Started earlier and still running.
  return start <= now && end >= now;
}

/**
 * True when the event starts on a Saturday or Sunday.
 *
 * Deliberately narrow: "fim de semana" here means the weekend day the event
 * begins on, in device local time. Friday nights are not included, because that
 * is a product decision no data in the model expresses.
 */
export function isOnWeekend(event: Event): boolean {
  const start = parseInstant(event.startsAt);
  if (!start) return false;

  const day = start.getDay();
  return day === 0 || day === 6;
}

/** Great-circle distance in kilometres. */
export function distanceKm(from: Coordinate, to: Coordinate): number {
  const EARTH_RADIUS_KM = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Free entry, decided by the amount rather than by the wording. */
export function isFree(event: Event): boolean {
  return event.priceFromInCents === 0;
}

/**
 * Whether a filter can be evaluated with what is currently known.
 *
 * "Perto de mim" needs a fix. Returning every event when there is none would be
 * silently wrong — the UI uses this to explain the dependency instead (§6.3).
 */
export function canApplyFilter(id: EventFilterId, context: EventFilterContext): boolean {
  if (id !== 'nearby') return true;
  return Boolean(context.userCoordinate);
}

/**
 * Applies one filter.
 *
 * Only one is selectable in the current design, so there is no combination rule
 * to document yet. `filterEvents` takes a list to keep that door open: multiple
 * filters would combine with AND.
 */
function matches(event: Event, id: EventFilterId, context: EventFilterContext): boolean {
  const now = context.now ?? new Date();

  switch (id) {
    case 'all':
      return true;
    case 'free':
      return isFree(event);
    case 'today':
      return isToday(event, now);
    case 'weekend':
      return isOnWeekend(event);
    case 'nearby': {
      const user = context.userCoordinate;
      // Unevaluable without both coordinates; excluding is the honest answer,
      // and the screen surfaces the reason.
      if (!user || !event.coordinate) return false;
      return distanceKm(user, event.coordinate) <= NEARBY_RADIUS_KM;
    }
  }
}

/**
 * Filters the feed. Never mutates the input.
 *
 * Different filters combine with AND.
 */
export function filterEvents(
  events: readonly Event[],
  filterIds: readonly EventFilterId[],
  context: EventFilterContext = {},
): Event[] {
  const active = filterIds.filter((id) => id !== 'all');
  if (active.length === 0) return [...events];

  return events.filter((event) => active.every((id) => matches(event, id, context)));
}
