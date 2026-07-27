/**
 * Application startup (§6.3).
 *
 * The behaviour under test is the B-03 rule: the minimum dwell may only *delay*
 * the handover, never cause it. So a slow bootstrap keeps the boot screen up, and
 * a fast one still respects the animation.
 */

const mockRestoreSession = jest.fn();
const mockValidateEnvironment = jest.fn();
const mockHealthcheck = jest.fn();

jest.mock('@/config/environment', () => ({
  __esModule: true,
  validateEnvironment: () => mockValidateEnvironment(),
  isDevelopment: true,
  environment: { environment: 'development' },
}));

jest.mock('@/services/health/healthcheckService', () => ({
  __esModule: true,
  healthcheckService: { check: () => mockHealthcheck() },
}));

jest.mock('@/store/sessionStore', () => ({
  __esModule: true,
  useSessionStore: {
    getState: () => ({ restoreSession: mockRestoreSession }),
  },
}));

/**
 * A persisted store that is hydrated on demand.
 *
 * Named with a `mock` prefix because `jest.mock` factories are hoisted above this
 * declaration; that prefix is the only way Jest allows a factory to reference an
 * outer binding.
 */
function mockFakeStore(hydrated: boolean, hydrateAfterMs = 0) {
  const listeners: (() => void)[] = [];

  if (!hydrated && hydrateAfterMs >= 0) {
    setTimeout(() => listeners.forEach((listener) => listener()), hydrateAfterMs);
  }

  return {
    persist: {
      hasHydrated: () => hydrated,
      onFinishHydration: (fn: () => void) => {
        listeners.push(fn);
        return () => {
          const index = listeners.indexOf(fn);
          if (index >= 0) listeners.splice(index, 1);
        };
      },
    },
  };
}

jest.mock('@/store/cartStore', () => ({ __esModule: true, useCartStore: mockFakeStore(true) }));
jest.mock('@/store/favoritesStore', () => ({
  __esModule: true,
  useFavoritesStore: mockFakeStore(true),
}));
jest.mock('@/store/preferencesStore', () => ({
  __esModule: true,
  usePreferencesStore: mockFakeStore(true),
}));
jest.mock('@/features/bars/store/reviewsStore', () => ({
  __esModule: true,
  useReviewsStore: mockFakeStore(true),
}));

const {
  bootstrapApplication,
  MINIMUM_SPLASH_DURATION_MS,
  resetBootstrapForTests,
  withTimeout,
} = require('../bootstrap') as typeof import('../bootstrap');

beforeEach(() => {
  jest.clearAllMocks();
  resetBootstrapForTests();

  mockValidateEnvironment.mockReturnValue({ isValid: true, issues: [] });
  mockRestoreSession.mockResolvedValue(undefined);
  mockHealthcheck.mockResolvedValue({ status: 'unavailable', reason: 'not_implemented' });
});

describe('blocking phase', () => {
  it('restores the session before reporting ready', async () => {
    const outcome = await bootstrapApplication();

    expect(mockRestoreSession).toHaveBeenCalledTimes(1);
    expect(outcome.error).toBeNull();
  });

  it('blocks on an invalid environment and marks it non-retryable', async () => {
    mockValidateEnvironment.mockReturnValue({
      isValid: false,
      issues: [
        { code: 'api_url_missing', severity: 'blocking', message: 'faltando' },
        { code: 'whatsapp_number_invalid', severity: 'warning', message: 'aviso' },
      ],
    });

    const outcome = await bootstrapApplication();

    expect(outcome.error?.code).toBe('invalid_environment');
    // A bad build config is not fixed by tapping "Tentar novamente".
    expect(outcome.error?.retryable).toBe(false);
    // Only the blocking issue is carried through.
    expect(outcome.error?.issues).toHaveLength(1);
  });

  it('does not run the session restore when the config is already invalid', async () => {
    mockValidateEnvironment.mockReturnValue({
      isValid: false,
      issues: [{ code: 'api_url_insecure', severity: 'blocking', message: 'http' }],
    });

    await bootstrapApplication();
    expect(mockRestoreSession).not.toHaveBeenCalled();
  });

  it('surfaces a thrown blocking task as a retryable error', async () => {
    mockRestoreSession.mockRejectedValue(new Error('keystore exploded'));

    const outcome = await bootstrapApplication();

    expect(outcome.error?.code).toBe('unknown');
    expect(outcome.error?.retryable).toBe(true);
    // No stack trace in the user-facing copy.
    expect(outcome.error?.userMessage).not.toContain('keystore exploded');
  });

  it('tolerates a warning-only environment', async () => {
    mockValidateEnvironment.mockReturnValue({
      isValid: true,
      issues: [{ code: 'api_url_missing', severity: 'warning', message: 'sem API' }],
    });

    await expect(bootstrapApplication()).resolves.toMatchObject({ error: null });
  });
});

