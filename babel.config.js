module.exports = function (api) {
  api.cache(true);
  return {
    // `jsxImportSource: nativewind` lets NativeWind rewrite the JSX runtime so
    // `className` works on core RN components. `nativewind/babel` is the
    // preset that compiles the Tailwind classes themselves.
    //
    // The Reanimated/worklets plugin is intentionally NOT listed here:
    // babel-preset-expo already injects `react-native-worklets/plugin` when
    // Reanimated is installed, and declaring it twice breaks the build.
    //
    // `babel-preset-expo` is a direct devDependency even though `expo` already
    // depends on it: npm installs it under `expo/node_modules`, and Babel
    // resolves preset names relative to this file, so the project root needs
    // its own copy. Keep its version in step with the Expo SDK.
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
