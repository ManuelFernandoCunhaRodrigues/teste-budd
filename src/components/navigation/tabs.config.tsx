import {
  LineupIcon,
  MapIcon,
  ProductsIcon,
  ProfileIcon,
  RoleIcon,
  type IconProps,
} from '../ui/icons';

export interface TabItem {
  /** Trigger name, unique within the tab navigator. */
  name: string;
  /** Route the trigger navigates to. */
  href: string;
  label: string;
  Icon: (props: IconProps) => React.JSX.Element;
  /** The design draws the central flame slightly larger than the others. */
  iconSize?: number;
}

/**
 * The five bottom tabs, in visual order. ROLÊ sits in the middle as the app's
 * home surface, which is why the notch starts centred.
 */
export const TAB_ITEMS: TabItem[] = [
  { name: 'lineup', href: '/lineup', label: 'LineUp', Icon: LineupIcon },
  { name: 'map', href: '/map', label: 'Mapa', Icon: MapIcon },
  { name: 'role', href: '/role', label: 'ROLÊ', Icon: RoleIcon, iconSize: 26 },
  { name: 'products', href: '/products', label: 'Produtos', Icon: ProductsIcon },
  { name: 'profile', href: '/profile', label: 'Perfil', Icon: ProfileIcon },
];

/** Height of the bar itself, excluding the bottom safe-area inset. */
export const TAB_BAR_HEIGHT = 82;

/**
 * Bottom padding screens should reserve so content clears the floating bar.
 * The extra allowance covers the indicator circle that overhangs the top edge.
 */
export const TAB_BAR_CONTENT_INSET = TAB_BAR_HEIGHT + 26;
