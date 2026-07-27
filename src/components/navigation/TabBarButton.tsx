import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
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

export interface TabBarButtonProps {
  /**
   * Route-derived state supplied by the tabs layout, shared with the notch and
   * the trigger's accessibility state.
   */
  isActive: boolean;
  label: string;
  Icon: (props: IconProps) => React.JSX.Element;
  iconSize?: number;
}

/**
 * A single tab.
 *
 * When focused the icon lifts by exactly `ACTIVE_ICON_LIFT` — derived from the
 * row metrics in `tabs.config`, so it lands in the centre of the indicator
 * rather than near it — and turns near-black to read against the green. The
 * label fades out as that happens, leaving the raised circle to stand alone.
 *
 * The icon colour is a cross-fade between two copies because SVG `fill` cannot
 * be driven by an animated style.
 *
 * This component is visual content only. `TabTrigger` itself is the Pressable
 * and the flex item in the row. Keeping that host element direct is important:
 * Expo Router 57 already renders a Pressable when `asChild` is omitted, while a
 * slotted custom component makes layout depend on runtime style merging.
 */
export function TabBarButton({
  isActive,
  label,
  Icon,
  iconSize = ICON_SIZE,
}: TabBarButtonProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(isActive ? 1 : 0);

  // Driven from an effect, not the render body — mutating a shared value during
  // render is a side effect and misbehaves under concurrent rendering.
  useEffect(() => {
    const target = isActive ? 1 : 0;
    progress.value = reduceMotion
      ? target
      : withTiming(target, { duration: duration.enter });
  }, [isActive, progress, reduceMotion]);

  const lift = activeIconLift(iconSize);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -lift * progress.value },
      { scale: 1 + (ACTIVE_ICON_SCALE - 1) * progress.value },
    ],
  }));

  const activeIconStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const inactiveIconStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));

  /**
   * The active tab's label fades out, leaving the indicator to name it.
   *
   * Reverses an earlier choice to keep it green and visible. The design calls
   * for the raised circle to stand alone, and a word directly under it competed
   * with the icon it already carries.
   *
   * Only the ink goes: the label keeps its place in the layout so the row does
   * not shift as selection moves, and the `accessibilityLabel` on the pressable
   * still names the tab, so nothing changes for a screen reader.
   */
  const labelStyle = useAnimatedStyle(() => ({
    color: colors.navIcon,
    opacity: 1 - progress.value,
  }));

  return (
    <>
      <Animated.View pointerEvents="none" style={iconStyle}>
        <View style={{ width: iconSize, height: iconSize }}>
          <Animated.View style={inactiveIconStyle}>
            <Icon color={colors.navIcon} size={iconSize} />
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
            fontWeight: fontWeight.medium,
          },
          labelStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </>
  );
}

/**
 * Applied directly to Expo Router's own Pressable-backed `TabTrigger`.
 *
 * Exported so the production layout and the component harness exercise the
 * same flex contract. Five triggers with `flex: 1` always divide the full row;
 * labels can no longer collapse the navigation into a content-width cluster.
 */
export const tabBarTriggerStyles = StyleSheet.create({
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
  pressed: {
    opacity: 0.78,
    transform: [{ scale: PRESSED_SCALE }],
  },
});
