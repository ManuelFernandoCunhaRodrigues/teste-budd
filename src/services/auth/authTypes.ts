/** The user identity the app renders. Never includes credentials. */
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * A session as held in memory.
 *
 * `expiresAt` lets the app reject a stale token locally on boot instead of
 * waiting for the first 401, which is what makes the restore path predictable.
 */
export interface AuthSession {
  accessToken: string;
  user: AuthenticatedUser;
  /** ISO timestamp. */
  expiresAt: string;
}

/** Wire shape returned by the sign-in endpoint. */
export interface SignInResponse {
  accessToken: string;
  expiresAt: string;
  user: AuthenticatedUser;
}

export function isSessionExpired(session: Pick<AuthSession, 'expiresAt'>, now = Date.now()): boolean {
  const expiry = Date.parse(session.expiresAt);
  // An unparseable expiry is treated as expired: failing closed is the safe
  // direction for an auth check.
  if (!Number.isFinite(expiry)) return true;
  return expiry <= now;
}

/** Shape-checks an untrusted payload before it is trusted as a session. */
export function isValidSignInResponse(value: unknown): value is SignInResponse {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<SignInResponse>;
  const user = candidate.user as Partial<AuthenticatedUser> | undefined;

  return (
    typeof candidate.accessToken === 'string' &&
    candidate.accessToken.length > 0 &&
    typeof candidate.expiresAt === 'string' &&
    typeof user === 'object' &&
    user !== null &&
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string'
  );
}
