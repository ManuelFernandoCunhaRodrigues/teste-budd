import { setAuthToken } from '@/services/api/client';
import { backend } from '@/services/backend';
import { AppError, normalizeError, reportError } from '@/services/errors';

import { getAuthStorage } from './authStorage';
import type { AuthSession, SignInCredentials } from './authTypes';
import { isSessionExpired } from './authTypes';

/**
 * Authentication use cases.
 *
 * The store calls these and holds the result; nothing here touches React, and no
 * screen talks to the backend or to storage directly. Credentials are passed
 * through and never retained.
 */

/** Basic shape checks, so an obviously invalid form never costs a request. */
export function validateCredentials(credentials: SignInCredentials): {
  email?: string;
  password?: string;
} {
  const errors: { email?: string; password?: string } = {};

  const email = credentials.email.trim();
  if (!email) errors.email = 'Informe seu e-mail.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'E-mail inválido.';

  // Presence only. A minimum length is a *registration* rule: on sign-in the
  // server decides, and rejecting a short password here would lock out any
  // account whose password predates the rule while proving nothing about the
  // ones it lets through.
  if (!credentials.password) errors.password = 'Informe sua senha.';

  return errors;
}

/**
 * Exchanges credentials for a session and persists it.
 *
 * Throws `AppError` on failure — the caller must not treat a rejected promise as
 * anything but "not signed in".
 */
export async function signIn(credentials: SignInCredentials): Promise<AuthSession> {
  const response = await backend.signIn({
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  });

  const session: AuthSession = {
    accessToken: response.accessToken,
    user: response.user,
    expiresAt: response.expiresAt,
  };

  // Reject a token that is already past its expiry rather than storing it.
  if (isSessionExpired(session)) {
    throw new AppError('unauthenticated', {
      userMessage: 'Não foi possível iniciar a sessão. Tente novamente.',
      detail: 'signIn: server returned an already-expired token',
    });
  }

  const storage = await getAuthStorage();
  await storage.setSession(session);
  setAuthToken(session.accessToken);

  return session;
}

/**
 * Restores a stored session, validating it against the server.
 *
 * Returns `null` for every "not signed in" outcome. Any stored session that
 * cannot be validated is removed, so a stale token can never leave the app in a
 * half-authenticated state.
 */
export async function restoreSession(): Promise<AuthSession | null> {
  const storage = await getAuthStorage();

  let stored: AuthSession | null = null;
  try {
    stored = await storage.getSession();
  } catch (error) {
    // A keystore read failure must not brick the app on boot.
    reportError(error, { scope: 'restoreSession.read' });
    return null;
  }

  if (!stored) return null;

  if (isSessionExpired(stored)) {
    await clearStoredSession();
    return null;
  }

  try {
    // Local expiry is not proof of validity — the token may have been revoked.
    const user = await backend.fetchCurrentUser(stored.accessToken);
    setAuthToken(stored.accessToken);
    return { ...stored, user };
  } catch (error) {
    const normalized = normalizeError(error);

    // Only discard the token when the server actually rejected it. A network
    // blip must not sign the user out.
    if (normalized.code === 'unauthenticated' || normalized.code === 'forbidden') {
      await clearStoredSession();
      return null;
    }

    reportError(error, { scope: 'restoreSession.validate' });
    throw normalized;
  }
}

/**
 * Ends the session.
 *
 * The local token is always cleared, even if telling the server fails — the user
 * asked to sign out, and leaving a usable token on the device would be worse
 * than a stale server-side session.
 */
export async function signOut(accessToken: string | null): Promise<void> {
  if (accessToken) {
    try {
      await backend.signOut(accessToken);
    } catch (error) {
      reportError(error, { scope: 'signOut.remote' });
    }
  }

  await clearStoredSession();
}

async function clearStoredSession(): Promise<void> {
  setAuthToken(null);

  try {
    const storage = await getAuthStorage();
    await storage.clear();
  } catch (error) {
    reportError(error, { scope: 'clearStoredSession' });
  }
}
