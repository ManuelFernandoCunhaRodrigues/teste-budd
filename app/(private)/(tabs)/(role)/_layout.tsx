import { Stack } from 'expo-router';

import { colors } from '@/theme';

/**
 * Keeps venue details inside the Rolê tab.
 *
 * The group is pathless, so its public URLs remain `/role` and `/bar/:id`.
 * Supplying the initial route also gives a cold deep link to `/bar/:id` a
 * deterministic screen to return to when Android Back is pressed.
 */
export const unstable_settings = {
  initialRouteName: 'role',
};

export default function RoleStackLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}
    />
  );
}
