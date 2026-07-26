import { useEffect, useState } from 'react';

/**
 * Returns `false` until `delay` has elapsed, then `true`.
 *
 * Backs the design's deliberate loading screens — the flame and map animations
 * are part of the brand experience, so they dwell for a fixed beat rather than
 * disappearing the instant local data resolves.
 */
export function useDelayedFlag(delay: number): boolean {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setElapsed(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return elapsed;
}
