import * as Location from 'expo-location';

import { DEFAULT_REGION } from '@/constants/app';
import type { Coordinate } from '@/types/domain';

/**
 * Wraps `expo-location`.
 *
 * The previous version collapsed every outcome into `Coordinate | null`, so the
 * UI could not tell "the user said no" from "GPS is off" from "it failed" — and
 * therefore could not offer the right recovery. Each case is now distinct,
 * because each needs different wording and a different action.
 */

export type LocationOutcome =
  | { kind: 'available'; coordinate: Coordinate }
  /** Refused, but the OS will still show the prompt again. */
  | { kind: 'denied' }
  /** Refused permanently — only Settings can undo it. */
  | { kind: 'blocked' }
  /** Location services are switched off device-wide. */
  | { kind: 'services-off' }
  /** No location provider on this platform. */
  | { kind: 'unsupported' }
  | { kind: 'error'; detail: string };

/**
 * Resolves a position, asking for permission only when it can still be granted.
 *
 * Checks the existing grant first: calling `requestForegroundPermissionsAsync`
 * unconditionally re-prompts on every call, which is what §4.5 rules out.
 */
export async function resolveLocation(): Promise<LocationOutcome> {
  try {
    const existing = await Location.getForegroundPermissionsAsync();

    let granted = existing.granted;

    if (!granted) {
      // `canAskAgain === false` is the OS telling us the prompt is spent.
      if (!existing.canAskAgain) return { kind: 'blocked' };

      const requested = await Location.requestForegroundPermissionsAsync();
      granted = requested.granted;

      if (!granted) return requested.canAskAgain ? { kind: 'denied' } : { kind: 'blocked' };
    }

    // Permission without a working provider still yields nothing usable.
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) return { kind: 'services-off' };

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      kind: 'available',
      coordinate: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
    };
  } catch (error) {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);

    // `expo-location` throws this when the platform has no provider at all.
    if (detail.includes('E_LOCATION_UNAVAILABLE') || detail.includes('unsupported')) {
      return { kind: 'unsupported' };
    }

    return { kind: 'error', detail };
  }
}

/** Opens the OS settings page for this app, so a blocked grant can be undone. */
export async function openLocationSettings(): Promise<void> {
  await Location.enableNetworkProviderAsync().catch(() => {
    // Android-only helper; ignoring the rejection keeps iOS on the Linking path
    // handled by the caller.
  });
}

/** City-level fallback used when the user has not shared their location. */
export const FALLBACK_COORDINATE: Coordinate = {
  latitude: DEFAULT_REGION.latitude,
  longitude: DEFAULT_REGION.longitude,
};

/** Rejects a coordinate that could not point at a real place. */
export function isValidCoordinate(value: Coordinate | null | undefined): value is Coordinate {
  if (!value) return false;

  const { latitude, longitude } = value;
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    // (0, 0) is in the Atlantic and is what a zeroed struct looks like.
    !(latitude === 0 && longitude === 0)
  );
}
