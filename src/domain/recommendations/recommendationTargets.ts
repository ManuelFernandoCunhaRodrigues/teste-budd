import { ROUTES } from '@/constants/routes';
import { BARS } from '@/mocks/bars';
import { EVENTS } from '@/mocks/events';
import type { Recommendation } from '@/types/domain';

/**
 * Where a recommendation leads.
 *
 * Pure and separate from the screen so the mapping is testable, and so a target
 * that points at a non-existent id can be caught by a test rather than by a user
 * hitting an error screen (M-03).
 */

/** The route for a recommendation's target. */
export function recommendationHref(recommendation: Recommendation) {
  const { target } = recommendation;

  return target.type === 'bar' ? ROUTES.bar(target.barId) : ROUTES.event(target.eventId);
}

/** Whether the target id exists in the catalogue. */
export function isResolvableTarget(recommendation: Recommendation): boolean {
  const { target } = recommendation;

  return target.type === 'bar'
    ? BARS.some((bar) => bar.id === target.barId)
    : EVENTS.some((event) => event.id === target.eventId);
}

/** Human-readable destination, for an accessibility hint. */
export function recommendationTargetLabel(recommendation: Recommendation): string {
  return recommendation.target.type === 'bar' ? 'Abrir o bar' : 'Abrir o evento';
}
