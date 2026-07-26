import { View } from 'react-native';

import { BuddLogo } from '@/components/ui/icons';
import { colors, shadows } from '@/theme';

export interface VenueMarkerProps {
  /** Outer circle diameter; the pointer scales with it. */
  size?: number;
}

/**
 * The budd map pin: a white disc carrying the brand mark above a green
 * pointer.
 *
 * The design used a raster `b-marker.png` here. This renders the same mark as
 * vector art so it stays crisp at every pixel density.
 */
export function VenueMarker({ size = 40 }: VenueMarkerProps) {
  return (
    <View className="items-center">
      <View
        className="items-center justify-center rounded-full border-2 border-primary bg-white"
        style={[{ width: size, height: size }, shadows.marker]}
      >
        <BuddLogo color={colors.primary} size={size * 0.55} />
      </View>

      {/* Triangular tip anchoring the pin to its coordinate. */}
      <View
        style={{
          width: 0,
          height: 0,
          marginTop: -1,
          borderLeftWidth: 6,
          borderRightWidth: 6,
          borderTopWidth: 9,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: colors.primary,
        }}
      />
    </View>
  );
}
