/**
 * Central access point for environment configuration.
 *
 * Only `EXPO_PUBLIC_*` variables are readable at runtime, and everything read
 * here is inlined into the JS bundle — never put a secret in this file or in
 * `.env`. Anything privileged belongs behind the API.
 */

const DEFAULT_API_URL = 'https://api.budd.app';

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const environment = {
  apiUrl: rawApiUrl || DEFAULT_API_URL,
  /** Request timeout in ms. */
  apiTimeout: Number(process.env.EXPO_PUBLIC_API_TIMEOUT ?? 15000),
  isDev: __DEV__,

  /**
   * Whether a real API base URL was configured explicitly.
   *
   * `DEFAULT_API_URL` is a placeholder host, so falling back to it does not
   * mean a backend exists. Critical flows check this before attempting a call:
   * reporting "unavailable" is honest, whereas firing a request at a host that
   * was never provisioned would surface as a confusing network error.
   */
  hasConfiguredApi: Boolean(rawApiUrl),

  /**
   * Opt-in in-memory backend used to exercise the real flows while no server
   * exists. Guarded by `__DEV__` as well as the flag, so it can never be
   * reached from a production build even if the variable is set at build time.
   */
  useDevBackend: __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEV_BACKEND === 'true',
} as const;

/**
 * Fails fast at startup when a required variable is missing, instead of
 * surfacing as a confusing network error later. Called from the root layout.
 */
export function assertEnvironment(): void {
  if (!environment.apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is not set and no default is available.');
  }
}

/** Which implementation backs the critical flows right now. */
export function resolveBackendMode(): 'http' | 'dev' | 'unavailable' {
  if (environment.useDevBackend) return 'dev';
  if (environment.hasConfiguredApi) return 'http';
  return 'unavailable';
}
