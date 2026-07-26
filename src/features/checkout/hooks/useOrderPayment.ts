import { useCallback, useEffect, useRef, useState } from 'react';

import { isOrderSettled, type Order } from '@/domain/orders/orderTypes';
import { isPaid, isSettling } from '@/domain/payments/paymentStatus';
import type { Payment } from '@/domain/payments/paymentTypes';
import { normalizeError, reportError } from '@/services/errors';
import { fetchOrder, fetchPayment, startOrderPayment } from '@/services/orders/orderService';
import { useCartStore } from '@/store/cartStore';
import { createIdempotencyKey } from '@/utils/idempotency';

export type OrderPaymentStatus = 'loading' | 'ready' | 'error';

export interface OrderPaymentController {
  status: OrderPaymentStatus;
  order: Order | null;
  payment: Payment | null;
  error: string | null;
  isWorking: boolean;
  /** Re-reads order and payment from the server. */
  refresh: () => void;
  /** Opens a PIX charge for this order. */
  startPix: () => void;
  /** Opens a fresh charge after a failed or expired one. */
  retry: () => void;
}

interface OrderSnapshot {
  order: Order;
  payment: Payment | null;
}

/**
 * Owns the payment lifecycle for one order.
 *
 * The cart is cleared here, and only here: exactly once, the first time the
 * server reports the order settled. Clearing on "order created" would strand a
 * shopper whose PIX charge later expired — they would have neither an order nor
 * the items they picked.
 *
 * State is written from promise callbacks rather than from an async function
 * awaited in the effect body, matching `useAsyncData`: a synchronous `setState`
 * reachable from an effect cascades renders.
 */
export function useOrderPayment(orderId: string): OrderPaymentController {
  const clearCart = useCartStore((state) => state.clear);

  const [status, setStatus] = useState<OrderPaymentStatus>('loading');
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const inFlightRef = useRef(false);
  const paymentKeyRef = useRef<string | null>(null);
  const cartClearedRef = useRef(false);

  /** Clears the cart once the order is genuinely settled. */
  const settleCartIfConfirmed = useCallback(
    (candidate: Order) => {
      if (cartClearedRef.current) return;
      if (!isOrderSettled(candidate.status)) return;

      cartClearedRef.current = true;
      clearCart();
    },
    [clearCart],
  );

  /** Pure read — performs no state updates of its own. */
  const readSnapshot = useCallback(async (): Promise<OrderSnapshot> => {
    const nextOrder = await fetchOrder(orderId);
    if (!nextOrder.paymentId) return { order: nextOrder, payment: null };

    const nextPayment = await fetchPayment(nextOrder.paymentId);

    // A settled payment can land before the order record catches up.
    if (isPaid(nextPayment.status)) {
      return { order: await fetchOrder(orderId), payment: nextPayment };
    }

    return { order: nextOrder, payment: nextPayment };
  }, [orderId]);

  const applySnapshot = useCallback(
    (snapshot: OrderSnapshot) => {
      setOrder(snapshot.order);
      setPayment(snapshot.payment);
      settleCartIfConfirmed(snapshot.order);
      setStatus('ready');
      setError(null);
    },
    [settleCartIfConfirmed],
  );

  const applyFailure = useCallback((caught: unknown, scope: string) => {
    const normalized = normalizeError(caught);
    reportError(caught, { scope });
    setError(normalized.userMessage);
    // Keep showing an order that was already loaded; only a first-load failure
    // becomes an error screen.
    setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    inFlightRef.current = true;

    readSnapshot()
      .then((snapshot) => {
        if (cancelled) return;
        applySnapshot(snapshot);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        applyFailure(caught, 'useOrderPayment.readSnapshot');
      })
      .finally(() => {
        inFlightRef.current = false;
        if (!cancelled) setIsWorking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [readSnapshot, applySnapshot, applyFailure, attempt]);

  /** Re-runs the read through the effect above. */
  const refresh = useCallback(() => {
    if (inFlightRef.current) return;
    setIsWorking(true);
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  const openCharge = useCallback(
    (freshKey: boolean) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setIsWorking(true);
      setError(null);

      // Same key across retries of one attempt; a deliberate "new charge" asks
      // for a new key.
      if (freshKey || !paymentKeyRef.current) {
        paymentKeyRef.current = createIdempotencyKey('pay');
      }

      startOrderPayment({ orderId, method: 'pix', idempotencyKey: paymentKeyRef.current })
        .then(() => readSnapshot())
        .then(applySnapshot)
        .catch((caught: unknown) => applyFailure(caught, 'useOrderPayment.openCharge'))
        .finally(() => {
          inFlightRef.current = false;
          setIsWorking(false);
        });
    },
    [orderId, readSnapshot, applySnapshot, applyFailure],
  );

  const startPix = useCallback(() => openCharge(false), [openCharge]);
  const retry = useCallback(() => openCharge(true), [openCharge]);

  return { status, order, payment, error, isWorking, refresh, startPix, retry };
}

/** True while the payment can still become `paid`. */
export function isAwaitingPayment(payment: Payment | null): boolean {
  return payment !== null && isSettling(payment.status);
}
