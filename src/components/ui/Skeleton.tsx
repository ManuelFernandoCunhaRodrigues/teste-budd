import { useEffect, useMemo } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';

import { cn } from '@/utils/cn';

export interface SkeletonProps {
  className?: string;
  style?: ViewStyle;
}

/**
 * Pulsing placeholder for content that is still loading.
 *
 * Uses the RN `Animated` API with `useNativeDriver` so the pulse runs on the UI
 * thread and does not compete with JS work during data fetches.
 */
export function Skeleton({ className, style }: SkeletonProps) {
  // `useMemo` rather than `useRef().current`: reading a ref during render is
  // unsafe under concurrent rendering.
  const opacity = useMemo(() => new Animated.Value(0.35), []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      className={cn('rounded-lg bg-surface-raised', className)}
      importantForAccessibility="no-hide-descendants"
      style={[style, { opacity }]}
    />
  );
}
