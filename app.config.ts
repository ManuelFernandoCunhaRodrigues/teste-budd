import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic layer over `app.json`.
 *
 * Exists so the Google Maps Android key can come from the environment instead of
 * living in the repository. `app.json` stays the readable static base; this file
 * only adds what needs a variable.
 *
 * Platform note: the app renders `MapView` with `PROVIDER_DEFAULT`, which is
 * Google Maps on Android and **Apple Maps** on iOS. Only Android needs a key —
 * adding an iOS Google key here would configure a provider the app never asks
 * for.
 */

const ANDROID_MAPS_KEY = 'GOOGLE_MAPS_ANDROID_API_KEY';

/**
 * True when a real native binary is being produced.
 *
 * Expo Go and the dev server run fine without the key (Expo Go carries its own
 * Google Maps credentials), so failing there would block development for no
 * reason. A build that ships must fail loudly instead of producing an app with a
 * blank map.
 */
function isNativeBuild(): boolean {
  return process.env.EAS_BUILD === 'true' || process.env.BUDD_REQUIRE_NATIVE_CONFIG === 'true';
}

/**
 * Reads the key, refusing to continue a native build without it.
 *
 * The error names the variable and never echoes its value — an error message is
 * one of the places a secret most easily leaks into a log.
 */
function readAndroidMapsKey(): string | undefined {
  const value = process.env[ANDROID_MAPS_KEY]?.trim();
  if (value) return value;

  if (isNativeBuild()) {
    throw new Error(
      `Variável obrigatória ausente: ${ANDROID_MAPS_KEY}. ` +
        'Sem ela o mapa fica em branco no APK/AAB. Defina-a como secret do EAS ' +
        '(eas secret:create) ou no ambiente do build.',
    );
  }

  return undefined;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const androidGoogleMapsApiKey = readAndroidMapsKey();

  return {
    ...config,
    name: config.name ?? 'budd',
    slug: config.slug ?? 'budd-test',
    plugins: [
      ...(config.plugins ?? []),
      // Only registered when a key exists, so `expo start` and Expo Go stay
      // usable on a fresh clone with no `.env`.
      ...(androidGoogleMapsApiKey
        ? [['react-native-maps', { androidGoogleMapsApiKey }] as [string, Record<string, string>]]
        : []),
    ],
  };
};
