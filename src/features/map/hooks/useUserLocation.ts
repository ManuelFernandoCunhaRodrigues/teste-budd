import { useCallback, useEffect, useRef, useState } from 'react';

import {
  FALLBACK_COORDINATE,
  isValidCoordinate,
  resolveLocation,
  type LocationOutcome,
} from '@/services/location/locationService';
import { usePreferencesStore } from '@/store/preferencesStore';
import type { Coordinate } from '@/types/domain';

/** Every state the location flow can be in. */
export type LocationStatus =
  | 'idle'
  | 'requesting-permission'
  | 'loading'
  | 'available'
  | 'denied'
  | 'blocked'
  | 'unavailable'
  | 'error';

export interface UserLocationState {
  status: LocationStatus;
  coordinate: Coordinate | null;
  /** User-safe explanation, or `null` when there is nothing to explain. */
  message: string | null;
  /** True once the fix has taken longer than users will sit through. */
  isSlow: boolean;
  /** Convenience: a real fix exists. */
  isPrecise: boolean;
  /** Re-runs the resolution — wired to "Tentar novamente" and the recenter button. */
  retry: () => void;
}

/** How long before the UI stops pretending the fix is imminent. */
const SLOW_FIX_MS = 8_000;

const MESSAGES: Record<Exclude<LocationStatus, 'available' | 'idle'>, string | null> = {
  'requesting-permission': null,
  loading: null,
  denied: 'Sem acesso à localização. Mostrando a região padrão.',
  blocked:
    'A permissão de localização está bloqueada. Ative nas configurações do sistema para ver bares perto de você.',
  unavailable: 'A localização está desligada no aparelho. Ative o GPS para ver bares perto de você.',
  error: 'Não foi possível obter sua localização agora.',
};

/**
 * Resolves the device position, honouring the in-app location preference.
 *
 * Two rules shape this hook. First, every outcome is distinct, so the screen can
 * offer the matching recovery instead of a generic spinner. Second, nothing is
 * written after unmount and the slow-fix timer is always cleared — a map tab the
 * user swipes away from must not keep timers alive or update state behind it.
 */
export function useUserLocation(): UserLocationState {
  const locationAllowed = usePreferencesStore((state) => state.permissions.location);

  /**
   * The outcome the resolver reported, or `null` while one is pending.
   *
   * The publicly returned `status` is derived from this plus the in-app
   * preference, rather than being written by the effect: a synchronous `setState`
   * inside an effect body cascades renders, and the React Compiler lint rejects
   * it. Everything here is written from promise callbacks only.
   */
  const [resolved, setResolved] = useState<LocationStatus | null>(null);
  const [fix, setFix] = useState<Coordinate | null>(null);
  const [isSlow, setIsSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const inFlightRef = useRef(false);

  // Derived, so turning the preference off takes effect on the next render with
  // no extra pass.
  const status: LocationStatus = !locationAllowed ? 'denied' : (resolved ?? 'loading');
  const coordinate = locationAllowed ? fix : null;

  useEffect(() => {
    // The user turned location off inside the app — never prompt the OS.
    if (!locationAllowed) return;

    let cancelled = false;
    inFlightRef.current = true;

    // Drives the "taking longer than expected" copy. It only changes what is
    // shown; the native call is left to finish on its own, because aborting it
    // would leave the permission flow in an unknown state.
    const slowTimer = setTimeout(() => {
      if (!cancelled) setIsSlow(true);
    }, SLOW_FIX_MS);

    resolveLocation()
      .then((outcome: LocationOutcome) => {
        if (cancelled) return;

        switch (outcome.kind) {
          case 'available':
            if (isValidCoordinate(outcome.coordinate)) {
              setFix(outcome.coordinate);
              setResolved('available');
            } else {
              // A malformed fix is worse than none: it would centre the map on
              // the Atlantic.
              setFix(null);
              setResolved('error');
            }
            break;
          case 'denied':
            setResolved('denied');
            break;
          case 'blocked':
            setResolved('blocked');
            break;
          case 'services-off':
          case 'unsupported':
            setResolved('unavailable');
            break;
          case 'error':
            setResolved('error');
            break;
        }
      })
      .catch(() => {
        if (!cancelled) setResolved('error');
      })
      .finally(() => {
        inFlightRef.current = false;
        if (!cancelled) setIsSlow(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, [locationAllowed, attempt]);

  const retry = useCallback(() => {
    if (inFlightRef.current) return;

    // Called from a handler, where setting state synchronously is correct.
    setIsSlow(false);
    setResolved(null);
    setAttempt((value) => value + 1);
  }, []);

  return {
    status,
    coordinate,
    message: status === 'available' || status === 'idle' ? null : MESSAGES[status],
    isSlow,
    isPrecise: status === 'available' && coordinate !== null,
    retry,
  };
}

/** The coordinate to draw when there is no fix. */
export function coordinateOrFallback(coordinate: Coordinate | null): Coordinate {
  return coordinate ?? FALLBACK_COORDINATE;
}
