import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';

import {
  resolveLocation,
  type LocationOutcome,
} from '@/services/location/locationService';
import type { Coordinate } from '@/types/domain';

export type LineUpLocationStatus =
  | 'idle'
  | 'loading'
  | 'available'
  | 'denied'
  | 'blocked'
  | 'unavailable'
  | 'error';

export interface LineUpLocationState {
  status: LineUpLocationStatus;
  coordinate: Coordinate | null;
  message: string | null;
  request: () => void;
  retry: () => void;
  openSettings: () => void;
}

const MESSAGES: Record<Exclude<LineUpLocationStatus, 'idle' | 'available' | 'loading'>, string> = {
  denied: 'Não foi possível acessar sua localização. Você ainda pode pesquisar por artista, cidade ou local.',
  blocked: 'A permissão de localização está bloqueada. Abra as configurações do app para permitir.',
  unavailable: 'A localização esta indisponível no aparelho. Escolha uma cidade manualmente.',
  error: 'Não foi possível obter sua localização agora.',
};

export function useLocationPermission(autoRequest = false): LineUpLocationState {
  const [status, setStatus] = useState<LineUpLocationStatus>(autoRequest ? 'loading' : 'idle');
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
  const attemptRef = useRef(0);
  const inFlightRef = useRef(false);

  const run = useCallback(() => {
    if (inFlightRef.current) return;

    attemptRef.current += 1;
    const attempt = attemptRef.current;
    inFlightRef.current = true;
    setStatus('loading');

    resolveLocation()
      .then((outcome: LocationOutcome) => {
        if (attemptRef.current !== attempt) return;

        switch (outcome.kind) {
          case 'available':
            setCoordinate(outcome.coordinate);
            setStatus('available');
            break;
          case 'denied':
            setCoordinate(null);
            setStatus('denied');
            break;
          case 'blocked':
            setCoordinate(null);
            setStatus('blocked');
            break;
          case 'services-off':
          case 'unsupported':
            setCoordinate(null);
            setStatus('unavailable');
            break;
          case 'error':
            setCoordinate(null);
            setStatus('error');
            break;
        }
      })
      .catch(() => {
        if (attemptRef.current === attempt) {
          setCoordinate(null);
          setStatus('error');
        }
      })
      .finally(() => {
        inFlightRef.current = false;
      });
  }, []);

  useEffect(() => {
    if (autoRequest) run();
  }, [autoRequest, run]);

  return {
    status,
    coordinate,
    message: status === 'idle' || status === 'available' || status === 'loading' ? null : MESSAGES[status],
    request: run,
    retry: run,
    openSettings: () => {
      void Linking.openSettings();
    },
  };
}
