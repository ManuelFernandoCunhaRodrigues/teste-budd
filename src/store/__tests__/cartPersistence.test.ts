import { STORAGE_KEYS } from '@/constants/storage';

/**
 * Persistence and migration (§14).
 *
 * A cart stored before venues existed has no `venueId`, and there is no evidence
 * available to guess which bar those items came from. The only safe outcome is to
 * discard that cart — never to turn `undefined` into an order against the wrong
 * venue, and never to crash on boot.
 */

/**
 * The current AsyncStorage mock instance.
 *
 * Resolved through `require` after each `resetModules`, and tolerant of both
 * export shapes — the official jest mock is CommonJS, so there is no `.default`.
 */
function asyncStorage() {
  const mod = require('@react-native-async-storage/async-storage');
  return (mod.default ?? mod) as {
    setItem: (key: string, value: string) => Promise<void>;
    getItem: (key: string) => Promise<string | null>;
  };
}

/**
 * Writes a persisted payload, then loads a fresh store instance over it.
 *
 * The write has to happen *after* `resetModules`: resetting the registry also
 * re-runs the AsyncStorage mock factory, so anything written through an earlier
 * instance would be invisible to the store — and every "cart was discarded"
 * assertion would pass for the wrong reason.
 */
async function hydrateFrom(payload: unknown) {
  jest.resetModules();

  const storage = asyncStorage();
  await storage.setItem(STORAGE_KEYS.cart, JSON.stringify(payload));

  const { useCartStore } = require('../cartStore');
  await useCartStore.persist.rehydrate();
  return useCartStore;
}

/** Confirms the fixture really reached the storage the store reads. */
async function storedRaw(): Promise<string | null> {
  const storage = asyncStorage();
  return storage.getItem(STORAGE_KEYS.cart);
}

it('discards a pre-venue cart instead of guessing an origin', async () => {
  // Version 1 shape: lines keyed by product id, no venue anywhere.
  const store = await hydrateFrom({
    version: 1,
    state: {
      lines: {
        'chopp-artesanal-500': {
          product: { id: 'chopp-artesanal-500', name: 'Chopp', price: 'R$ 16,00' },
          quantity: 2,
        },
      },
    },
  });

  expect(store.getState().items).toHaveLength(0);
  expect(store.getState().venue).toBeNull();
});

it('restores a valid current-version cart', async () => {
  const store = await hydrateFrom({
    version: 2,
    state: {
      venue: { id: 'bar-do-ze', name: 'Bar do Zé' },
      items: [
        {
          lineId: 'bar-do-ze|chopp-artesanal-500||',
          venueId: 'bar-do-ze',
          productId: 'chopp-artesanal-500',
          name: 'Chopp Artesanal 500ml',
          unitPriceInCents: 1440,
          quantity: 2,
        },
      ],
    },
  });

  // Guards the test itself: a valid cart must survive, otherwise the
  // "discarded" cases below would prove nothing.
  expect(await storedRaw()).toBeTruthy();
  expect(store.getState().items).toHaveLength(1);
  expect(store.getState().venue?.id).toBe('bar-do-ze');
});

it('discards a cart whose items disagree with the stored venue', async () => {
  const store = await hydrateFrom({
    version: 2,
    state: {
      venue: { id: 'bar-do-ze', name: 'Bar do Zé' },
      items: [
        {
          lineId: 'quintal-74|chopp-artesanal-500||',
          // Belongs to a different bar than the cart claims.
          venueId: 'quintal-74',
          productId: 'chopp-artesanal-500',
          name: 'Chopp',
          unitPriceInCents: 1680,
          quantity: 1,
        },
      ],
    },
  });

  expect(store.getState().items).toHaveLength(0);
  expect(store.getState().venue).toBeNull();
});

it('drops a venue left behind by an empty cart', async () => {
  const store = await hydrateFrom({
    version: 2,
    state: { venue: { id: 'bar-do-ze', name: 'Bar do Zé' }, items: [] },
  });

  expect(store.getState().venue).toBeNull();
});

it('survives a corrupt entry without crashing', async () => {
  jest.resetModules();

  const storage = asyncStorage();
  await storage.setItem(STORAGE_KEYS.cart, '{ not json');

  const { useCartStore } = require('../cartStore');
  await expect(useCartStore.persist.rehydrate()).resolves.not.toThrow();

  expect(useCartStore.getState().items).toHaveLength(0);
});

it('rejects a non-integer quantity from storage', async () => {
  const store = await hydrateFrom({
    version: 2,
    state: {
      venue: { id: 'bar-do-ze', name: 'Bar do Zé' },
      items: [
        {
          lineId: 'bar-do-ze|chopp||',
          venueId: 'bar-do-ze',
          productId: 'chopp',
          name: 'Chopp',
          unitPriceInCents: 1440,
          quantity: 1.5,
        },
      ],
    },
  });

  expect(store.getState().items).toHaveLength(0);
});
