import { useEffect, useState } from 'react';

/**
 * Returns `false` until `delay` has elapsed, then `true`.
 *
 * **Visual dwell only.** It backs the design's deliberate loading screens — the
 * flame and map animations are part of the brand experience, so they hold for a
 * fixed beat rather than vanishing the instant local data resolves.
 *
 * It must never stand in for real readiness. That was the B-03 defect: the boot
 * route gated navigation on this timer, so the app could hand over before the
 * session was restored. Application startup belongs to `bootstrap/`, where the
 * minimum dwell can only *delay* the handover, never cause it.
 */
export function useDelayedFlag(delay: number): boolean {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setElapsed(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return elapsed;
}
