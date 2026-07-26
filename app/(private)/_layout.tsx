import { Redirect, Stack } from 'expo-router';

import { LoadingState } from '@/components/feedback';
import { Screen } from '@/components/layout';
import { VenueSwitchDialog } from '@/features/cart/components/VenueSwitchDialog';
import { useSessionStore } from '@/store/sessionStore';
import { colors } from '@/theme';

/**
 * Gate for every authenticated route.
 *
 * Guarding at the layout means the check runs for *any* entry into the group —
 * a deep link, a typed URL, restored navigation state, a notification, the back
 * stack — not just the boot screen. The previous build only redirected from
 * `app/index`, so any of those paths walked straight into a private screen.
 *
 * Rendering rules, driven entirely by `status`:
 *   checking        -> loading, never the private tree
 *   unauthenticated -> replace with /login
 *   authenticated   -> render children
 *
 * `Redirect` replaces rather than pushes, so Android's back button cannot return
 * to a private screen after the session ends.
 */
export default function PrivateLayout() {
  const status = useSessionStore((state) => state.status);

  if (status === 'checking') {
    return (
      <Screen edges={['top', 'bottom']}>
        <LoadingState description="Verificando sua sessão…" title="Só um instante" />
      </Screen>
    );
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/login" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      </Stack>

      {/* One host for the multi-venue prompt, so every add surface behaves the
          same way. */}
      <VenueSwitchDialog />
    </>
  );
}
