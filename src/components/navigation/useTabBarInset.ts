import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  TAB_BAR_BOTTOM_GAP,
  TAB_BAR_CONTENT_CLEARANCE,
  TAB_BAR_HEIGHT,
  TAB_BAR_OVERHANG,
} from './tabs.config';

/** Full visible and tappable height of the absolute bar for a given device. */
export function tabBarHeightForInset(bottomInset: number): number {
  return (
    TAB_BAR_OVERHANG +
    TAB_BAR_HEIGHT +
    Math.max(0, bottomInset) +
    TAB_BAR_BOTTOM_GAP
  );
}

/** Bottom space scrollable tab content must reserve. */
export function tabBarContentInsetFor(bottomInset: number): number {
  return tabBarHeightForInset(bottomInset) + TAB_BAR_CONTENT_CLEARANCE;
}

/**
 * How much bottom padding a screen under the tab bar must reserve.
 *
 * This has to be a hook rather than a constant: the absolute bar's real hit box
 * includes its raised overhang, content height and the device bottom inset.
 */
export function useTabBarContentInset(): number {
  const { bottom } = useSafeAreaInsets();
  return tabBarContentInsetFor(bottom);
}

/** Total visual/hit-test height the absolute bar occupies on this device. */
export function useTabBarHeight(): number {
  const { bottom } = useSafeAreaInsets();
  return tabBarHeightForInset(bottom);
}
