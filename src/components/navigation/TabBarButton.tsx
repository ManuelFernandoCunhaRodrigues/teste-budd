import type { TabTriggerSlotProps } from 'expo-router/ui';
import { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  colors,
  duration,
  fontSize,
  fontWeight,
  MIN_TOUCH_TARGET,
} from '@/theme';

import type { IconProps } from '../ui/icons';
import {
  ACTIVE_ICON_SCALE,
  activeIconLift,
  ICON_LABEL_GAP,
  ICON_SIZE,
  LABEL_MAX_FONT_SIZE_MULTIPLIER,
  LABEL_LINE_HEIGHT,
  PRESSED_SCALE,
  ROW_PADDING_BOTTOM,
  ROW_PADDING_TOP,
  TAB_BAR_OVERHANG,
} from './tabs.config';

export interface TabBarButtonProps
  extends Omit<TabTriggerSlotProps, 'children' | 'style'> {
  /**
   * Route-derived state supplied by the tabs layout. `TabTrigger` also injects
   * `isFocused`; it is deliberately ignored so the icon, label and parent
   * notch cannot acquire separate sources of truth.
   */
  isActive: boolean;
  /** Injected by `TabTrigger` when used with `asChild`. */
  isFocused?: boolean;
  label: string;
  Icon: (props: IconProps) => React.JSX.Element;
  iconSize?: number;
  style?: PressableProps['style'];
}

/**
 * A single tab.
 *
 * When focused the icon lifts by exactly `ACTIVE_ICON_LIFT` — derived from the
 * row metrics in `tabs.config`, so it lands in the centre of the indicator
 * rather than near it — and turns near-black to read against the green. The
 * label stays put and shifts to the brand green, which keeps the tab named
 * while it is active instead of leaving an unlabelled circle.
 *
 * The icon colour is a cross-fade between two copies because SVG `fill` cannot
 * be driven by an animated style; the label colour can be, so it is.
 */
export function TabBarButton({
  isActive,
  isFocused: _navigatorIsFocused,
  label,
  Icon,
  iconSize = ICON_SIZE,
  onPress,
  style,
  ...props
}: TabBarButtonProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(isActive ? 1 : 0);
  const pressed = useSharedValue(0);

  // Driven from an effect, not the render body — mutating a shared value during
  // render is a side effect and misbehaves under concurrent rendering.
  useEffect(() => {
    const target = isActive ? 1 : 0;
    progress.value = reduceMotion
      ? target
      : withTiming(target, { duration: duration.enter });
  }, [isActive, progress, reduceMotion]);

  // Not wrapped in `useCallback`: `react-hooks/immutability` rejects writing to
  // a shared value from inside a memoised callback, and memoising a handler this
  // cheap buys nothing.
  const setPressed = (value: number) => {
    pressed.value = reduceMotion ? value : withTiming(value, { duration: duration.press });
  };

  const lift = activeIconLift(iconSize);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -lift * progress.value },
      {
        scale:
          (1 + (ACTIVE_ICON_SCALE - 1) * progress.value) *
          (1 - (1 - PRESSED_SCALE) * pressed.value),
      },
    ],
  }));

  const activeIconStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const inactiveIconStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colors.textDim, colors.primary]),
  }));

  return (
    <Pressable
      {...props}
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      // `TabTrigger` already avoids a duplicate navigation when focused, but
      // still emits the useful `tabPress` event. Always forwarding preserves
      // that native navigator behaviour.
      onPress={onPress}
      onPressIn={() => setPressed(1)}
      onPressOut={() => setPressed(0)}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        // Last on purpose: `TabTrigger asChild` injects `flexDirection: row`.
        // The visual contract is icon over label, and the raised icon remains
        // inside this full-height Pressable's hit rectangle.
        styles.button,
      ]}
      testID={`tab-${label}`}
    >
      <Animated.View pointerEvents="none" style={iconStyle}>
        <View style={{ width: iconSize, height: iconSize }}>
          <Animated.View style={inactiveIconStyle}>
            <Icon color={colors.textDim} size={iconSize} />
          </Animated.View>
          {/* Stacked on top so the two colours cross-fade in place. */}
          <Animated.View style={[{ position: 'absolute', inset: 0 }, activeIconStyle]}>
            <Icon color={colors.background} size={iconSize} />
          </Animated.View>
        </View>
      </Animated.View>

      {/* Styled from tokens rather than a class: NativeWind does not wire
          `className` through `Animated.Text`, and the colour has to be animated. */}
      <Animated.Text
        adjustsFontSizeToFit
        maxFontSizeMultiplier={LABEL_MAX_FONT_SIZE_MULTIPLIER}
        minimumFontScale={0.85}
        numberOfLines={1}
        pointerEvents="none"
        style={[
          {
            marginTop: ICON_LABEL_GAP,
            fontSize: fontSize['2xs'],
            lineHeight: LABEL_LINE_HEIGHT,
            fontWeight: fontWeight.semibold,
          },
          labelStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: TAB_BAR_OVERHANG + ROW_PADDING_TOP,
    paddingBottom: ROW_PADDING_BOTTOM,
    overflow: 'visible',
  },
});
