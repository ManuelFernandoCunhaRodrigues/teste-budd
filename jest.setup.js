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

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-secure-store', () => {
  const store = new Map();

  return {
    __esModule: true,
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    isAvailableAsync: jest.fn(async () => true),
    getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key) => {
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
