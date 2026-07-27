import type { Bar, Event, Product } from '@/types/domain';

/**
 * What the assistant understood a message to be about.
 *
 * A closed union rather than free-form text: every intent has to map to results
 * the app can actually show, and a new one cannot be added without deciding
 * where its answer comes from.
 */
export type AssistantIntentId =
  | 'live-music'
  | 'date'
  | 'group'
  | 'promotions'
  | 'top-rated'
  | 'events-today'
  | 'featured-products'
  | 'bars-nearby'
  | 'fallback';

/**
 * A card the assistant can answer with.
 *
 * Carries the domain object itself, not a flattened copy, so the chat renders
 * venues and events through the same components as the rest of the app instead
 * of a second presentation of the same data.
 */
export type AssistantResult =
  | { kind: 'bar'; id: string; bar: Bar }
  | { kind: 'event'; id: string; event: Event }
  | { kind: 'product'; id: string; product: Product; venueId: string; venueName: string };

export interface AssistantAnswer {
  intent: AssistantIntentId;
  /** What the assistant says above the cards. */
  reply: string;
  results: AssistantResult[];
  /** Chips offered after the answer, to keep the conversation moving. */
  followUps: string[];
}

/** A starter chip. `query` is fed through the engine as if the user typed it. */
export interface QuickSuggestion {
  id: AssistantIntentId;
  label: string;
  query: string;
}

export type AssistantAuthor = 'user' | 'assistant';

export interface AssistantMessage {
  id: string;
  author: AssistantAuthor;
  text: string;
  /** Only assistant messages carry cards. */
  results?: AssistantResult[];
  followUps?: string[];
}
