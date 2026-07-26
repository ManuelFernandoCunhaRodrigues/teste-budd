import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';

import { Toast } from '@/components/feedback';
import { assertEnvironment } from '@/config/environment';
import { useSessionStore } from '@/store/sessionStore';
import { colors } from '@/theme';

// Fails fast at startup rather than surfacing as a confusing network error.
assertEnvironment();

/**
 * Root layout: providers, the app-wide stack, and the global toast.
 *
 * Headers are hidden throughout because every screen draws its own, matching
 * the design.
 *
 * Session restore is kicked off here, once, above both route groups — so the
 * `checking` state is already settled by the time either group renders, and both
 * see the same answer.
 */
export default function RootLayout() {
  const restoreSession = useSessionStore((state) => state.restoreSession);

  useEffect(() => {
    // The store collapses concurrent calls, so a re-mount cannot double-validate.
    void restoreSession();
  }, [restoreSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />

        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="(private)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(public)" options={{ animation: 'fade' }} />
        </Stack>

        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
