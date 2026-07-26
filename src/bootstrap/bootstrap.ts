import { blockingIssues } from '@/config/environment.validation';
import { validateEnvironment } from '@/config/environment';
import { reportError } from '@/services/errors';
import { healthcheckService, type HealthcheckResult } from '@/services/health/healthcheckService';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useSessionStore } from '@/store/sessionStore';

import type { BootstrapError, BootstrapTaskResult } from './bootstrap.types';

/**
 * Application startup.
 *
 * B-03 replaced a `setTimeout` with this. The old boot screen dismissed itself
 * after a fixed delay, which meant it could hand over before the session had been
 * restored or the stores hydrated — and could equally keep someone waiting after
 * everything was already done.
 *
 * Two categories, and the distinction is the whole design:
 *
 * **Blocking** — must finish or the app cannot be trusted to route correctly:
 *   - environment validation (a bad config cannot be recovered at runtime)
 *   - session restore (routing depends on it; navigating first would flash login)
 *   - store hydration for cart, favourites and preferences
 *
 * **Non-blocking** — recorded, never fatal:
 *   - backend healthcheck (an offline server is not a startup failure)
 */

/** Ceiling for the whole blocking phase. Generous: it is a stuck-task guard. */
export const BOOTSTRAP_TIMEOUT_MS = 10_000;

/**
 * Minimum time the boot animation stays up.
 *
 * Purely visual — it prevents a flash when hydration resolves in 50 ms. It can
 * only ever *delay* the handover, never trigger it.
 */
export const MINIMUM_SPLASH_DURATION_MS = 800;

/** Resolves after `ms`. Used only for the minimum visual dwell. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Races a task against a timeout.
 *
 * The task is not cancelled — it cannot be, safely — so this bounds how long the
 * UI waits, not the work itself.
 */
export async function withTimeout(
  task: () => Promise<unknown>,
  timeoutMs: number,
): Promise<BootstrapTaskResult> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    const timeout = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), timeoutMs);
    });

    const outcome = await Promise.race([task().then(() => 'success' as const), timeout]);
    return outcome === 'timeout' ? { status: 'timeout' } : { status: 'success' };
  } catch (error) {
    return { status: 'error', error };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Waits for a persisted store to finish reading from disk. */
function waitForHydration(store: {
  persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void };
}): Promise<void> {
  if (store.persist.hasHydrated()) return Promise.resolve();

  return new Promise((resolve) => {
    const unsubscribe = store.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

/** Every persisted store that must be readable before the first screen renders. */
export function hydrateRequiredStores(): Promise<void[]> {
  return Promise.all([
    waitForHydration(useCartStore),
    waitForHydration(useFavoritesStore),
    waitForHydration(usePreferencesStore),
  ]);
}

/** Runs the blocking phase. Rejects only through the returned error. */
async function runBlockingTasks(): Promise<BootstrapError | null> {
  // Checked first and synchronously: no amount of hydration fixes a bad build.
  const validation = validateEnvironment();
  const blocking = blockingIssues(validation);

  if (blocking.length > 0) {
    return {
      code: 'invalid_environment',
      userMessage: 'Não foi possível iniciar o aplicativo: a configuração do ambiente é inválida.',
      detail: blocking.map((issue) => issue.code).join(', '),
      issues: blocking,
      // A config fault is fixed by a new build, not by tapping again.
      retryable: false,
    };
  }

  const result = await withTimeout(
    () =>
      Promise.all([
        // The store collapses concurrent calls, so this is safe to re-enter.
        useSessionStore.getState().restoreSession(),
        hydrateRequiredStores(),
      ]),
    BOOTSTRAP_TIMEOUT_MS,
  );

  if (result.status === 'timeout') {
    return {
      code: 'timeout',
      userMessage: 'A inicialização demorou mais que o esperado.',
      detail: 'bootstrap: blocking phase timed out',
      retryable: true,
    };
  }

  if (result.status === 'error') {
    reportError(result.error, { scope: 'bootstrap.blocking' });
    return {
      code: 'unknown',
      userMessage: 'Não foi possível iniciar o aplicativo.',
      detail: 'bootstrap: blocking task threw',
      retryable: true,
    };
  }

  return null;
}

/**
 * Probes the backend without blocking.
 *
 * Never rejects: an outage must not become a startup failure.
 */
export async function runNonBlockingTasks(): Promise<HealthcheckResult> {
  try {
    return await healthcheckService.check();
  } catch (error) {
    reportError(error, { scope: 'bootstrap.health' });
    return { status: 'unavailable', reason: 'unhealthy' };
  }
}

export interface BootstrapOutcome {
  readonly error: BootstrapError | null;
  readonly health: HealthcheckResult | null;
}

/**
 * Runs startup once.
 *
 * The in-flight promise is shared, so two mounts racing on boot produce one run —
 * the same latch pattern the session store uses.
 */
let inFlight: Promise<BootstrapOutcome> | null = null;

export function bootstrapApplication(): Promise<BootstrapOutcome> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    // Started before the blocking phase so a fast bootstrap still shows the
    // animation, and a slow one is not delayed any further.
    const minimumDwell = delay(MINIMUM_SPLASH_DURATION_MS);

    const healthPromise = runNonBlockingTasks();
    const error = await runBlockingTasks();

    await minimumDwell;

    // Already resolved by now in practice; awaited so the state is complete.
    const health = await healthPromise;

    return { error, health };
  })();

  try {
    return inFlight;
  } finally {
    // Cleared once settled so `retry` can run a fresh attempt.
    inFlight.finally(() => {
      inFlight = null;
    });
  }
}

/** Test seam: drops the in-flight latch between cases. */
export function resetBootstrapForTests(): void {
  inFlight = null;
}
