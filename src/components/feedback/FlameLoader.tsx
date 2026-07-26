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
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

/** The outer flame body. */
const FLAME_BODY =
  'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z';

/** The brighter inner core that flickers independently. */
const FLAME_CORE =
  'M11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z';

const EMBERS = [
  { left: 52, bottom: 38, size: 5, color: colors.flameLight, delay: 0, duration: 1900 },
  { left: 118, bottom: 52, size: 4, color: colors.flame, delay: 600, duration: 2300 },
  { left: 80, bottom: 44, size: 3, color: colors.flameDark, delay: 1100, duration: 2100 },
];

/**
 * The brand loading animation: a pulsing halo, a swaying flame with a
 * flickering core, and rising embers.
 *
 * Honours the OS "reduce motion" setting by falling back to a still flame,
 * matching the design's `prefers-reduced-motion` rule.
 */
export function FlameLoader() {
  const reduceMotion = useReducedMotion();

  const glow = useSharedValue(0);
  const sway = useSharedValue(0);
  const flicker = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;

    const loop = (value: typeof glow, duration: number) => {
      value.value = withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    };

    loop(glow, 900);
    loop(sway, 800);
    loop(flicker, 550);
  }, [flicker, glow, reduceMotion, sway]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + glow.value * 0.45,
    transform: [{ scale: 0.98 + glow.value * 0.12 }],
  }));

  const swayStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: 0.96 + sway.value * 0.07 },
      { scaleY: 1 + sway.value * 0.07 },
      { rotate: `${-1.5 + sway.value * 3}deg` },
      { translateY: -sway.value * 3 },
    ],
  }));

  const flickerStyle = useAnimatedStyle(() => ({
    opacity: 0.82 + flicker.value * 0.18,
    transform: [{ scaleY: 0.9 + flicker.value * 0.22 }, { translateY: 2 - flicker.value * 5 }],
  }));

  return (
    <View className="h-[180px] w-[180px] items-center justify-center">
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: 'rgba(118,235,60,0.18)',
          },
          glowStyle,
        ]}
      />

      <Animated.View style={[{ width: 100, height: 120 }, swayStyle]}>
        <Svg fill="none" height={120} viewBox="0 0 24 24" width={100}>
          <Path d={FLAME_BODY} fill={colors.flame} />
        </Svg>
        <Animated.View style={[{ position: 'absolute', inset: 0 }, flickerStyle]}>
          <Svg fill="none" height={120} viewBox="0 0 24 24" width={100}>
            <Path d={FLAME_CORE} fill={colors.flameLight} />
          </Svg>
        </Animated.View>
      </Animated.View>

      {EMBERS.map((ember) => (
        <Ember key={`${ember.left}-${ember.bottom}`} {...ember} reduceMotion={reduceMotion} />
      ))}
    </View>
  );
}

interface EmberProps {
  left: number;
  bottom: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  reduceMotion: boolean;
}

function Ember({ left, bottom, size, color, delay, duration, reduceMotion }: EmberProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;

    const timer = setTimeout(() => {
      progress.value = withRepeat(withTiming(1, { duration, easing: Easing.in(Easing.ease) }), -1);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, progress, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    // Fades in quickly, then drifts upwards while shrinking away.
    opacity: progress.value < 0.15 ? progress.value / 0.15 : 1 - (progress.value - 0.15) / 0.85,
    transform: [
      { translateY: 6 - progress.value * 58 },
      { scale: 0.6 + progress.value * 0.4 - progress.value * progress.value * 0.7 },
    ],
  }));

  if (reduceMotion) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left,
          bottom,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
