import { useCallback, useRef, useState } from 'react';

import { isPaid, isSettling, type PaymentStatus } from '@/domain/payments/paymentStatus';
import type { PixCharge } from '@/domain/payments/paymentTypes';
import type { RechargeCharge } from '@/domain/wallet/walletTypes';
import { validateRechargeAmount } from '@/domain/wallet/walletValidation';
import { normalizeError, reportError } from '@/services/errors';
import { createRecharge, fetchRechargeStatus } from '@/services/wallet/walletService';
import { useWalletStore } from '@/store/walletStore';
import { createIdempotencyKey } from '@/utils/idempotency';
import type { MoneyInCents } from '@/utils/money';

export type RechargeStage = 'idle' | 'creating' | 'awaiting' | 'paid' | 'closed' | 'error';

export interface RechargeController {
  stage: RechargeStage;
  /** The open charge, once the server created one. */
  charge: PixCharge | null;
  recharge: RechargeCharge | null;
  status: PaymentStatus | null;
  error: string | null;
  isChecking: boolean;

  start: (amountInCents: MoneyInCents | null) => Promise<void>;
  check: () => Promise<void>;
  /** Abandons the current charge so a new amount can be entered. */
  reset: () => void;
}

/**
 * Drives one top-up attempt.
 *
 * Stage transitions mirror the payment, not the user's intent:
 *   idle -> creating -> awaiting -> paid
 *                            \-> closed (expired / failed / cancelled)
 *
 * `awaiting` never becomes `paid` locally. The only way in is the server
 * reporting `paid`, at which point the balance it returns replaces the local one.
 */
export function useRecharge(): RechargeController {
  const applyBalance = useWalletStore((state) => state.applyBalance);

  const [stage, setStage] = useState<RechargeStage>('idle');
  const [recharge, setRecharge] = useState<RechargeCharge | null>(null);
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const inFlightRef = useRef(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  const start = useCallback(
    async (amountInCents: MoneyInCents | null) => {
      if (inFlightRef.current) return;

      const invalid = validateRechargeAmount(amountInCents);
      if (invalid) {
        setError(invalid.userMessage);
        setStage('error');
        return;
      }

      inFlightRef.current = true;
      setStage('creating');
      setError(null);

      // Reused if the request times out and the user taps again, so the server
      // returns the original charge rather than opening a second one.
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = createIdempotencyKey('recharge');
      }

      try {
        const created = await createRecharge({
          // Non-null: `validateRechargeAmount` rejected null above.
          amountInCents: amountInCents as MoneyInCents,
          idempotencyKey: idempotencyKeyRef.current,
        });

        setRecharge(created);
        setStatus(created.charge.status);
        // A freshly created charge is awaiting payment — never treated as paid.
        setStage(isSettling(created.charge.status) ? 'awaiting' : 'closed');
      } catch (caught) {
        const normalized = normalizeError(caught);
        reportError(caught, { scope: 'useRecharge.start' });
        setError(normalized.userMessage);
        setStage('error');
      } finally {
        inFlightRef.current = false;
      }
    },
    [],
  );

  const check = useCallback(async () => {
    const current = recharge;
    if (!current || inFlightRef.current) return;

    inFlightRef.current = true;
    setIsChecking(true);
    setError(null);

    try {
      const result = await fetchRechargeStatus(current.rechargeId);
      setStatus(result.status);

      if (isPaid(result.status)) {
        // The balance is whatever the server says it is now.
        if (result.balance) applyBalance(result.balance);
        setStage('paid');
        return;
      }

      setStage(isSettling(result.status) ? 'awaiting' : 'closed');
    } catch (caught) {
      const normalized = normalizeError(caught);
      reportError(caught, { scope: 'useRecharge.check', rechargeId: current.rechargeId });
      // The charge stays open: a failed status read is not a failed payment.
      setError(normalized.userMessage);
    } finally {
      inFlightRef.current = false;
      setIsChecking(false);
    }
  }, [recharge, applyBalance]);

  const reset = useCallback(() => {
    idempotencyKeyRef.current = null;
    setRecharge(null);
    setStatus(null);
    setError(null);
    setStage('idle');
  }, []);

  return {
    stage,
    charge: recharge?.charge ?? null,
    recharge,
    status,
    error,
    isChecking,
    start,
    check,
    reset,
  };
}
