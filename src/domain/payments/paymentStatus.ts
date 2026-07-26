/**
 * Payment lifecycle.
 *
 * The whole point of modelling this explicitly is that only `paid` may unlock
 * value — credit a wallet, issue a ticket, confirm an order. `created` and
 * `pending` mean "we are waiting", which is the confusion the original screens
 * made by treating a tapped button as a completed payment.
 */
export type PaymentStatus = 'created' | 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';

/** The only status that may release value. */
export function isPaid(status: PaymentStatus): boolean {
  return status === 'paid';
}

/** Still worth polling: the payment can still become `paid`. */
export function isSettling(status: PaymentStatus): boolean {
  return status === 'created' || status === 'pending';
}

/** Reached a final state that is not a success. */
export function isUnsuccessfulFinal(status: PaymentStatus): boolean {
  return status === 'failed' || status === 'expired' || status === 'cancelled';
}

/** Whether the user may retry with a fresh charge. */
export function canRetry(status: PaymentStatus): boolean {
  return isUnsuccessfulFinal(status);
}

const LABELS: Record<PaymentStatus, string> = {
  created: 'Gerando cobrança',
  pending: 'Aguardando pagamento',
  paid: 'Pagamento confirmado',
  failed: 'Pagamento não aprovado',
  expired: 'Cobrança expirada',
  cancelled: 'Cobrança cancelada',
};

export function paymentStatusLabel(status: PaymentStatus): string {
  return LABELS[status];
}
