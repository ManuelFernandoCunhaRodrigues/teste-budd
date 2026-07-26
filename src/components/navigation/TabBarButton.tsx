import { useEffect } from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, duration } from '@/theme';

import type { IconProps } from '../ui/icons';

export interface TabBarButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  /** Injected by `TabTrigger` when used with `asChild`. */
  isFocused?: boolean;
  label: string;
  Icon: (props: IconProps) => React.JSX.Element;
  iconSize?: number;
}

/**
 * A single tab.
 *
 * When focused, the icon lifts into the notch and turns near-black to read
 * against the green indicator, while the label fades out — the indicator is
 * what names the active tab at that point.
 *
 * The colour change is a cross-fade between two icon copies because SVG `fill`
 * cannot be driven by an animated style.
 */
export function TabBarButton({
  isFocused = false,
  label,
  Icon,
  iconSize = 24,
  ...props
}: TabBarButtonProps) {
  const progress = useSharedValue(isFocused ? 1 : 0);

  // Driven from an effect, not the render body — mutating a shared value during
  // render is a side effect and misbehaves under concurrent rendering.
  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, { duration: duration.enter });
  }, [isFocused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -26 * progress.value }, { scale: 1 + 0.06 * progress.value }],
  }));

  const activeIconStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const inactiveIconStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ translateY: 6 * progress.value }],
  }));

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      className="h-14 flex-1 items-center gap-1.5"
      {...props}
    >
      <Animated.View style={iconStyle}>
        <View>
          <Animated.View style={inactiveIconStyle}>
            <Icon color={colors.textDim} size={iconSize} />
          </Animated.View>
          {/* Stacked on top so the two colours cross-fade in place. */}
          <Animated.View style={[{ position: 'absolute', inset: 0 }, activeIconStyle]}>
            <Icon color="#0A0A0A" size={iconSize} />
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View style={labelStyle}>
        <Text className="text-2xs font-semibold text-text-dim">{label}</Text>
      </Animated.View>
    </Pressable>
  );
}
