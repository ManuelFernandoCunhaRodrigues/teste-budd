import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';

import { Toast } from '@/components/feedback';
import { colors } from '@/theme';

/**
 * Keeps the native splash up until React has mounted.
 *
 * Without this the splash auto-hides as soon as the bundle loads, showing a black
 * frame before the first React paint. `expo-splash-screen` was declared in
 * `app.json` but never called (B-03, §5.9).
 *
 * The rejection is ignored deliberately: it only means the splash was already
 * hidden, which is not a failure worth surfacing.
 */
void SplashScreen.preventAutoHideAsync().catch(() => {});

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
  useEffect(() => {
    // Handed over to the boot route's own animation, which is already painted by
    // the time this runs — so there is no gap and no second artificial wait.
    //
    // Session restore is no longer kicked off here: it is a blocking bootstrap
    // task owned by `app/index`, so nothing navigates before it resolves.
    void SplashScreen.hideAsync().catch(() => {});
  }, []);

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
