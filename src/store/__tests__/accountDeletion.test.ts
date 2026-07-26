import * as SecureStore from 'expo-secure-store';

import { STORAGE_KEYS } from '@/constants/storage';
import { useReviewsStore } from '@/features/bars/store/reviewsStore';
import { resetAuthStorageForTests } from '@/services/auth/authStorage';
import { AppError } from '@/services/errors';

import { useCartStore } from '../cartStore';
import { useFavoritesStore } from '../favoritesStore';
import { resetSessionLatchForTests, useSessionStore } from '../sessionStore';
import { useWalletStore } from '../walletStore';

/**
 * Account deletion (§10.6), against the in-memory dev backend.
 *
 * The rule under test throughout: the device may only clear itself *after* the
 * server confirmed. A refusal must leave the account and the session untouched.
 */
const VALID = { email: 'demo@budd.app', password: 'budd1234' };

function clearSecureStore() {
  (SecureStore as unknown as { __reset: () => void }).__reset();
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  // The dev backend keeps one module-level database; without this a deleted
  // account stays deleted for every case that follows.
  require('@/services/backend').devBackendControls.resetForTests();
  clearSecureStore();
  resetAuthStorageForTests();
  resetSessionLatchForTests();
  useReviewsStore.getState().reset();
  useSessionStore.setState({
    status: 'checking',
    accessToken: null,
    user: null,
    isSigningIn: false,
    isSigningOut: false,
    isDeletingAccount: false,
    authError: null,
  });
  useCartStore.getState().clear();
  useWalletStore.getState().reset();
});

it('refuses to delete without a session', async () => {
  useSessionStore.setState({ status: 'unauthenticated', accessToken: null });

  await expect(useSessionStore.getState().deleteAccount()).rejects.toMatchObject({
    code: 'unauthenticated',
  });
});

it('clears the session on success', async () => {
  await useSessionStore.getState().signIn(VALID);
  expect(useSessionStore.getState().status).toBe('authenticated');

  await useSessionStore.getState().deleteAccount();

  expect(useSessionStore.getState().status).toBe('unauthenticated');
  expect(useSessionStore.getState().accessToken).toBeNull();
  expect(useSessionStore.getState().user).toBeNull();
});

it('removes the stored token on success', async () => {
  await useSessionStore.getState().signIn(VALID);
  await expect(SecureStore.getItemAsync(STORAGE_KEYS.session)).resolves.toBeTruthy();

  await useSessionStore.getState().deleteAccount();

  await expect(SecureStore.getItemAsync(STORAGE_KEYS.session)).resolves.toBeNull();
});

it('clears account-scoped data on success', async () => {
  const { BARS, findVenueProduct } = require('@/mocks/bars');

  await useSessionStore.getState().signIn(VALID);
  useCartStore.getState().addProduct({
    venue: { id: BARS[0].id, name: BARS[0].name },
    product: findVenueProduct(BARS[0].id, 'chopp-artesanal-500'),
  });
  useWalletStore.getState().applyBalance({
    balanceInCents: 7_000,
    updatedAt: new Date().toISOString(),
  });
  useFavoritesStore.setState({ barIds: ['bar-do-ze'] });
  useReviewsStore.getState().updateDraft({
    venueId: 'bar-do-ze',
    userId: 'user-demo',
    authorName: 'Ana Souza',
    stars: 5,
    text: 'Rascunho da conta.',
  });

  await useSessionStore.getState().deleteAccount();

  expect(useCartStore.getState().items).toHaveLength(0);
  expect(useWalletStore.getState().balanceInCents).toBeNull();
  expect(useFavoritesStore.getState().barIds).toHaveLength(0);
  expect(useReviewsStore.getState().reviews).toHaveLength(0);
});

it('revokes the session so the deleted account cannot sign in again', async () => {
  await useSessionStore.getState().signIn(VALID);
  await useSessionStore.getState().deleteAccount();

  await expect(useSessionStore.getState().signIn(VALID)).rejects.toMatchObject({
    code: 'unauthenticated',
  });
});

describe('when the server refuses', () => {
  /** Replaces the backend call with a failure, leaving the rest intact. */
  function failDeletion(error: AppError) {
    const backend = require('@/services/backend').backend;
    return jest.spyOn(backend, 'deleteAccount').mockRejectedValue(error);
  }

  it('does not report success', async () => {
    await useSessionStore.getState().signIn(VALID);
    failDeletion(new AppError('unavailable'));

    await expect(useSessionStore.getState().deleteAccount()).rejects.toMatchObject({
      code: 'unavailable',
    });
  });

  it('keeps the session intact', async () => {
    await useSessionStore.getState().signIn(VALID);
    const token = useSessionStore.getState().accessToken;
    failDeletion(new AppError('network'));

    await useSessionStore.getState().deleteAccount().catch(() => undefined);

    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(useSessionStore.getState().accessToken).toBe(token);
  });

  it('does not wipe local data', async () => {
    const { BARS, findVenueProduct } = require('@/mocks/bars');

    await useSessionStore.getState().signIn(VALID);
    useCartStore.getState().addProduct({
      venue: { id: BARS[0].id, name: BARS[0].name },
      product: findVenueProduct(BARS[0].id, 'chopp-artesanal-500'),
    });
    useReviewsStore.getState().updateDraft({
      venueId: BARS[0].id,
      userId: 'user-demo',
      authorName: 'Ana Souza',
      stars: 4,
      text: 'Nao apague sem confirmar no servidor.',
    });
    failDeletion(new AppError('timeout'));

    await useSessionStore.getState().deleteAccount().catch(() => undefined);

    // Clearing the device on a failed deletion would fake the outcome.
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useReviewsStore.getState().reviews).toHaveLength(1);
    await expect(SecureStore.getItemAsync(STORAGE_KEYS.session)).resolves.toBeTruthy();
  });

  it('leaves the flag down so the user can retry', async () => {
    await useSessionStore.getState().signIn(VALID);
    failDeletion(new AppError('network'));

    await useSessionStore.getState().deleteAccount().catch(() => undefined);

    expect(useSessionStore.getState().isDeletingAccount).toBe(false);
  });
});

it('a double confirm performs a single deletion', async () => {
  await useSessionStore.getState().signIn(VALID);

  const backend = require('@/services/backend').backend;
  const spy = jest.spyOn(backend, 'deleteAccount');

  await Promise.all([
    useSessionStore.getState().deleteAccount(),
    useSessionStore.getState().deleteAccount(),
  ]);

  expect(spy).toHaveBeenCalledTimes(1);
});
