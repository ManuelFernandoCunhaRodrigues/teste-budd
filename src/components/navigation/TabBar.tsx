import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type ViewProps,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { colors, duration, shadows, zIndex } from '@/theme';

import { buildTabBarPath, clampNotchCenter, tabCenter } from './tabBarGeometry';
import {
  CENTER_BUTTON_SIZE,
  CENTER_TAB_INDEX,
  INDICATOR_CENTER_OFFSET,
  TAB_BAR_BOTTOM_GAP,
  TAB_BAR_HEIGHT,
  TAB_BAR_HORIZONTAL_MARGIN,
  TAB_BAR_OVERHANG,
  TAB_ITEMS,
} from './tabs.config';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Resolves the active tab from a pathname.
 *
 * Each tab declares every public path it owns. Matching is segment-aware, so
 * `/bar/123` belongs to Rolê while `/barista` does not. Returns -1 when nothing
 * matches — the caller decides what that means rather than silently falling
 * back to tab 0.
 */
export function resolveActiveIndex(pathname: string): number {
  const normalizedPath =
    pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  return TAB_ITEMS.findIndex((tab) =>
    tab.activePathPrefixes.some(
      (prefix) =>
        normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
    ),
  );
}

export interface TabBarProps extends ViewProps {
  /** Single route-derived index shared by the notch and all tab buttons. */
  activeIndex: number;
  children: React.ReactNode;
}

/**
 * Custom bottom navigation: a floating dark bar whose notch and green indicator
 * slide to the active tab.
 *
 * Rendered through `<TabList asChild>`, so `children` are the `TabTrigger`
 * elements and this component supplies all of the chrome around them.
 *
 * Two things are load-bearing and easy to undo by accident:
 *
 * 1. The actual layout box includes the raised indicator overhang, bar body and
 *    bottom safe-area inset. The whole visible control is therefore inside its
 *    hit-test parent instead of drawing an untappable half-circle outside it.
 * 2. The notch and the indicator both read their x from `clampNotchCenter`, so
 *    there is no arrangement in which the circle sits off the curve.
 * 3. The bar is absolute. Tab screens reserve this same total through
 *    `useTabBarContentInset`; the navigator itself must not consume it again.
 */
export function TabBar({ activeIndex, children, style, ...props }: TabBarProps) {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  // Measured rather than assumed, so the path stays correct if a parent ever
  // adds padding, and re-solves itself on rotation.
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const fallbackWidth = Math.max(0, windowWidth - TAB_BAR_HORIZONTAL_MARGIN * 2);
  const barWidth = measuredWidth || fallbackWidth;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setMeasuredWidth((current) => (Math.abs(current - next) > 0.5 ? next : current));
  }, []);

  const hasActiveTab = activeIndex >= 0 && activeIndex < TAB_ITEMS.length;
  // With no matching route the notch rests under ROLÊ and the indicator hides,
  // rather than marking a tab the user is not on.
  const notchIndex = hasActiveTab ? activeIndex : CENTER_TAB_INDEX;

  const barBodyHeight = TAB_BAR_HEIGHT + insets.bottom;
  const totalHeight = TAB_BAR_OVERHANG + barBodyHeight;

  const progress = useDerivedValue(
    () =>
      reduceMotion ? notchIndex : withTiming(notchIndex, { duration: duration.enter }),
    [notchIndex, reduceMotion],
  );

  const pathProps = useAnimatedProps(() => ({
    d: buildTabBarPath(tabCenter(progress.value, barWidth), barWidth, totalHeight),
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: hasActiveTab ? 1 : 0,
    transform: [
      {
        translateX:
          clampNotchCenter(tabCenter(progress.value, barWidth), barWidth) -
          CENTER_BUTTON_SIZE / 2,
      },
    ],
  }));

  return (
    <View
      {...props}
      accessibilityRole="tablist"
      onLayout={handleLayout}
      style={[
        style,
        styles.container,
        {
          bottom: TAB_BAR_BOTTOM_GAP,
          height: totalHeight,
          marginHorizontal: TAB_BAR_HORIZONTAL_MARGIN,
        },
      ]}
      testID="tab-bar"
    >
      {/* The system gesture/button region gets an opaque app background even
          beside the floating bar's horizontal margins. */}
      <View
        pointerEvents="none"
        style={[
          styles.systemInsetUnderlay,
          {
            height: insets.bottom,
            left: -TAB_BAR_HORIZONTAL_MARGIN,
            right: -TAB_BAR_HORIZONTAL_MARGIN,
          },
        ]}
        testID="tab-bar-system-underlay"
      />

      {/* Decorative: the full-height row below receives every touch. */}
      <Svg
        height={totalHeight}
        pointerEvents="none"
        style={styles.svg}
        testID="tab-bar-surface"
        viewBox={`0 0 ${barWidth} ${totalHeight}`}
        width={barWidth}
      >
        <AnimatedPath
          animatedProps={pathProps}
          d={buildTabBarPath(tabCenter(notchIndex, barWidth), barWidth, totalHeight)}
          fill={colors.surfaceNav}
        />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top:
              TAB_BAR_OVERHANG +
              INDICATOR_CENTER_OFFSET -
              CENTER_BUTTON_SIZE / 2,
            left: 0,
            width: CENTER_BUTTON_SIZE,
            height: CENTER_BUTTON_SIZE,
            borderRadius: CENTER_BUTTON_SIZE / 2,
            backgroundColor: colors.primary,
          },
          shadows.navIndicator,
          indicatorStyle,
        ]}
        testID="tab-bar-indicator"
      />

      <View
        pointerEvents="box-none"
        style={[styles.row, { paddingBottom: insets.bottom }]}
        testID="tab-bar-row"
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    overflow: 'visible',
    zIndex: zIndex.nav,
    elevation: zIndex.nav,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  row: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  systemInsetUnderlay: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.surfaceNav,
  },
});
