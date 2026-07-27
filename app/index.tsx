import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

import { useAppBootstrap } from '@/bootstrap/useAppBootstrap';
import { LoadingState } from '@/components/feedback';
import { Screen } from '@/components/layout';
import { Button } from '@/components/ui';
import { isDevelopment } from '@/config/environment';
import { useSessionStore } from '@/store/sessionStore';

/**
 * Boot screen.
 *
 * Holds the brand flame animation while startup actually runs, then routes on the
 * restored session. Previously this waited on a fixed `setTimeout` and read a
 * session status that might not have been resolved yet — so it could hand over
 * early (flashing login at a signed-in user) or late (waiting after everything
 * was ready).
 *
 * This is a convenience redirect, not a security boundary: the real gate is
 * `app/(private)/_layout`, which every private route passes through.
 */
export default function BootRoute() {
  const bootstrap = useAppBootstrap();
  const status = useSessionStore((state) => state.status);

  if (bootstrap.status === 'error' && bootstrap.blockingError) {
    return <BootstrapErrorScreen error={bootstrap.blockingError} onRetry={bootstrap.retry} />;
  }

  // `status === 'checking'` is belt and braces: the blocking phase awaits
  // `restoreSession`, so it should already be settled here.
  if (bootstrap.status !== 'ready' || status === 'checking') {
    return (
      <Screen edges={['top', 'bottom']}>
        <LoadingState variant="role" />
      </Screen>
    );
  }

  return <Redirect href={status === 'authenticated' ? '/role' : '/login'} />;
}

interface BootstrapErrorScreenProps {
  error: NonNullable<ReturnType<typeof useAppBootstrap>['blockingError']>;
  onRetry: () => void;
}

/**
 * Shown when a blocking task failed.
 *
 * Never a stack trace. Operator detail is rendered only in development, where the
 * person reading it is the one who can fix the configuration.
 */
function BootstrapErrorScreen({ error, onRetry }: BootstrapErrorScreenProps) {
  return (
    <Screen edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text accessibilityRole="header" className="text-center text-3xl font-extrabold text-text">
          Não foi possível iniciar o aplicativo
        </Text>

        <Text
          accessibilityLiveRegion="polite"
          className="text-center text-md leading-6 text-text-muted"
        >
          {error.userMessage}
        </Text>

        {/* Configuration faults are fixed in the build, so retrying is pointless
            and offering it would be misleading. */}
        {error.retryable ? (
          <Button className="mt-2 px-8" label="Tentar novamente" onPress={onRetry} size="lg" />
        ) : null}

        {isDevelopment && error.issues?.length ? (
          <View className="mt-4 w-full rounded-lg border border-border bg-surface p-3.5">
            <Text className="text-xs font-bold text-text-muted">[dev] Problemas encontrados</Text>
            {error.issues.map((issue) => (
              <Text className="mt-1 text-xs leading-4 text-text-soft" key={issue.code}>
                • {issue.message}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
