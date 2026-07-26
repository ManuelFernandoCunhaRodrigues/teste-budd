import { useCallback, useRef, useState } from 'react';

import type { Order } from '@/domain/orders/orderTypes';
import { createOrder } from '@/services/orders/orderService';
import { normalizeError, reportError } from '@/services/errors';
import { selectCartItems, useCartStore } from '@/store/cartStore';
import { createIdempotencyKey } from '@/utils/idempotency';

export type CheckoutStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface CheckoutController {
  status: CheckoutStatus;
  /** User-safe message, or `null`. */
  error: string | null;
  order: Order | null;
  submit: () => Promise<Order | null>;
  reset: () => void;
}

/**
 * Drives one checkout attempt.
 *
 * Two separate guards stop a double submission: `isSubmittingRef` rejects a
 * second call synchronously — a state update is asynchronous and a fast double
 * tap can slip between renders — and the idempotency key is held across retries
 * so a timeout followed by another tap resolves to the *same* order server-side
 * instead of creating a second one.
 *
 * The cart is never cleared here. Clearing happens only once an order is
 * confirmed, which the order status screen decides.
 */
export function useCheckout(): CheckoutController {
  const items = useCartStore(selectCartItems);

  const [status, setStatus] = useState<CheckoutStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const isSubmittingRef = useRef(false);
  /**
   * Survives failed attempts on purpose: retrying the same cart must reuse the
   * key. Cleared only by `reset`, once the attempt is finished for good.
   */
  const idempotencyKeyRef = useRef<string | null>(null);

  const submit = useCallback(async (): Promise<Order | null> => {
    if (isSubmittingRef.current) return null;

    isSubmittingRef.current = true;
    setStatus('submitting');
    setError(null);

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = createIdempotencyKey('order');
    }

    try {
      const created = await createOrder({
        items,
        idempotencyKey: idempotencyKeyRef.current,
      });

      setOrder(created);
      setStatus('success');
      return created;
    } catch (caught) {
      const normalized = normalizeError(caught);
      reportError(caught, { scope: 'useCheckout.submit', itemCount: items.length });

      // Cart is left untouched — the shopper keeps everything they assembled.
      setError(normalized.userMessage);
      setStatus('error');
      return null;
    } finally {
      isSubmittingRef.current = false;
    }
  }, [items]);

  const reset = useCallback(() => {
    idempotencyKeyRef.current = null;
    setStatus('idle');
    setError(null);
    setOrder(null);
  }, []);

  return { status, error, order, submit, reset };
}
