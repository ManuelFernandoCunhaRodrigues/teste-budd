/**
 * Jest setup for an Expo + React Native project.
 *
 * `jest-expo` supplies the transform, module mapping and RN environment; adding
 * a bare `preset: 'react-native'` here instead would miss the Expo module
 * resolution these tests rely on.
 */
module.exports = {
  preset: 'jest-expo',
  // Reanimated 4 splits its worklets runtime into `react-native-worklets`, which
  // ships this resolver. Without it, resolution picks the `.native` entry points
  // and the module throws on `loadUnpackers` as soon as anything animated is
  // imported — which every screen using `LoadingState` does.
  resolver: 'react-native-worklets/jest/resolver',
  // Environment flags must be in place before any module reads them, since
  // `config/environment` resolves the backend at import time.
  setupFiles: ['<rootDir>/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/mocks/**',
    '!src/**/index.ts',
  ],
};