describe('minimum visual duration', () => {
  it('a fast bootstrap still waits for the animation', async () => {
    const startedAt = Date.now();
    await bootstrapApplication();

    // Everything resolves immediately here, so the dwell is what sets the floor.
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(MINIMUM_SPLASH_DURATION_MS - 50);
  });

  it('a slow bootstrap is not cut short by the timer', async () => {
    const slowMs = MINIMUM_SPLASH_DURATION_MS + 400;
    mockRestoreSession.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, slowMs)),
    );

    const startedAt = Date.now();
    await bootstrapApplication();

    // The timer must not be able to declare readiness on its own.
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(slowMs - 50);
    expect(mockRestoreSession).toHaveBeenCalled();
  });
});

describe('non-blocking phase', () => {
  it('an unavailable backend does not fail startup', async () => {
    mockHealthcheck.mockResolvedValue({ status: 'unavailable', reason: 'network' });

    const outcome = await bootstrapApplication();

    expect(outcome.error).toBeNull();
    expect(outcome.health).toEqual({ status: 'unavailable', reason: 'network' });
  });

  it('a throwing healthcheck does not fail startup', async () => {
    mockHealthcheck.mockRejectedValue(new Error('offline'));

    const outcome = await bootstrapApplication();

    expect(outcome.error).toBeNull();
    expect(outcome.health?.status).toBe('unavailable');
  });
});

describe('idempotence', () => {
  it('concurrent calls share one run', async () => {
    const [a, b, c] = await Promise.all([
      bootstrapApplication(),
      bootstrapApplication(),
      bootstrapApplication(),
    ]);

    expect(mockRestoreSession).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it('a later call after settling runs again, so retry works', async () => {
    await bootstrapApplication();
    // Latch released on settle.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await bootstrapApplication();

    expect(mockRestoreSession).toHaveBeenCalledTimes(2);
  });
});

describe('withTimeout', () => {
  it('reports success for a task that finishes in time', async () => {
    await expect(withTimeout(() => Promise.resolve(), 100)).resolves.toEqual({
      status: 'success',
    });
  });

  it('reports a timeout for a task that hangs', async () => {
    await expect(
      withTimeout(() => new Promise((resolve) => setTimeout(resolve, 200)), 20),
    ).resolves.toEqual({ status: 'timeout' });
  });

  it('reports an error for a rejecting task', async () => {
    const result = await withTimeout(() => Promise.reject(new Error('nope')), 100);
    expect(result.status).toBe('error');
  });

  it('clears its timer, so a resolved task leaves nothing pending', async () => {
    const spy = jest.spyOn(globalThis, 'clearTimeout');
    await withTimeout(() => Promise.resolve(), 100);

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('store hydration', () => {
  it(
    'waits for a store that has not hydrated yet',
    async () => {
      jest.resetModules();
      jest.doMock('@/store/cartStore', () => ({
        __esModule: true,
        useCartStore: mockFakeStore(false, 120),
      }));

      const fresh = require('../bootstrap') as typeof import('../bootstrap');
      fresh.resetBootstrapForTests();

      // Resolving at all proves the hydration listener fired; hanging would time out.
      await expect(fresh.hydrateRequiredStores()).resolves.toBeDefined();
    },
    // Requiring a fresh Expo/React Native graph is the expensive part of this
    // test. Keep the allowance local so a slow unit elsewhere still fails fast.
    15_000,
  );
});
