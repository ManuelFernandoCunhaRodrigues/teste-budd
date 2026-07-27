import { setAuthToken } from '@/services/api/client';
import { backend } from '@/services/backend';
import { AppError, normalizeError, reportError } from '@/services/errors';

import { getAuthStorage } from './authStorage';
import type { AuthSession, SignInCredentials, SignUpInput } from './authTypes';
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

/** Shortest password a new account may choose. */
export const MIN_PASSWORD_LENGTH = 6;

export interface SignUpFormInput {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

/**
 * Validates a registration form.
 *
 * Separate from `validateCredentials` on purpose. Registration is the moment the
 * rules apply — a length floor here protects the account being created, while
 * the same check on sign-in would lock out anyone whose password predates it.
 */
export function validateSignUp(input: SignUpFormInput): Partial<Record<keyof SignUpFormInput, string>> {
  const errors: Partial<Record<keyof SignUpFormInput, string>> = {};

  if (!input.name.trim()) errors.name = 'Informe seu nome.';

  const email = input.email.trim();
  if (!email) errors.email = 'Informe seu e-mail.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'E-mail inválido.';

  if (!input.password) errors.password = 'Crie uma senha.';
  else if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use ao menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  // Checked even when the password itself is invalid: telling the user both
  // problems at once beats making them submit twice to learn the second.
  if (!input.passwordConfirmation) errors.passwordConfirmation = 'Repita a senha.';
  else if (input.passwordConfirmation !== input.password) {
    errors.passwordConfirmation = 'As senhas não coincidem.';
  }

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

  return persistSession(response, 'signIn');
}

/**
 * Creates an account and opens its session.
 *
 * Shares `persistSession` with sign-in rather than repeating it: the checks
 * that make a session trustworthy — rejecting an already-expired token, storing
 * before returning — must not have two implementations that can drift.
 */
export async function signUp(input: SignUpInput): Promise<AuthSession> {
  const response = await backend.signUp({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });

  return persistSession(response, 'signUp');
}

/** Validates, stores and activates a session returned by the server. */
async function persistSession(
  response: { accessToken: string; expiresAt: string; user: AuthSession['user'] },
  origin: string,
): Promise<AuthSession> {
  const session: AuthSession = {
    accessToken: response.accessToken,
    user: response.user,
    expiresAt: response.expiresAt,
  };

  // Reject a token that is already past its expiry rather than storing it.
  if (isSessionExpired(session)) {
    throw new AppError('unauthenticated', {
      userMessage: 'Não foi possível iniciar a sessão. Tente novamente.',
      detail: `${origin}: server returned an already-expired token`,
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
