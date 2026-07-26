import type { ViewStyle } from 'react-native';

import { colors } from './colors';

/**
 * Elevation presets. Shadows are one of the cases where `StyleSheet` objects
 * beat Tailwind classes: iOS and Android use different properties and the
 * colour needs to be tinted per surface.
 */
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 6,
  },
  toast: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  navIndicator: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  marker: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
} satisfies Record<string, ViewStyle>;

export type ShadowToken = keyof typeof shadows;
