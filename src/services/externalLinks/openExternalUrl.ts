import { Linking } from 'react-native';

import { reportError } from '@/services/errors';

/**
 * Opening an arbitrary external URL.
 *
 * Separate from the WhatsApp helper because the risks differ: a support number is
 * configuration we control, whereas these URLs come from content. The scheme is
 * checked before handing the value to the OS, so a `javascript:` or `file:` link
 * in a data payload cannot be launched.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export type OpenExternalUrlResult =
  | { readonly status: 'opened' }
  /** Absent, malformed, or a scheme we refuse to launch. */
  | { readonly status: 'invalid' }
  /** Nothing on the device handles the link. */
  | { readonly status: 'unsupported' }
  | { readonly status: 'failed' };

/** Whether a value is a launchable web URL. */
export function isLaunchableUrl(raw: string | null | undefined): boolean {
  if (!raw || !raw.trim()) return false;

  try {
    return ALLOWED_PROTOCOLS.has(new URL(raw.trim()).protocol);
  } catch {
    return false;
  }
}

/** Opens a web URL, returning the outcome instead of throwing. */
export async function openExternalUrl(
  raw: string | null | undefined,
): Promise<OpenExternalUrlResult> {
  if (!isLaunchableUrl(raw)) return { status: 'invalid' };

  const url = (raw as string).trim();

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) return { status: 'unsupported' };

    await Linking.openURL(url);
    return { status: 'opened' };
  } catch (error) {
    reportError(error, { scope: 'openExternalUrl' });
    return { status: 'failed' };
  }
}

/** User-facing copy per failure. */
export const EXTERNAL_URL_ERROR_MESSAGES: Record<
  Exclude<OpenExternalUrlResult['status'], 'opened'>,
  string
> = {
  invalid: 'Este link não está disponível.',
  unsupported: 'Não foi possível abrir o link neste dispositivo.',
  failed: 'Não foi possível abrir o link.',
};
