/** Build targets the app is configured for. */
export type AppEnvironment = 'development' | 'staging' | 'production';

/** Which implementation serves the critical flows. */
export type BackendMode = 'http' | 'dev' | 'unavailable';

/**
 * Resolved, immutable configuration.
 *
 * `apiBaseUrl` and `whatsappSupportNumber` are nullable on purpose: "not
 * configured" is a real state that the UI has to represent honestly. The previous
 * config substituted a placeholder host for a missing URL, which meant a
 * misconfigured build looked correctly configured.
 */
export interface EnvironmentConfig {
  readonly environment: AppEnvironment;
  /** Normalised, without a trailing slash. `null` when unset. */
  readonly apiBaseUrl: string | null;
  readonly apiTimeoutMs: number;
  /** In-memory dev backend. Never true in production. */
  readonly enableMocks: boolean;
  /**
   * Draws a simulated map instead of Google Maps.
   *
   * For demonstrations only, and gated behind `__DEV__` like the mock backend:
   * a shipped build must never present a drawing as the map.
   */
  readonly useMockMap: boolean;
  /** Digits only, no `+`. `null` when unset or rejected. */
  readonly whatsappSupportNumber: string | null;
}

/** Why a configuration cannot be used. */
export type EnvironmentIssueCode =
  | 'api_url_missing'
  | 'api_url_invalid'
  | 'api_url_insecure'
  | 'api_url_local'
  | 'api_url_placeholder'
  | 'api_url_credentials'
  | 'api_timeout_invalid'
  | 'mocks_enabled_in_production'
  | 'whatsapp_number_invalid';

export interface EnvironmentIssue {
  readonly code: EnvironmentIssueCode;
  /**
   * Operator-facing explanation.
   *
   * Never contains the offending value: a config error routinely ends up in a CI
   * log, and echoing the URL or phone number there defeats the point of keeping
   * them out of the repository.
   */
  readonly message: string;
  /**
   * `blocking` stops the app from starting; `warning` is recorded and tolerated.
   *
   * A backend that is merely offline is not a configuration problem and must not
   * block startup — see `bootstrap`.
   */
  readonly severity: 'blocking' | 'warning';
}

export interface EnvironmentValidationResult {
  readonly isValid: boolean;
  readonly issues: readonly EnvironmentIssue[];
}
