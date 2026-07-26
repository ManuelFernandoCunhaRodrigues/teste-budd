import { RECHARGE } from '@/constants/app';
import { AppError } from '@/services/errors';
import { formatCents, type MoneyInCents } from '@/utils/money';

/**
 * Validates a top-up amount before a charge is requested.
 *
 * Returns an `AppError` instead of throwing so the screen can render the message
 * inline under the field. `null` means the amount is acceptable *to the client* —
 * the server validates again before creating the charge.
 */
export function validateRechargeAmount(amountInCents: MoneyInCents | null): AppError | null {
  if (amountInCents === null) {
    return new AppError('validation', {
      userMessage: 'Informe o valor da recarga.',
      detail: 'validateRechargeAmount: empty',
    });
  }

  // Catches NaN and Infinity, which would otherwise slip past the range checks.
  if (!Number.isFinite(amountInCents)) {
    return new AppError('validation', {
      userMessage: 'Informe um valor válido.',
      detail: `validateRechargeAmount: non-finite ${amountInCents}`,
    });
  }

  if (!Number.isInteger(amountInCents)) {
    return new AppError('validation', {
      userMessage: 'O valor não pode ter mais de duas casas decimais.',
      detail: `validateRechargeAmount: fractional cents ${amountInCents}`,
    });
  }

  if (amountInCents <= 0) {
    return new AppError('validation', {
      userMessage: 'O valor da recarga deve ser maior que zero.',
      detail: `validateRechargeAmount: ${amountInCents} <= 0`,
    });
  }

  if (amountInCents < RECHARGE.minInCents) {
    return new AppError('validation', {
      userMessage: `O valor mínimo é ${formatCents(RECHARGE.minInCents)}.`,
      detail: `validateRechargeAmount: ${amountInCents} below min`,
    });
  }

  if (amountInCents > RECHARGE.maxInCents) {
    return new AppError('validation', {
      userMessage: `O valor máximo é ${formatCents(RECHARGE.maxInCents)}.`,
      detail: `validateRechargeAmount: ${amountInCents} above max`,
    });
  }

  return null;
}

/** Fee preview shown before the charge exists. Server figures are authoritative. */
export function previewRechargeFee(amountInCents: MoneyInCents): {
  feeInCents: MoneyInCents;
  netInCents: MoneyInCents;
} {
  const feeInCents = Math.round(amountInCents * RECHARGE.feeRate);
  return { feeInCents, netInCents: amountInCents - feeInCents };
}
