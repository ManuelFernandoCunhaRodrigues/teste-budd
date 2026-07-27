import { useEffect } from 'react';
import { Image, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Touchable } from '@/components/ui';
import { duration, shadows } from '@/theme';

export interface AssistantBubbleProps {
  onPress: () => void;
  /** Distance from the bottom of the screen — the caller clears the tab bar. */
  bottom: number;
}

const SIZE = 60;

/**
 * The supplied mark: a 48×48 square, green edge to edge, with the "b" knocked
 * out in near-black.
 *
 * Drawn at the bubble's full size and clipped to the circle, which trims only
 * the four corners — all of them flat green, so nothing of the mark is lost.
 * The earlier revision of this file carried three rows of background bleed at
 * the foot and needed the artwork scaled up to push them out; this one does
 * not, and compensating for a band that is no longer there would crop the mark.
 */
const BUBBLE_ART = require('../../../../assets/icons/budd-icons-chat.png');

/**
 * Floating shortcut to the assistant.
 *
 * The brand mark in near-black on Budd green, matching the supplied reference.
 * `BuddLogo` is the same vector the map pin uses, so the bubble cannot drift
 * from the mark used elsewhere.
 *
 * A halo breathes behind it to read as "assistant" rather than "another
 * button". It is a sibling view, not a shadow on the button, because animating
 * a shadow re-rasterises on every frame on Android.
 */
export function AssistantBubble({ onPress, bottom }: AssistantBubbleProps) {
  const reduceMotion = useReducedMotion();
  const halo = useSharedValue(0);
  const entrance = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    entrance.value = reduceMotion
      ? 1
      : withTiming(1, { duration: duration.enter, easing: Easing.out(Easing.back(1.6)) });
  }, [entrance, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;

    halo.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [halo, reduceMotion]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ scale: 0.6 + 0.4 * entrance.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.28 - 0.22 * halo.value,
    transform: [{ scale: 1 + 0.28 * halo.value }],
  }));

  return (
    <Animated.View
      className="absolute right-4"
      pointerEvents="box-none"
      style={[{ bottom }, entranceStyle]}
    >
      <View className="items-center justify-center">
        <Animated.View
          className="absolute rounded-full bg-primary"
          pointerEvents="none"
          style={[{ width: SIZE, height: SIZE }, haloStyle]}
        />

        <Touchable
          accessibilityHint="Abre uma conversa para descobrir bares, eventos e promoções"
          accessibilityLabel="Assistente Budd"
          accessibilityRole="button"
          // `overflow-hidden` is load-bearing, not tidiness: without it the
          // square artwork draws over the rounded corners on Android.
          className="items-center justify-center overflow-hidden rounded-full bg-primary"
          onPress={onPress}
          style={[{ width: SIZE, height: SIZE }, shadows.navIndicator]}
        >
          <Image
            accessibilityIgnoresInvertColors
            source={BUBBLE_ART}
            style={{ width: SIZE, height: SIZE }}
          />
        </Touchable>
      </View>
    </Animated.View>
  );
}
