import { Redirect } from 'expo-router';

import { LoadingState } from '@/components/feedback';
import { Screen } from '@/components/layout';
import { useDelayedFlag } from '@/hooks/useDelayedFlag';
import { useSessionStore } from '@/store/sessionStore';
import { loadingDelay } from '@/theme';

/**
 * Boot screen.
 *
 * Holds the brand flame animation for a beat, then routes on the session status.
 * It waits for `checking` to resolve rather than assuming a destination — the
 * previous version read a boolean that defaulted to "signed in", which is what
 * let the app open private screens before any session had been found.
 *
 * This is a convenience redirect, not a security boundary: the real gate is
 * `app/(private)/_layout`, which every private route passes through.
 */
export default function BootRoute() {
  const ready = useDelayedFlag(loadingDelay.boot);
  const status = useSessionStore((state) => state.status);

  if (!ready || status === 'checking') {
    return (
      <Screen edges={['top', 'bottom']}>
        <LoadingState description="Buscando os melhores lugares…" title="Carregando rolês" />
      </Screen>
    );
  }

  return <Redirect href={status === 'authenticated' ? '/role' : '/login'} />;
}
