import type { MoneyInCents } from '@/utils/money';

import type { PaymentStatus } from '@/domain/payments/paymentStatus';
import type { PixCharge } from '@/domain/payments/paymentTypes';

/**
 * Wallet balance.
 *
 * Always the value the server reported. The device never computes or increments
 * it — that was the defect behind the fake top-up.
 */
export interface WalletBalance {
  balanceInCents: MoneyInCents;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  kind: 'credit' | 'debit';
  amountInCents: MoneyInCents;
  status: PaymentStatus;
  description: string;
  createdAt: string;
}

export interface CreateRechargeInput {
  amountInCents: MoneyInCents;
  /** Repeat submissions of the same attempt must not create a second charge. */
  idempotencyKey: string;
}

/** What the server returns when a top-up charge is opened. */
export interface RechargeCharge {
  rechargeId: string;
  charge: PixCharge;
  /** Fee the provider takes, already resolved server-side. */
  feeInCents: MoneyInCents;
  /** What actually lands in the wallet once paid. */
  netInCents: MoneyInCents;
}

/** Result of asking the server where a top-up stands. */
export interface RechargeStatus {
  rechargeId: string;
  status: PaymentStatus;
  /** Present only once `status === 'paid'`. */
  balance?: WalletBalance;
}
