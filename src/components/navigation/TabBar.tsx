import { usePathname } from 'expo-router';
import { View, useWindowDimensions, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { colors, duration, shadows } from '@/theme';

import { TAB_BAR_HEIGHT, TAB_ITEMS } from './tabs.config';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Radius of the concave notch, matching the 56pt indicator plus a ~6pt ring. */
const NOTCH_RADIUS = 34;
/** Vertical centre of the notch arc, relative to the bar's flat top edge. */
const NOTCH_CENTER_Y = 8;
/** Y of the flat bar top within the SVG viewBox. */
const BAR_TOP = 6;
const SVG_HEIGHT = 90;
const INDICATOR_SIZE = 56;

/**
 * Builds the bar outline with a concave notch centred on the active tab.
 *
 * Runs as a worklet so the path is recomputed on the UI thread every frame
 * while the notch slides, rather than round-tripping through JS.
 */
function buildNotchPath(center: number, width: number): string {
  'worklet';
  // Where the arc meets the flat top edge.
  const halfChord = Math.sqrt(
    NOTCH_RADIUS * NOTCH_RADIUS - (NOTCH_CENTER_Y - BAR_TOP) * (NOTCH_CENTER_Y - BAR_TOP),
  );
  const left = center - halfChord;
  const right = center + halfChord;

  return (
    `M0,${BAR_TOP} H${(left - 12).toFixed(1)} ` +
    // 12pt fillets ease the flat edge into the arc.
    `Q${(left - 2).toFixed(1)},${BAR_TOP} ${left.toFixed(1)},9 ` +
    `A${NOTCH_RADIUS},${NOTCH_RADIUS} 0 0 0 ${right.toFixed(1)},9 ` +
    `Q${(right + 2).toFixed(1)},${BAR_TOP} ${(right + 12).toFixed(1)},${BAR_TOP} ` +
    `H${width} V${SVG_HEIGHT} H0 Z`
  );
}

export interface TabBarProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Custom bottom navigation: a dark bar whose notch and green indicator slide to
 * the active tab.
 *
 * Rendered through `<TabList asChild>`, so `children` are the `TabTrigger`
 * elements and this component supplies all of the chrome around them.
 */
export function TabBar({ children, style, ...props }: TabBarProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  // Derive the active tab from the URL so the chrome stays correct on deep
  // links and back navigation, not just on taps.
  const activeIndex = Math.max(
    0,
    TAB_ITEMS.findIndex((tab) => pathname.startsWith(tab.href)),
  );

  const progress = useDerivedValue(
    () => withTiming(activeIndex, { duration: duration.enter }),
    [activeIndex],
  );

  const centerOf = (index: number) => ((index + 0.5) * width) / TAB_ITEMS.length;

  const pathProps = useAnimatedProps(() => ({
    d: buildNotchPath(((progress.value + 0.5) * width) / TAB_ITEMS.length, width),
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          ((progress.value + 0.5) * width) / TAB_ITEMS.length - INDICATOR_SIZE / 2,
      },
    ],
  }));

  return (
    <View
      className="relative"
      style={[{ height: TAB_BAR_HEIGHT, paddingBottom: insets.bottom }, style]}
      {...props}
    >
      <Svg
        height={SVG_HEIGHT}
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: -8, left: 0 }}
        viewBox={`0 0 ${width} ${SVG_HEIGHT}`}
        width={width}
      >
        <AnimatedPath
          animatedProps={pathProps}
          d={buildNotchPath(centerOf(activeIndex), width)}
          fill={colors.surfaceNav}
        />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: -28,
            left: 0,
            width: INDICATOR_SIZE,
            height: INDICATOR_SIZE,
            borderRadius: INDICATOR_SIZE / 2,
            backgroundColor: colors.primary,
          },
          shadows.navIndicator,
          indicatorStyle,
        ]}
      />

      <View className="h-full flex-row items-start pt-3.5">{children}</View>
    </View>
  );
}
