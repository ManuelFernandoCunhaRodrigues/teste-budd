import { Linking } from 'react-native';

import { environment } from '@/config/environment';
import {
  WHATSAPP_MESSAGES,
  type WhatsAppMessageContext,
} from '@/config/support';
import { reportError } from '@/services/errors';

/**
 * Opening WhatsApp.
 *
 * The number comes from configuration and is validated before it gets here, so
 * this module never has to decide whether a number is real. It also never falls
 * back to a hard-coded value — B-02 was a placeholder number wired straight into
 * the profile menu, which would have sent customers to a stranger.
 */

/** `wa.me` works in the browser too, so no `whatsapp://` scheme is needed. */
const WA_ME_BASE = 'https://wa.me';

/**
 * Builds the deep link.
 *
 * The message is percent-encoded; concatenating it raw breaks on the first `&`
 * or accent and can smuggle extra query parameters.
 */
export function buildWhatsAppUrl(phoneNumber: string, message?: string): string {
  const base = `${WA_ME_BASE}/${phoneNumber}`;
  if (!message) return base;

  return `${base}?text=${encodeURIComponent(message)}`;
}

export type OpenWhatsAppResult =
  | { readonly status: 'opened' }
  /** No usable number configured — the caller should have disabled the control. */
  | { readonly status: 'not_configured' }
  /** Nothing on the device can handle the link. */
  | { readonly status: 'unsupported' }
  | { readonly status: 'failed' };

/** The configured support number, or `null` when unavailable. */
export function getSupportNumber(): string | null {
  return environment.whatsappSupportNumber;
}

/** Whether the support entry point should be offered at all. */
export function isWhatsAppSupportAvailable(): boolean {
  return getSupportNumber() !== null;
}

/**
 * Opens support in WhatsApp.
 *
 * Returns a result rather than throwing, so a screen can show the right message
 * without a try/catch around a UI handler.
 */
export async function openWhatsAppSupport(
  context: WhatsAppMessageContext = 'support',
): Promise<OpenWhatsAppResult> {
  const phoneNumber = getSupportNumber();

  // Refusing here is the last line of defence: with no configured number there
  // is no correct destination, and opening a guess would be worse than failing.
  if (!phoneNumber) return { status: 'not_configured' };

  const url = buildWhatsAppUrl(phoneNumber, WHATSAPP_MESSAGES[context]);

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) return { status: 'unsupported' };

    await Linking.openURL(url);
    return { status: 'opened' };
  } catch (error) {
    // The number is not included in the report — `reportError` redacts it, and
    // the scope is enough to locate the failure.
    reportError(error, { scope: 'openWhatsAppSupport', context });
    return { status: 'failed' };
  }
}

/** User-facing copy per failure. `opened` needs none. */
export const WHATSAPP_ERROR_MESSAGES: Record<
  Exclude<OpenWhatsAppResult['status'], 'opened'>,
  string
> = {
  not_configured: 'Atendimento indisponível no momento.',
  unsupported: 'Não foi possível abrir o atendimento pelo WhatsApp.',
  failed: 'Não foi possível abrir o atendimento pelo WhatsApp.',
};
