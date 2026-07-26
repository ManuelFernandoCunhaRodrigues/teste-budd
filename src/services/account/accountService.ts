import { backend } from '@/services/backend';
import { AppError, reportError } from '@/services/errors';

import { getAuthStorage } from '../auth/authStorage';
import { setAuthToken } from '../api/client';

/**
 * Account-level operations.
 *
 * Deletion is irreversible and can only be performed by the server, so the order
 * of operations matters: confirm remotely first, wipe locally second. The old
 * screen did neither — it showed a toast.
 */

export interface DeleteAccountInput {
  accessToken: string | null;
}

/**
 * Deletes the account, then clears everything tied to it on this device.
 *
 * Throws when the server refuses; the caller must keep the session intact in
 * that case. Local cleanup failures are reported but do not turn a completed
 * deletion into an error — the account is gone either way, and the token has
 * already been dropped from memory.
 */
export async function deleteAccount({ accessToken }: DeleteAccountInput): Promise<void> {
  if (!accessToken) {
    throw new AppError('unauthenticated', {
      userMessage: 'Sua sessão expirou. Entre novamente para excluir sua conta.',
      detail: 'deleteAccount: no access token',
    });
  }

  // Rejects on any failure — nothing below runs unless the server confirmed.
  await backend.deleteAccount(accessToken);

  // Stop authorising requests immediately, before any awaited cleanup.
  setAuthToken(null);

  try {
    const storage = await getAuthStorage();
    await storage.clear();
  } catch (error) {
    // The account no longer exists, so a stale keystore entry is unusable; it
    // must not surface to the user as a failed deletion.
    reportError(error, { scope: 'deleteAccount.clearStorage' });
  }
}
