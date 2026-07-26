import type { EnvironmentIssue } from '@/config/environment.types';
import type { HealthcheckResult } from '@/services/health/healthcheckService';

/** Whether a task must finish before the app may navigate. */
export type BootstrapTaskPriority = 'blocking' | 'non-blocking';

export type BootstrapStatus = 'idle' | 'running' | 'ready' | 'error';

/** Why startup could not complete. Each maps to different recovery copy. */
export type BootstrapErrorCode =
  /** Configuration is unusable — retrying will not help until it is fixed. */
  | 'invalid_environment'
  /** A blocking task exceeded its budget. */
  | 'timeout'
  | 'unknown';

export interface BootstrapError {
  readonly code: BootstrapErrorCode;
  /** Safe to render. Never a stack trace. */
  readonly userMessage: string;
  /** Operator detail for logs only. */
  readonly detail?: string;
  /** Populated for `invalid_environment`. */
  readonly issues?: readonly EnvironmentIssue[];
  /** False when retrying cannot possibly succeed, e.g. a bad build config. */
  readonly retryable: boolean;
}

export interface BootstrapState {
  readonly status: BootstrapStatus;
  readonly blockingError: BootstrapError | null;
  readonly startedAt: number | null;
  readonly completedAt: number | null;
  /**
   * Result of the non-blocking backend probe.
   *
   * `null` while it has not finished. An unavailable backend never blocks
   * startup — it only limits the features that need it.
   */
  readonly health: HealthcheckResult | null;
}

export type BootstrapTaskResult =
  | { readonly status: 'success' }
  | { readonly status: 'timeout' }
  | { readonly status: 'error'; readonly error: unknown };
