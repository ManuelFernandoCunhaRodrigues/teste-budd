import { Redirect, Stack } from 'expo-router';

import { LoadingState } from '@/components/feedback';
import { Screen } from '@/components/layout';
import { useSessionStore } from '@/store/sessionStore';
import { colors } from '@/theme';

/**
 * Routes reachable without a session.
 *
 * Also guards the other direction: an authenticated user must not land back on
 * the login form — §3.5 asks for that, and it prevents a second sign-in
 * overwriting a live session. Signing out is the only way back here.
 */
export default function PublicLayout() {
  const status = useSessionStore((state) => state.status);

  if (status === 'checking') {
    return (
      <Screen edges={['top', 'bottom']}>
        <LoadingState label="Verificando sua sessão" variant="role" />
      </Screen>
    );
  }

  if (status === 'authenticated') {
    return <Redirect href="/role" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    />
  );
}
