export { BackButton, type BackButtonProps } from './BackButton';
export { TabBar, resolveActiveIndex, type TabBarProps } from './TabBar';
export { TabBarButton, type TabBarButtonProps } from './TabBarButton';
export { buildTabBarPath, clampNotchCenter, tabCenter } from './tabBarGeometry';
export {
  tabBarContentInsetFor,
  tabBarHeightForInset,
  useTabBarContentInset,
  useTabBarHeight,
} from './useTabBarInset';
export {
  TAB_ITEMS,
  TAB_COUNT,
  TAB_BACK_BEHAVIOR,
  TAB_BAR_HEIGHT,
  TAB_BAR_OVERHANG,
  CENTER_TAB_INDEX,
  type TabItem,
} from './tabs.config';
