/**
 * Minimal `expo-router` stand-in for layout tests.
 *
 * Lives in its own module rather than inline in a `jest.mock` factory: NativeWind's
 * Babel preset injects a module-scope binding into every file, and mock factories
 * are hoisted above it, so any factory that renders fails with "not allowed to
 * reference any out-of-scope variables". A factory that only calls `require` is
 * safe.
 *
 * `Redirect` and `Stack` render as text markers so a test can assert which branch
 * a guard chose without standing up a navigator.
 */
const React = require('react');
const { Text } = require('react-native');

function Redirect({ href }) {
  const target = typeof href === 'string' ? href : (href?.pathname ?? 'unknown');
  return React.createElement(Text, null, `REDIRECT:${target}`);
}

function Stack({ children }) {
  return React.createElement(Text, null, 'PRIVATE_CONTENT', children);
}

Stack.Screen = function Screen() {
  return null;
};

module.exports = {
  __esModule: true,
  Redirect,
  Stack,
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }) => React.createElement(Text, null, children),
};
