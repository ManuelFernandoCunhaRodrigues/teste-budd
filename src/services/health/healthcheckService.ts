import { environment, resolveBackendMode } from '@/config/environment';
import { normalizeError, reportError } from '@/services/errors';

/**
 * Backend availability.
 *
 * **The Budd API has no health endpoint yet**, and §3.7 forbids inventing one or
 * repurposing a functional route as a probe. So this service ships the contract
 * and reports `not_implemented` — it never fabricates a "healthy" answer.
 *
 * To finish it, add the real path to `ENDPOINTS` and call it from
 * `probeConfiguredBackend` below. Nothing else has to change.
 */

export type HealthcheckResult =
  | { readonly status: 'healthy'; readonly checkedAt: string }
  | { readonly status: 'unavailable'; readonly reason: HealthcheckFailure };

/** Why availability could not be confirmed. Distinct causes need distinct copy. */
export type HealthcheckFailure =
  /** No API configured — a configuration problem, not an outage. */
  | 'not_configured'
  /** Running against the in-memory dev backend; there is no server to probe. */
  | 'dev_backend'
  /** The backend has no health endpoint yet. */
  | 'not_implemented'
  | 'network'
  | 'timeout'
  | 'unhealthy';

export interface HealthcheckService {
  check(): Promise<HealthcheckResult>;
}

/** Short on purpose: a probe must never be what makes startup feel slow. */
export const HEALTHCHECK_TIMEOUT_MS = 3_000;

/**
 * True once a real health endpoint exists in `ENDPOINTS`.
 *
 * Flipping this without adding the path would be the invented endpoint §3.7 rules
 * out, so it stays `false` until the backend provides one.
 */
const HAS_BACKEND_HEALTH_ENDPOINT = false;

export const healthcheckService: HealthcheckService = {
  async check(): Promise<HealthcheckResult> {
    const mode = resolveBackendMode();

    if (mode === 'dev') return { status: 'unavailable', reason: 'dev_backend' };
    if (mode === 'unavailable' || !environment.apiBaseUrl) {
      return { status: 'unavailable', reason: 'not_configured' };
    }

    if (!HAS_BACKEND_HEALTH_ENDPOINT) {
      return { status: 'unavailable', reason: 'not_implemented' };
    }

    return probeConfiguredBackend();
  },
};

/**
 * Placeholder for the real probe.
 *
 * Unreachable while `HAS_BACKEND_HEALTH_ENDPOINT` is false. Kept so the timeout
 * and error mapping are already written and reviewed when the endpoint lands.
 */
async function probeConfiguredBackend(): Promise<HealthcheckResult> {
  try {
    // Replace with `api.get(ENDPOINTS.health, { signal })` once the path exists.
    throw new Error('health endpoint not wired');
  } catch (error) {
    const normalized = normalizeError(error);
    // Never surfaced to the user; the screen shows its own copy.
    reportError(error, { scope: 'healthcheck.probe' });

    if (normalized.code === 'timeout') return { status: 'unavailable', reason: 'timeout' };
    if (normalized.code === 'network') return { status: 'unavailable', reason: 'network' };
    return { status: 'unavailable', reason: 'unhealthy' };
  }
}

/** Whether the failure is a configuration fault rather than an outage. */
export function isConfigurationFailure(reason: HealthcheckFailure): boolean {
  return reason === 'not_configured';
}
