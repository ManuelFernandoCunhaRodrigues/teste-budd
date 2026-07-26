import { STORAGE_KEYS } from '@/constants/storage';

/**
 * Favourites and preferences persistence (§10.5).
 *
 * Both live in AsyncStorage, deliberately apart from the session token: a list
 * of bar ids is not a credential, and putting it in the keystore entry would
 * widen what a token read exposes.
 */

function asyncStorage() {
  const mod = require('@react-native-async-storage/async-storage');
  return (mod.default ?? mod) as {
    setItem: (key: string, value: string) => Promise<void>;
    getItem: (key: string) => Promise<string | null>;
  };
}

/** Writes a payload, then loads a fresh store over it. */
async function hydrate(key: string, payload: unknown, modulePath: string, storeName: string) {
  jest.resetModules();

  const storage = asyncStorage();
  await storage.setItem(key, JSON.stringify(payload));

  const mod = require(modulePath);
  const store = mod[storeName];
  await store.persist.rehydrate();
  return store;
}

describe('favourites', () => {
  it('restores saved venues', async () => {
    const store = await hydrate(
      STORAGE_KEYS.favorites,
      { version: 1, state: { barIds: ['quintal-74'] } },
      '../favoritesStore',
      'useFavoritesStore',
    );

    expect(store.getState().barIds).toEqual(['quintal-74']);
    expect(store.getState().hasHydrated).toBe(true);
  });

  it('restores an empty list rather than re-seeding the defaults', async () => {
    const store = await hydrate(
      STORAGE_KEYS.favorites,
      { version: 1, state: { barIds: [] } },
      '../favoritesStore',
      'useFavoritesStore',
    );

    // Removing every favourite is a choice; re-adding the seeds would undo it.
    expect(store.getState().barIds).toEqual([]);
  });

  it('discards a malformed list', async () => {
    const store = await hydrate(
      STORAGE_KEYS.favorites,
      { version: 1, state: { barIds: [42, null] } },
      '../favoritesStore',
      'useFavoritesStore',
    );

    expect(store.getState().barIds).toEqual([]);
  });

  it('survives a corrupt entry', async () => {
    jest.resetModules();
    await asyncStorage().setItem(STORAGE_KEYS.favorites, '{ broken');

    const { useFavoritesStore } = require('../favoritesStore');
    await expect(useFavoritesStore.persist.rehydrate()).resolves.not.toThrow();
    expect(useFavoritesStore.getState().hasHydrated).toBe(true);
  });

  it('does not persist the hydration flag', async () => {
    jest.resetModules();
    const { useFavoritesStore } = require('../favoritesStore');

    useFavoritesStore.getState().toggle('bar-do-ze');
    await useFavoritesStore.persist.rehydrate();

    const raw = (await asyncStorage().getItem(STORAGE_KEYS.favorites)) ?? '';
    // Storage flags describe storage, not user data.
    expect(raw).not.toContain('hasHydrated');
  });
});

describe('preferences', () => {
  it('restores notification and privacy switches', async () => {
    const store = await hydrate(
      STORAGE_KEYS.preferences,
      {
        version: 1,
        state: {
          interests: { Rock: true },
          notifications: { app: false, eventos: true, compras: true, geral: false },
          permissions: { location: false, personalized: true, share: true },
        },
      },
      '../preferencesStore',
      'usePreferencesStore',
    );

    expect(store.getState().notifications.app).toBe(false);
    expect(store.getState().permissions.location).toBe(false);
    expect(store.getState().interests.Rock).toBe(true);
  });

  it('falls back to defaults on an incompatible shape', async () => {
    const store = await hydrate(
      STORAGE_KEYS.preferences,
      { version: 0, state: { notifications: 'yes please' } },
      '../preferencesStore',
      'usePreferencesStore',
    );

    expect(store.getState().notifications.app).toBe(true);
    expect(store.getState().permissions.share).toBe(false);
  });

  it('keeps the cart key untouched when preferences are discarded', async () => {
    jest.resetModules();
    const storage = asyncStorage();

    await storage.setItem(STORAGE_KEYS.cart, JSON.stringify({ version: 2, state: { venue: null, items: [] } }));
    await storage.setItem(STORAGE_KEYS.preferences, '{ corrupt');

    const { usePreferencesStore } = require('../preferencesStore');
    await usePreferencesStore.persist.rehydrate();

    // Only the affected store is cleared (§7.6).
    await expect(storage.getItem(STORAGE_KEYS.cart)).resolves.toContain('items');
  });
});

describe('storage separation', () => {
  it('keeps favourites and preferences under distinct keys from the session', () => {
    const keys = [STORAGE_KEYS.favorites, STORAGE_KEYS.preferences, STORAGE_KEYS.cart];

    // The session token lives in SecureStore under its own key; nothing here may
    // collide with it.
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).not.toContain(STORAGE_KEYS.session);
  });
});
