/**
 * Runs before the test framework, so `config/environment` sees these when it is
 * first imported.
 *
 * The in-memory dev backend is enabled here on purpose: the critical-flow tests
 * need a server that behaves like one (idempotency, pending≠paid, credit-once).
 * Tests that assert the "no backend configured" behaviour import
 * `unavailableBackend` directly rather than flipping this flag.
 */
process.env.EXPO_PUBLIC_ENABLE_DEV_BACKEND = 'true';
process.env.EXPO_PUBLIC_API_TIMEOUT = '5000';
