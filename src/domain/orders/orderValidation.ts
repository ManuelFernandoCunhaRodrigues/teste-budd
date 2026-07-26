import type { CartItem } from '@/domain/cart/cartTypes';
import { AppError } from '@/services/errors';

import type { OrderItemInput } from './orderTypes';

/** Guard rails that are cheap to check on the device before spending a request. */
export const ORDER_LIMITS = {
  maxQuantityPerLine: 99,
  maxLines: 50,
} as const;

/**
 * Validates the cart and projects it onto the wire format.
 *
 * Throws `AppError('validation')` rather than returning a boolean so a caller
 * cannot accidentally proceed past a failed check.
 */
export function buildOrderItems(items: readonly CartItem[]): OrderItemInput[] {
  if (items.length === 0) {
    throw new AppError('validation', {
      userMessage: 'Seu carrinho está vazio.',
      detail: 'buildOrderItems: empty cart',
    });
  }

  if (items.length > ORDER_LIMITS.maxLines) {
    throw new AppError('validation', {
      userMessage: `Um pedido aceita no máximo ${ORDER_LIMITS.maxLines} itens diferentes.`,
      detail: `buildOrderItems: ${items.length} lines`,
    });
  }

  const venueIds = new Set(items.map((item) => item.venueId));
  if (venueIds.size > 1) {
    throw new AppError('validation', {
      userMessage: 'Seu carrinho tem itens de mais de um estabelecimento.',
      detail: `buildOrderItems: mixed venues ${[...venueIds].join(', ')}`,
    });
  }

  return items.map((item) => {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new AppError('validation', {
        userMessage: 'Um dos itens está com quantidade inválida.',
        detail: `buildOrderItems: quantity ${item.quantity} for ${item.productId}`,
      });
    }

    if (item.quantity > ORDER_LIMITS.maxQuantityPerLine) {
      throw new AppError('validation', {
        userMessage: `A quantidade máxima por item é ${ORDER_LIMITS.maxQuantityPerLine}.`,
        detail: `buildOrderItems: quantity ${item.quantity} for ${item.productId}`,
      });
    }

    return {
      productId: item.productId,
      quantity: item.quantity,
      ...(item.variantId ? { variantId: item.variantId } : {}),
      ...(item.selectedOptionIds?.length ? { selectedOptionIds: item.selectedOptionIds } : {}),
      ...(item.addOnIds?.length ? { addOnIds: item.addOnIds } : {}),
      ...(item.notes ? { notes: item.notes } : {}),
    };
  });
}

/** The venue a cart belongs to, or `null` when it is empty or inconsistent. */
export function resolveCartVenueId(items: readonly CartItem[]): string | null {
  if (items.length === 0) return null;

  const [first, ...rest] = items;
  return rest.every((item) => item.venueId === first.venueId) ? first.venueId : null;
}
