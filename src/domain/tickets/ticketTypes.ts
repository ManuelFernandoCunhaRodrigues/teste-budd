import type { MoneyInCents } from '@/utils/money';

/** A price tier / lote for an event. */
export interface TicketTier {
  id: string;
  eventId: string;
  name: string;
  priceInCents: MoneyInCents;
  /** Remaining units. `0` means sold out. */
  available: number;
  maxPerUser: number;
}

/** Why ticket purchase is closed, when it is. */
export type TicketAvailability =
  | { kind: 'available'; tiers: TicketTier[] }
  | { kind: 'sold_out' }
  | { kind: 'event_ended' }
  | { kind: 'unavailable'; reason: string };

export type TicketStatus = 'reserved' | 'issued' | 'cancelled' | 'expired';

/**
 * A temporary hold taken before payment, so the seat cannot be sold twice while
 * the shopper is paying. Expires on its own if payment never completes.
 */
export interface TicketReservation {
  id: string;
  eventId: string;
  tierId: string;
  quantity: number;
  totalInCents: MoneyInCents;
  expiresAt: string;
  status: TicketStatus;
}

/** An issued ticket. Only ever produced after a confirmed payment. */
export interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  tierName: string;
  /** Unique identifier used for entry validation. */
  code: string;
  status: TicketStatus;
  issuedAt: string;
}

export interface CreateReservationInput {
  eventId: string;
  tierId: string;
  quantity: number;
  idempotencyKey: string;
}

export function isTicketPurchasable(availability: TicketAvailability): boolean {
  return availability.kind === 'available' && availability.tiers.some((tier) => tier.available > 0);
}
