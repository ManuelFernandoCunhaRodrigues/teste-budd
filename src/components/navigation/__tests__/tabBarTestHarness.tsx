import { render } from '@testing-library/react-native';
import { Pressable, type PressableProps } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { TabBar, resolveActiveIndex } from '../TabBar';
import { TabBarButton, tabBarTriggerStyles } from '../TabBarButton';
import { TAB_ITEMS } from '../tabs.config';

/**
 * Shared setup for the tab bar test files.
 *
 * There are two of them, and the split is a harness constraint rather than a
 * grouping choice: after roughly seven mounts of this tree in a single file,
 * React reports overlapping `act()` calls and every later `render` returns an
 * empty tree. The same cases pass in either file on their own, so the ceiling is
 * per-file. The component itself is fine — this is only where the assertions
 * live. Keep each file under that budget when adding cases.
 */

/** Gesture-bar phone: the inset that used to squeeze the row to nothing. */
export const GESTURE_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** Device with physical navigation keys: no software-navigation inset. */
export const BUTTON_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 360, height: 640 },
  insets: { top: 24, left: 0, right: 0, bottom: 0 },
};

/** Android's software three-button navigation reserves a much larger inset. */
export const THREE_BUTTON_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 360, height: 720 },
  insets: { top: 24, left: 0, right: 0, bottom: 48 },
};

/** Smallest width the layout has to survive. */
export const SMALL_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 320, height: 568 },
  insets: { top: 20, left: 0, right: 0, bottom: 0 },
};

export async function renderTabBar(
  pathname: string,
  metrics: Metrics = GESTURE_METRICS,
  injectedButtonStyle?: PressableProps['style'],
) {
  const onPress = jest.fn();
  const activeIndex = resolveActiveIndex(pathname);

  const view = await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <TabBar activeIndex={activeIndex}>
        {TAB_ITEMS.map((item, index) => (
          <Pressable
            accessibilityLabel={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeIndex === index }}
            key={item.name}
            onPress={() => onPress(item.name)}
            style={(state) => [
              typeof injectedButtonStyle === 'function'
                ? injectedButtonStyle(state)
                : injectedButtonStyle,
              tabBarTriggerStyles.button,
              state.pressed && tabBarTriggerStyles.pressed,
            ]}
            testID={`tab-${item.label}`}
          >
            <TabBarButton
              Icon={item.Icon}
              iconSize={item.iconSize}
              isActive={activeIndex === index}
              label={item.label}
            />
          </Pressable>
        ))}
      </TabBar>
    </SafeAreaProvider>,
  );

  return { ...view, onPress };
}

/** Flattens a node's style prop into one object for assertion. */
export function styleOf(node: { props: { style?: unknown } }): Record<string, number> {
  const rawStyle = node.props.style;
  const style =
    typeof rawStyle === 'function'
      ? rawStyle({ pressed: false, hovered: false, focused: false })
      : rawStyle;
  const parts = Array.isArray(style) ? style.flat(Infinity) : [style];
  return Object.assign({}, ...parts.filter(Boolean));
}
