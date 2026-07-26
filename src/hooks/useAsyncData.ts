import { useCallback, useEffect, useRef, useState } from 'react';

import type { ApiError, RequestStatus } from '@/types/api';

export interface AsyncData<T> {
  data: T | null;
  status: RequestStatus;
  error: ApiError | null;
  /** Re-runs the loader — wired to the retry button on `ErrorState`. */
  reload: () => void;
}

/**
 * Runs an async loader and tracks its lifecycle, so screens can render
 * loading, error and empty states without repeating the same bookkeeping.
 *
 * `key` identifies the request: whenever it changes the loader re-runs and the
 * state resets. Callers build it from whatever the loader closes over (a search
 * term, an id), which keeps the dependency explicit instead of hiding it in a
 * dependency array.
 *
 * Feature services are the only thing that should be passed here; components
 * never call the API client directly.
 */
export function useAsyncData<T>(loader: () => Promise<T>, key: string): AsyncData<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<RequestStatus>('loading');
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Reset during render rather than in an effect — React's documented pattern
  // for adjusting state when a prop changes, and it avoids a wasted paint of
  // the previous key's data.
  const [activeKey, setActiveKey] = useState(key);
  if (activeKey !== key) {
    setActiveKey(key);
    setData(null);
    setStatus('loading');
    setError(null);
  }

  // The loader closure changes every render; `key` is the real dependency, so
  // the latest closure is stashed in a ref and read when the fetch effect
  // fires. The ref is written from its own effect — declared first, so it has
  // already run by the time the fetch effect below reads it.
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let cancelled = false;

    loaderRef
      .current()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus('success');
      })
      .catch((caught: ApiError) => {
        if (cancelled) return;
        setError(caught);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [key, attempt]);

  const reload = useCallback(() => {
    setStatus('loading');
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  return { data, status, error, reload };
}
