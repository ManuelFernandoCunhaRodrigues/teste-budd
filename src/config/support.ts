/**
 * Support contact configuration.
 *
 * The number is public once it ships, so it is not a secret — but it still has to
 * be configured rather than hard-coded, because it differs per environment and
 * because a wrong value silently routes customers to a stranger.
 */

/**
 * Numbers known to be stand-ins.
 *
 * `5598999999999` was the value hard-coded in `constants/app.ts` (B-02). It is
 * listed explicitly rather than caught by a "repeated digits" heuristic, so a
 * legitimate number that happens to contain a run of nines is never rejected.
 */
const PLACEHOLDER_NUMBERS = new Set([
  '5598999999999',
  '5511999999999',
  '551199999999',
  '5500000000000',
  '1234567890',
  '0000000000',
]);

/** Brazilian numbers are 12–13 digits with the country code; allow some slack for other DDIs. */
const MIN_DIGITS = 10;
const MAX_DIGITS = 15;

/**
 * Reduces any accepted spelling to digits.
 *
 * `+55 (98) 91234-5678` and `5598912345678` both normalise to the same value, so
 * whoever sets the variable does not have to know the exact format `wa.me` wants.
 */
export function normalisePhoneNumber(raw: string): string {
  return raw.replace(/\D/g, '');
}

export type PhoneValidationResult =
  | { readonly valid: true; readonly number: string }
  | { readonly valid: false; readonly reason: 'empty' | 'too_short' | 'too_long' | 'placeholder' };

/** Normalises then range-checks a configured support number. */
export function validatePhoneNumber(raw: string | null | undefined): PhoneValidationResult {
  if (!raw || !raw.trim()) return { valid: false, reason: 'empty' };

  const digits = normalisePhoneNumber(raw);

  if (digits.length === 0) return { valid: false, reason: 'empty' };
  if (digits.length < MIN_DIGITS) return { valid: false, reason: 'too_short' };
  if (digits.length > MAX_DIGITS) return { valid: false, reason: 'too_long' };
  if (PLACEHOLDER_NUMBERS.has(digits)) return { valid: false, reason: 'placeholder' };

  return { valid: true, number: digits };
}

/**
 * Masks a number for logs and reports.
 *
 * `5598912345678` -> `+55 (98) *****-5678`.
 */
export function maskPhoneNumber(digits: string): string {
  if (digits.length < 4) return '*'.repeat(digits.length);

  const tail = digits.slice(-4);
  const ddi = digits.slice(0, 2);
  const ddd = digits.length >= 12 ? digits.slice(2, 4) : '';

  return ddd ? `+${ddi} (${ddd}) *****-${tail}` : `+${ddi} *****-${tail}`;
}

/**
 * What the user is contacting support about.
 *
 * Separated because they are not interchangeable: an order enquiry may need to
 * reach the venue rather than general support. Only `support` has a configured
 * number today; the rest are declared so a future venue/organiser number cannot
 * be silently routed to the support line.
 */
export type WhatsAppMessageContext = 'support' | 'order' | 'venue' | 'event';

export const WHATSAPP_MESSAGES: Record<WhatsAppMessageContext, string> = {
  support: 'Olá! Preciso de ajuda com minha conta no Budd.',
  order: 'Olá! Preciso de ajuda com um pedido no Budd.',
  venue: 'Olá! Tenho uma dúvida sobre um estabelecimento no Budd.',
  event: 'Olá! Tenho uma dúvida sobre um evento no Budd.',
};
