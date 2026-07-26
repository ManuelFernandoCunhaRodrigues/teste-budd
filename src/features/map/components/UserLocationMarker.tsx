import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme';

export interface UserLocationMarkerProps {
  size?: number;
}

/** The user's position: a blue dot inside a slowly pulsing accuracy halo. */
export function UserLocationMarker({ size = 52 }: UserLocationMarkerProps) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;

    pulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
    );
  }, [pulse, reduceMotion]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.7 * (1 - pulse.value),
    transform: [{ scale: 0.6 + pulse.value * 1.8 }],
  }));

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: 'rgba(47,143,255,0.28)',
          },
          haloStyle,
        ]}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.58,
          height: size * 0.58,
          borderRadius: size * 0.29,
          backgroundColor: 'rgba(47,143,255,0.18)',
        }}
      />
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: colors.location,
          borderWidth: 3,
          borderColor: '#FFFFFF',
        }}
      />
    </View>
  );
}
