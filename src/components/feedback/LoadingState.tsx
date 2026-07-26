import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme';

import { FlameLoader } from './FlameLoader';
import { MapLoader } from './MapLoader';

export interface LoadingStateProps {
  /** `flame` is the app-wide loader; `map` is used while the map screen opens. */
  variant?: 'flame' | 'map';
  title: string;
  description?: string;
  /** The three bouncing dots only appear under the flame loader in the design. */
  showDots?: boolean;
}

/** Full-screen loading treatment with the brand animation. */
export function LoadingState({
  variant = 'flame',
  title,
  description,
  showDots = variant === 'flame',
}: LoadingStateProps) {
  return (
    <View
      accessibilityLabel={title}
      accessibilityRole="progressbar"
      className="flex-1 items-center justify-center gap-6 bg-bg pb-20"
    >
      {variant === 'flame' ? <FlameLoader /> : <MapLoader />}

      <View className="items-center">
        <Text className="text-6xl font-extrabold text-text">{title}</Text>
        {description ? (
          <Text className="mt-1.5 text-md text-[#9A9A9A]">{description}</Text>
        ) : null}
      </View>

      {showDots ? <LoadingDots /> : null}
    </View>
  );
}

/** Three dots pulsing in sequence. */
function LoadingDots() {
  return (
    <View className="flex-row gap-2.5">
      {[0, 200, 400].map((delay) => (
        <Dot delay={delay} key={delay} />
      ))}
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0.3);

  useEffect(() => {
    if (reduceMotion) return;

    const timer = setTimeout(() => {
      progress.value = withRepeat(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, progress, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.8 + progress.value * 0.2 }],
  }));

  return (
    <Animated.View
      style={[
        { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.flame },
        style,
      ]}
    />
  );
}
