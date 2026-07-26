import type {
  RechargeCharge,
  RechargeStatus,
  WalletBalance,
  WalletTransaction,
} from '@/domain/wallet/walletTypes';
import { validateRechargeAmount } from '@/domain/wallet/walletValidation';
import { backend } from '@/services/backend';
import type { MoneyInCents } from '@/utils/money';

/**
 * Wallet use cases.
 *
 * There is deliberately no "add credit" function. A balance change is a
 * consequence of a confirmed payment, reported by the server — never something
 * the device performs. The old `sessionStore.addCredit` did exactly that, which
 * is how a user could gain credit without paying.
 */

export interface CreateRechargeRequest {
  amountInCents: MoneyInCents;
  /** Stable per top-up attempt so a retry cannot open a second charge. */
  idempotencyKey: string;
}

/**
 * Opens a PIX charge for a top-up.
 *
 * The returned charge is `pending`: no credit exists yet. Validation runs here
 * too, so a bad amount never reaches the network — the server validates again.
 */
export async function createRecharge(request: CreateRechargeRequest): Promise<RechargeCharge> {
  const invalid = validateRechargeAmount(request.amountInCents);
  if (invalid) throw invalid;

  return backend.createRecharge({
    amountInCents: request.amountInCents,
    idempotencyKey: request.idempotencyKey,
  });
}

/** Asks the server where a top-up stands. Only `paid` carries a balance. */
export function fetchRechargeStatus(rechargeId: string): Promise<RechargeStatus> {
  return backend.fetchRechargeStatus(rechargeId);
}

export function fetchWalletBalance(): Promise<WalletBalance> {
  return backend.fetchWalletBalance();
}

export function fetchWalletTransactions(): Promise<WalletTransaction[]> {
  return backend.fetchWalletTransactions();
}
