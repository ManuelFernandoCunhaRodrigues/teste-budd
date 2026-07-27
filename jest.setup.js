/* eslint-env jest */

/**
 * Native modules that have no JS implementation under Jest.
 *
 * Each mock mirrors the real contract closely enough that the code under test
 * exercises its actual branches — the secure store really stores, so the session
 * restore path is genuinely tested rather than stubbed out.
 *
 * Component mocks live in `__mocks__/` instead of here: NativeWind's Babel
 * preset injects a module-scope binding into every file, and `jest.mock`
 * factories are hoisted above it, so referencing anything that renders JSX from
 * this file fails with "not allowed to reference any out-of-scope variables".
 */

// GestureHandlerRootView initializes the native module during render. The
// package-provided setup replaces that module with its supported Jest mock.
require('react-native-gesture-handler/jestSetup');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-secure-store', () => {
  const store = new Map();

  /**
   * The native module rejects any key outside this set, and it does so at
   * runtime only. Enforcing it here is what keeps an unusable key — a `:`
   * separator, say — from passing every test and then failing on device.
   */
  const assertValidKey = (key) => {
    if (typeof key !== 'string' || !/^[A-Za-z0-9._-]+$/.test(key)) {
      throw new Error(
        'Invalid key provided to SecureStore. Keys must not be empty and contain ' +
          `only alphanumeric characters, ".", "-", and "_". Received: ${String(key)}`,
      );
    }
  };

  return {
    __esModule: true,
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    isAvailableAsync: jest.fn(async () => true),
    getItemAsync: jest.fn(async (key) => {
      assertValidKey(key);
      return store.has(key) ? store.get(key) : null;
    }),
    setItemAsync: jest.fn(async (key, value) => {
      assertValidKey(key);
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key) => {
      assertValidKey(key);
      store.delete(key);
    }),
    /** Test helper, not part of the real module. */
    __reset: () => store.clear(),
  };
});

jest.mock('expo-clipboard', () => ({
  __esModule: true,
  setStringAsync: jest.fn(async () => true),
  getStringAsync: jest.fn(async () => ''),
}));
