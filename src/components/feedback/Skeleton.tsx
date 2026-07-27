import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { cn } from '@/utils/cn';

export interface SkeletonProps {
  className?: string;
  style?: ViewStyle;
  /**
   * Milliseconds this block waits before its band starts.
   *
   * Staggering consecutive blocks is what turns a row of independent shimmers
   * into one wave crossing the screen.
   */
  delay?: number;
}

/** One full pass of the band, edge to edge. */
const SWEEP_MS = 1500;
/** Band width as a share of the block, so it scales with any size. */
const BAND_RATIO = 0.7;

/**
 * A placeholder block with a band of light sweeping across it.
 *
 * Two things make the effect cheap. The band is a single gradient moved with
 * `translateX`, so nothing relayouts and the whole animation stays on the UI
 * thread; and the sweep distance comes from the block's own measured width,
 * which keeps the speed consistent whether the block is an avatar or a full
 * card.
 *
 * Hidden from assistive tech: the container that owns the skeleton announces
 * the loading state once, and a screen reader walking dozens of empty boxes
 * would learn nothing from them.
 */
export const Skeleton = memo(function Skeleton({ className, style, delay = 0 }: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth((current) => (Math.abs(current - next) > 0.5 ? next : current));
  }, []);

  // Derived rather than stored in an effect: the loop restarts by itself when
  // the width arrives, and stops being created at all under reduced motion.
  const progress = useDerivedValue(() => {
    if (reduceMotion || width === 0) return 0;

    return withDelay(
      delay,
      withRepeat(withTiming(1, { duration: SWEEP_MS, easing: Easing.inOut(Easing.ease) }), -1),
    );
  }, [delay, reduceMotion, width]);

  const bandStyle = useAnimatedStyle(() => {
    const band = width * BAND_RATIO;

    return {
      // Starts fully outside the left edge and leaves past the right one, so the
      // loop has no visible seam.
      transform: [{ translateX: -band + progress.value * (width + band) }],
      width: band,
    };
  });

  return (
    <View
      accessibilityElementsHidden
      className={cn('overflow-hidden rounded-lg bg-surface-raised', className)}
      importantForAccessibility="no-hide-descendants"
      onLayout={handleLayout}
      style={style}
      // Hidden from assistive tech, so a testID is the only way a test can
      // count the blocks a variant renders.
      testID="skeleton-block"
    >
      {/* No band at all under reduced motion — a static block still reads as a
          placeholder, and a pulse would only trade one motion for another. */}
      {reduceMotion ? null : (
        <Animated.View style={[StyleSheet.absoluteFill, bandStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(118,235,60,0.10)', 'transparent']}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
});
