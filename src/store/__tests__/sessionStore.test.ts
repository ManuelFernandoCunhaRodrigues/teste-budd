import * as SecureStore from 'expo-secure-store';

import { STORAGE_KEYS } from '@/constants/storage';
import { resetAuthStorageForTests } from '@/services/auth/authStorage';

import { resetSessionLatchForTests, useSessionStore } from '../sessionStore';

/**
 * Authentication state (§17.1), against the in-memory dev backend.
 *
 * Credentials are the ones seeded in `devBackend`.
 */
const VALID = { email: 'demo@budd.app', password: 'budd1234' };

/** Test-only helper installed by the `expo-secure-store` mock. */
function clearSecureStore() {
  (SecureStore as unknown as { __reset: () => void }).__reset();
}

beforeEach(() => {
  // Call counts, not implementations — the secure-store mock keeps its behaviour.
  jest.clearAllMocks();
  clearSecureStore();
  resetAuthStorageForTests();
  resetSessionLatchForTests();
  useSessionStore.setState({
    status: 'checking',
    accessToken: null,
    user: null,
    isSigningIn: false,
    isSigningOut: false,
    authError: null,
  });
});

describe('initial state', () => {
  it('starts in checking, never authenticated', () => {
    // The original store started `isAuthenticated: true`, which is C-01.
    expect(useSessionStore.getState().status).toBe('checking');
    expect(useSessionStore.getState().user).toBeNull();
    expect(useSessionStore.getState().accessToken).toBeNull();
  });
});

describe('restoreSession', () => {
  it('resolves to unauthenticated when nothing is stored', async () => {
    await useSessionStore.getState().restoreSession();

    expect(useSessionStore.getState().status).toBe('unauthenticated');
  });

  it('restores a valid stored session', async () => {
    await useSessionStore.getState().signIn(VALID);
    const token = useSessionStore.getState().accessToken;

    // Simulate a fresh launch: state reset, storage kept.
    resetSessionLatchForTests();
    useSessionStore.setState({ status: 'checking', accessToken: null, user: null });
    await useSessionStore.getState().restoreSession();

    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(useSessionStore.getState().accessToken).toBe(token);
    expect(useSessionStore.getState().user?.email).toBe(VALID.email);
  });

  it('clears an expired stored session', async () => {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.session,
      JSON.stringify({
        accessToken: 'stale-token',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        user: { id: 'u1', name: 'Ana', email: VALID.email },
      }),
    );

    await useSessionStore.getState().restoreSession();

    expect(useSessionStore.getState().status).toBe('unauthenticated');
    // The unusable token must not be left behind on the device.
    await expect(SecureStore.getItemAsync(STORAGE_KEYS.session)).resolves.toBeNull();
  });

  it('clears a token the server rejects', async () => {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.session,
      JSON.stringify({
        // Well-formed and unexpired, but unknown to the backend.
        accessToken: 'never-issued',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        user: { id: 'u1', name: 'Ana', email: VALID.email },
      }),
    );

    await useSessionStore.getState().restoreSession();

    expect(useSessionStore.getState().status).toBe('unauthenticated');
    await expect(SecureStore.getItemAsync(STORAGE_KEYS.session)).resolves.toBeNull();
  });

  it('ignores a corrupt stored entry', async () => {
    await SecureStore.setItemAsync(STORAGE_KEYS.session, 'not json at all');

    await expect(useSessionStore.getState().restoreSession()).resolves.not.toThrow();
    expect(useSessionStore.getState().status).toBe('unauthenticated');
  });

  it('collapses concurrent restores into one storage read', async () => {
    const reads = SecureStore.getItemAsync as jest.Mock;
    reads.mockClear();

    // Three mounts racing on boot must produce one validation, not three.
    await Promise.all([
      useSessionStore.getState().restoreSession(),
      useSessionStore.getState().restoreSession(),
      useSessionStore.getState().restoreSession(),
    ]);

    expect(reads).toHaveBeenCalledTimes(1);
  });
});

