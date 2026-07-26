import type { MoneyInCents } from '@/utils/money';

/**
 * Order lifecycle as the app needs to reason about it.
 *
 * `pending_payment` deliberately does not clear the cart or promise anything —
 * see `orderService` for the rule table.
 */
export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'cancelled'
  | 'failed';

/**
 * What the client is allowed to send for one line.
 *
 * Note the absence of any price field: the server resolves the current price
 * for the product at that venue. A client-supplied amount would let a tampered
 * request set its own total.
 */
export interface OrderItemInput {
  productId: string;
  quantity: number;
  variantId?: string;
  selectedOptionIds?: string[];
  addOnIds?: string[];
  notes?: string;
}

export interface CreateOrderInput {
  venueId: string;
  items: OrderItemInput[];
  /**
   * Stable for the lifetime of one checkout attempt, including retries after a
   * timeout. The server must treat a repeat as "return the existing order",
   * never "create a second one".
   */
  idempotencyKey: string;
}

/** Every amount recalculated server-side. */
export interface OrderTotals {
  subtotalInCents: MoneyInCents;
  discountInCents: MoneyInCents;
  serviceFeeInCents: MoneyInCents;
  totalInCents: MoneyInCents;
}

export interface OrderLine {
  productId: string;
  name: string;
  quantity: number;
  unitPriceInCents: MoneyInCents;
  totalInCents: MoneyInCents;
}

export interface Order {
  id: string;
  venueId: string;
  venueName: string;
  status: OrderStatus;
  totals: OrderTotals;
  lines: OrderLine[];
  /** Present once a payment has been opened for this order. */
  paymentId?: string;
  createdAt: string;
}

/** An order the app is still waiting on, kept so a retry can resume it. */
export interface PendingOrderReference {
  orderId: string;
  venueId: string;
  idempotencyKey: string;
  createdAt: string;
}

export function isOrderSettled(status: OrderStatus): boolean {
  return status === 'confirmed' || status === 'preparing' || status === 'ready';
}
