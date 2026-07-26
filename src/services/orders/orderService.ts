import type { CartItem } from '@/domain/cart/cartTypes';
import { buildOrderItems, resolveCartVenueId } from '@/domain/orders/orderValidation';
import type { Order } from '@/domain/orders/orderTypes';
import type { Payment, PaymentMethod } from '@/domain/payments/paymentTypes';
import { backend } from '@/services/backend';
import { AppError } from '@/services/errors';

/**
 * Checkout use cases.
 *
 * The cart-clearing rule lives here, in one place, because getting it wrong is
 * how the original bug worked: the old screen cleared the cart and announced
 * success before anything had been created.
 *
 * | outcome                      | cart      |
 * |------------------------------|-----------|
 * | validation failed            | kept      |
 * | create failed (any reason)   | kept      |
 * | timeout, no confirmation     | kept      |
 * | created, payment pending     | kept      |
 * | created and confirmed        | cleared   |
 *
 * "Created" alone is not enough to clear it — an order awaiting payment can still
 * expire, and the shopper would be left with neither an order nor a cart.
 */

export interface CreateOrderRequest {
  items: readonly CartItem[];
  /** Stable per checkout attempt, reused on retry. */
  idempotencyKey: string;
}

/**
 * Creates the order server-side.
 *
 * Validates locally first so an obviously invalid cart costs nothing, then lets
 * the server price everything: no amount is sent from the device.
 */
export async function createOrder(request: CreateOrderRequest): Promise<Order> {
  const venueId = resolveCartVenueId(request.items);

  if (!venueId) {
    throw new AppError('validation', {
      userMessage: request.items.length
        ? 'Seu carrinho tem itens de mais de um estabelecimento.'
        : 'Seu carrinho está vazio.',
      detail: 'createOrder: could not resolve a single venue',
    });
  }

  // Throws `AppError('validation')` on bad quantities or mixed venues.
  const items = buildOrderItems(request.items);

  return backend.createOrder({ venueId, items, idempotencyKey: request.idempotencyKey });
}

export interface StartOrderPaymentRequest {
  orderId: string;
  method: PaymentMethod;
  idempotencyKey: string;
}

export function startOrderPayment(request: StartOrderPaymentRequest): Promise<Payment> {
  return backend.startPayment(request);
}

export function fetchOrder(orderId: string): Promise<Order> {
  return backend.fetchOrder(orderId);
}

export function fetchPayment(paymentId: string): Promise<Payment> {
  return backend.fetchPayment(paymentId);
}
