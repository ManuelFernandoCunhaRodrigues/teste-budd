import { useCallback, useEffect, useState } from 'react';

import type { HealthcheckResult } from '@/services/health/healthcheckService';

import { bootstrapApplication } from './bootstrap';
import type { BootstrapError, BootstrapState } from './bootstrap.types';

export interface AppBootstrapController extends BootstrapState {
  /** Re-runs startup. No-op while a run is in flight. */
  retry: () => void;
}

const INITIAL: BootstrapState = {
  status: 'running',
  blockingError: null,
  startedAt: null,
  completedAt: null,
  health: null,
};

/**
 * Drives application startup for the boot route.
 *
 * State is written from promise callbacks only, matching `useAsyncData` — a
 * synchronous `setState` reachable from an effect cascades renders and the React
 * Compiler lint rejects it.
 */
export function useAppBootstrap(): AppBootstrapController {
  const [state, setState] = useState<BootstrapState>(INITIAL);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    bootstrapApplication()
      .then(({ error, health }) => {
        if (cancelled) return;

        setState({
          // A blocking error must not read as ready, no matter how long it took.
          status: error ? 'error' : 'ready',
          blockingError: error,
          startedAt,
          completedAt: Date.now(),
          health,
        });
      })
      .catch((caught: unknown) => {
        if (cancelled) return;

        const fallback: BootstrapError = {
          code: 'unknown',
          userMessage: 'Não foi possível iniciar o aplicativo.',
          detail: String(caught),
          retryable: true,
        };

        setState({
          status: 'error',
          blockingError: fallback,
          startedAt,
          completedAt: Date.now(),
          health: null,
        });
      });

    return () => {
      // Prevents a write after the boot screen has handed over.
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ ...INITIAL, status: 'running' });
    setAttempt((value) => value + 1);
  }, []);

  return { ...state, retry };
}

/** Whether the backend is known to be reachable. */
export function isBackendHealthy(health: HealthcheckResult | null): boolean {
  return health?.status === 'healthy';
}