describe('signIn', () => {
  it('rejects wrong credentials without authenticating', async () => {
    await expect(
      useSessionStore.getState().signIn({ email: VALID.email, password: 'wrong-password' }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });

    expect(useSessionStore.getState().status).toBe('unauthenticated');
    expect(useSessionStore.getState().authError).toBeTruthy();
    // Nothing may be persisted on a failed attempt.
    await expect(SecureStore.getItemAsync(STORAGE_KEYS.session)).resolves.toBeNull();
  });

  it('rejects an unknown account with the same message, so accounts cannot be enumerated', async () => {
    // Sequential on purpose: run concurrently, the store's single-flight guard
    // would drop the second call and there would be nothing to compare.
    const unknown = await useSessionStore
      .getState()
      .signIn({ email: 'nobody@budd.app', password: 'budd1234' })
      .then(() => null)
      .catch((error: { code: string; userMessage: string }) => error);

    const wrongPassword = await useSessionStore
      .getState()
      .signIn({ email: VALID.email, password: 'nope-nope' })
      .then(() => null)
      .catch((error: { code: string; userMessage: string }) => error);

    expect(unknown).not.toBeNull();
    expect(wrongPassword).not.toBeNull();
    expect(unknown?.code).toBe(wrongPassword?.code);
    expect(unknown?.userMessage).toBe(wrongPassword?.userMessage);
  });

  it('authenticates and persists on valid credentials', async () => {
    await useSessionStore.getState().signIn(VALID);

    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(useSessionStore.getState().accessToken).toBeTruthy();
    await expect(SecureStore.getItemAsync(STORAGE_KEYS.session)).resolves.toBeTruthy();
  });

  it('drops a concurrent submit so one tap is one request', async () => {
    const writes = SecureStore.setItemAsync as jest.Mock;
    writes.mockClear();

    // Second and third taps arrive while the first request is still open.
    await Promise.all([
      useSessionStore.getState().signIn(VALID),
      useSessionStore.getState().signIn(VALID),
      useSessionStore.getState().signIn(VALID),
    ]);

    expect(writes).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState().status).toBe('authenticated');
  });

  it('never puts the password into the stored session', async () => {
    await useSessionStore.getState().signIn(VALID);
    const raw = await SecureStore.getItemAsync(STORAGE_KEYS.session);

    expect(raw).not.toContain(VALID.password);
  });
});

describe('signOut', () => {
  it('clears the session and the stored token', async () => {
    await useSessionStore.getState().signIn(VALID);
    await useSessionStore.getState().signOut();

    expect(useSessionStore.getState().status).toBe('unauthenticated');
    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(useSessionStore.getState().user).toBeNull();
    await expect(SecureStore.getItemAsync(STORAGE_KEYS.session)).resolves.toBeNull();
  });

  it('clears the cart, which belongs to the account that built it', async () => {
    const { useCartStore } = require('../cartStore');
    const { BARS, findVenueProduct } = require('@/mocks/bars');

    await useSessionStore.getState().signIn(VALID);
    useCartStore.getState().addProduct({
      venue: { id: BARS[0].id, name: BARS[0].name },
      product: findVenueProduct(BARS[0].id, 'chopp-artesanal-500'),
    });
    expect(useCartStore.getState().items).toHaveLength(1);

    await useSessionStore.getState().signOut();

    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().venue).toBeNull();
  });

  it('resets the wallet so a balance cannot leak into the next session', async () => {
    const { useWalletStore } = require('../walletStore');

    await useSessionStore.getState().signIn(VALID);
    useWalletStore.getState().applyBalance({
      balanceInCents: 5_000,
      updatedAt: new Date().toISOString(),
    });

    await useSessionStore.getState().signOut();

    expect(useWalletStore.getState().balanceInCents).toBeNull();
  });

  it('is safe to call twice', async () => {
    await useSessionStore.getState().signIn(VALID);

    await Promise.all([
      useSessionStore.getState().signOut(),
      useSessionStore.getState().signOut(),
    ]);

    expect(useSessionStore.getState().status).toBe('unauthenticated');
  });
});
