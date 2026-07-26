import appJson from '../../../app.json';
import packageJson from '../../../package.json';

/**
 * Platform and native configuration (§10.1, §10.3).
 *
 * These assert the shipped configuration rather than runtime behaviour, because
 * that is where both bugs lived: a `web` script that could only fail, and native
 * identifiers that were simply absent.
 */

describe('platform support (A-01)', () => {
  it('declares no web script, since web is not a target', () => {
    // A public script that fails by definition is a false promise.
    expect(packageJson.scripts).not.toHaveProperty('web');
  });

  it('declares no expo.web configuration', () => {
    expect(appJson.expo).not.toHaveProperty('web');
  });

  it('does not depend on react-native-web', () => {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    expect(deps).not.toHaveProperty('react-native-web');
    expect(deps).not.toHaveProperty('@expo/metro-runtime');
  });

  it('keeps react-dom, which expo-router needs regardless of web', () => {
    // Removing it re-opens the peer conflict that blocked `npm install`.
    expect(packageJson.dependencies).toHaveProperty('react-dom');
    expect(packageJson.dependencies['react-dom']).toBe(packageJson.dependencies.react);
  });

  it('keeps the Android and iOS scripts working', () => {
    expect(packageJson.scripts).toHaveProperty('android');
    expect(packageJson.scripts).toHaveProperty('ios');
    expect(packageJson.scripts).toHaveProperty('start');
  });
});

describe('native identifiers (A-03)', () => {
  it('sets an Android package', () => {
    expect(appJson.expo.android.package).toBe('com.budd.app');
  });

  it('sets an iOS bundle identifier', () => {
    expect(appJson.expo.ios.bundleIdentifier).toBe('com.budd.app');
  });

  it('uses the same identifier on both platforms', () => {
    expect(appJson.expo.android.package).toBe(appJson.expo.ios.bundleIdentifier);
  });

  it('declares the location permissions the map needs', () => {
    expect(appJson.expo.android.permissions).toContain('ACCESS_FINE_LOCATION');
    expect(appJson.expo.ios.infoPlist.NSLocationWhenInUseUsageDescription).toBeTruthy();
  });

  it('contains no API key', () => {
    // Keys come from the environment through `app.config.ts`.
    const serialized = JSON.stringify(appJson);
    expect(serialized).not.toMatch(/AIza[0-9A-Za-z_-]{10,}/);
    expect(serialized).not.toContain('androidGoogleMapsApiKey');
  });
});

describe('maps key handling (A-03)', () => {
  const ORIGINAL = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL };
    jest.resetModules();
  });

  /** Loads `app.config.ts` fresh, so it re-reads `process.env`. */
  function loadConfig() {
    jest.resetModules();
    const mod = require('../../../app.config');
    return (mod.default ?? mod) as (context: { config: object }) => {
      plugins?: (string | [string, Record<string, string>])[];
    };
  }

  function pluginsFrom(result: { plugins?: (string | [string, Record<string, string>])[] }) {
    return result.plugins ?? [];
  }

  it('omits the maps plugin when no key is set, so Expo Go still runs', () => {
    delete process.env.GOOGLE_MAPS_ANDROID_API_KEY;
    delete process.env.EAS_BUILD;
    delete process.env.BUDD_REQUIRE_NATIVE_CONFIG;

    const result = loadConfig()({ config: { plugins: ['expo-router'] } });
    const names = pluginsFrom(result).map((entry) => (Array.isArray(entry) ? entry[0] : entry));

    expect(names).not.toContain('react-native-maps');
  });

  it('registers the plugin with the key when one is set', () => {
    process.env.GOOGLE_MAPS_ANDROID_API_KEY = 'test-key-not-real';
    delete process.env.EAS_BUILD;

    const result = loadConfig()({ config: { plugins: ['expo-router'] } });
    const maps = pluginsFrom(result).find(
      (entry) => Array.isArray(entry) && entry[0] === 'react-native-maps',
    );

    expect(maps).toBeDefined();
    expect((maps as [string, Record<string, string>])[1].androidGoogleMapsApiKey).toBe(
      'test-key-not-real',
    );
  });

  it('fails a native build when the key is missing', () => {
    delete process.env.GOOGLE_MAPS_ANDROID_API_KEY;
    process.env.BUDD_REQUIRE_NATIVE_CONFIG = 'true';

    // A silent omission here ships an APK with a blank map.
    expect(() => loadConfig()({ config: {} })).toThrow(/GOOGLE_MAPS_ANDROID_API_KEY/);
  });

  it('never puts the key value in the error message', () => {
    process.env.GOOGLE_MAPS_ANDROID_API_KEY = '   ';
    process.env.BUDD_REQUIRE_NATIVE_CONFIG = 'true';

    try {
      loadConfig()({ config: {} });
      throw new Error('expected the config to throw');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('GOOGLE_MAPS_ANDROID_API_KEY');
      // Naming the variable is useful; echoing its value leaks it into CI logs.
      expect(message).not.toContain('   ');
    }
  });

  it('preserves the plugins already declared in app.json', () => {
    process.env.GOOGLE_MAPS_ANDROID_API_KEY = 'test-key-not-real';

    const result = loadConfig()({ config: { plugins: ['expo-router', 'expo-secure-store'] } });
    const names = pluginsFrom(result).map((entry) => (Array.isArray(entry) ? entry[0] : entry));

    expect(names).toContain('expo-router');
    expect(names).toContain('expo-secure-store');
  });
});
