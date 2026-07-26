const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'expo-env.d.ts'],
  },
  {
    // Tests and their support files need `require`: `jest.mock` factories are
    // hoisted above imports, and re-reading a module after `jest.resetModules()`
    // is only possible through `require`. ESM imports cannot express either.
    files: [
      '**/__tests__/**/*.{ts,tsx}',
      '**/__mocks__/**/*.js',
      'test-support/**/*.js',
      'jest.setup.js',
      'jest.env.js',
      'jest.config.js',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
