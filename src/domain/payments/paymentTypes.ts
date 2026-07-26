import type { MoneyInCents } from '@/utils/money';

import type { PaymentStatus } from './paymentStatus';

export type PaymentMethod = 'pix' | 'wallet';

/**
 * A PIX charge as returned by the server.
 *
 * `qrCodePayload` is the "copia e cola" string. It is displayed and copied, but
 * never logged — see the redaction list in `services/errors`.
 */
export interface PixCharge {
  chargeId: string;
  status: PaymentStatus;
  amountInCents: MoneyInCents;
  qrCodePayload: string;
  /** ISO timestamp after which the charge can no longer be paid. */
  expiresAt: string;
}

export interface Payment {
  id: string;
  status: PaymentStatus;
  method: PaymentMethod;
  amountInCents: MoneyInCents;
  orderId?: string;
  chargeId?: string;
  /**
   * The PIX charge, when the payment is settled that way.
   *
   * Carried on the payment so the UI never has to reconstruct a QR payload or an
   * expiry from an id — a synthesised payload would be unpayable.
   */
  charge?: PixCharge;
}

export interface StartPaymentInput {
  orderId: string;
  method: PaymentMethod;
  idempotencyKey: string;
}

/** Whether a charge's expiry has passed, according to the device clock. */
export function isChargeExpired(charge: Pick<PixCharge, 'expiresAt'>, now = Date.now()): boolean {
  const expiry = Date.parse(charge.expiresAt);
  return Number.isFinite(expiry) && expiry <= now;
}
