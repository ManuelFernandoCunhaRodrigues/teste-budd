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
  /**
   * Public path prefixes owned by this tab.
   *
   * A nested Stack can expose more than one URL while remaining in the same
   * tab. Keeping those aliases beside the trigger is what makes the label,
   * icon, notch and indicator share one route-derived active state.
   */
  activePathPrefixes: readonly string[];
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
  {
    name: 'lineup',
    href: '/lineup',
    activePathPrefixes: ['/lineup'],
    label: 'LineUp',
    Icon: LineupIcon,
  },
  {
    name: 'map',
    href: '/map',
    activePathPrefixes: ['/map'],
    label: 'Mapa',
    Icon: MapIcon,
  },
  {
    name: 'role',
    href: '/role',
    activePathPrefixes: ['/role', '/bar'],
    label: 'ROLÊ',
    Icon: RoleIcon,
    iconSize: 26,
  },
  {
    name: 'products',
    href: '/products',
    activePathPrefixes: ['/products'],
    label: 'Produtos',
    Icon: ProductsIcon,
  },
  {
    name: 'profile',
    href: '/profile',
    activePathPrefixes: ['/profile'],
    label: 'Perfil',
    Icon: ProfileIcon,
  },
];

export const TAB_COUNT = TAB_ITEMS.length;

/** Index of ROLÊ. Used as the resting position when no tab matches the route. */
export const CENTER_TAB_INDEX = Math.floor(TAB_COUNT / 2);

/** Android Back returns through visited tabs instead of jumping to LineUp. */
export const TAB_BACK_BEHAVIOR = 'history' as const;

// --- Geometry ---------------------------------------------------------------
//
// Every dimension below is in points, and the SVG is drawn 1:1 with them (the
// viewBox matches the pixel size exactly), so a value here means the same thing
// in the path, in the layout and in the animation. Nothing is tuned per device:
// the only runtime inputs are the measured bar width and the safe-area inset.

/** Icon edge length for the four outer tabs. ROLÊ overrides it in `TAB_ITEMS`. */
export const ICON_SIZE = 24;

/** Vertical rhythm of a tab cell, top to bottom. */
export const ROW_PADDING_TOP = 14;
export const ICON_LABEL_GAP = 6;
/** Base line height for the `2xs` label. */
export const LABEL_LINE_HEIGHT = 14;
/**
 * Navigation chrome has finite width and height, so labels scale to a tested
 * cap instead of being disabled entirely. The row reserves the capped height,
 * which prevents clipping when the device font size is enlarged.
 */
export const LABEL_MAX_FONT_SIZE_MULTIPLIER = 1.3;
export const LABEL_RESERVED_HEIGHT = Math.ceil(
  LABEL_LINE_HEIGHT * LABEL_MAX_FONT_SIZE_MULTIPLIER,
);
export const ROW_PADDING_BOTTOM = 14;

/**
 * Height of the bar's *content*, excluding the safe-area inset.
 *
 * Derived rather than picked: it is exactly the space the row needs. The inset
 * is added on top of this at runtime — never taken out of it, which was the bug
 * that squeezed the icons on any device with a gesture bar.
 */
export const TAB_BAR_HEIGHT =
  ROW_PADDING_TOP + ICON_SIZE + ICON_LABEL_GAP + LABEL_RESERVED_HEIGHT + ROW_PADDING_BOTTOM;

/**
 * Side inset, so the floating bar never touches the screen edges.
 *
 * Widening this narrows the bar, which pulls the outer tab centres inward and
 * makes the notch clamp harder on small screens — see `NOTCH_WIDTH`. The design
 * calls for 12–20; 16 was tried first and pushed the worst-case notch offset to
 * 3.2pt, past the 3pt the geometry tests hold the line at. 12 is the widest
 * value in that range that keeps it at 2.4pt.
 */
export const TAB_BAR_HORIZONTAL_MARGIN = 12;

/**
 * Vertical gap below the bar. Deliberately zero.
 *
 * The bar floats horizontally but its bottom edge meets the screen edge, so
 * scrolling content can never appear in a strip underneath it. A non-zero value
 * here would reintroduce exactly that.
 */
export const TAB_BAR_BOTTOM_GAP = 0;

/** Top-corner radius. Shrinks automatically when the notch travels near a corner. */
export const TAB_BAR_CORNER_RADIUS = 22;

/** Diameter of the green circle that marks the active tab. */
export const CENTER_BUTTON_SIZE = 56;

/**
 * Horizontal span of the concave notch.
 *
 * Bounded on both sides. It must exceed `CENTER_BUTTON_SIZE` or the indicator
 * pokes out through the walls; and half of it must stay under 10% of the
 * narrowest supported bar width — that is where the outer tabs are centred, and
 * anything wider forces the notch to clamp away from them. On a 320pt screen the
 * bar is 296pt wide, so the outer tabs sit at 29.6pt: at 64 the worst case is
 * off by 2.4pt, against 6.4pt at 72.
 */
export const NOTCH_WIDTH = 64;

/** How far the notch dips below the bar's flat top edge. */
export const NOTCH_DEPTH = 30;

/**
 * Where the indicator's centre sits relative to the bar's flat top edge.
 *
 * Negative is above. At -2 the circle's lower edge lands 4pt clear of the notch
 * floor (`NOTCH_DEPTH - CENTER_BUTTON_SIZE / 2 - 2`), so it nests in the curve
 * without touching it and without floating visibly high.
 */
export const INDICATOR_CENTER_OFFSET = -2;

/**
 * Space reserved above the bar's top edge for the part of the indicator that
 * overhangs it, plus 2pt so its shadow is not clipped by the SVG bounds.
 */
export const TAB_BAR_OVERHANG = CENTER_BUTTON_SIZE / 2 - INDICATOR_CENTER_OFFSET + 2;

/**
 * How far an icon must travel upward to land in the centre of the indicator.
 *
 * Takes the icon's own size because ROLÊ is drawn 2pt larger than the rest: a
 * single shared constant would leave the centre tab off by a point. Derived
 * from the row metrics, so changing the padding keeps every icon centred in the
 * circle instead of drifting out of it.
 */
export function activeIconLift(iconSize: number): number {
  return ROW_PADDING_TOP + iconSize / 2 - INDICATOR_CENTER_OFFSET;
}

/** Within the 1.08–1.15 band the design calls for. */
export const ACTIVE_ICON_SCALE = 1.1;

/** Scale applied while a tab is held down. */
export const PRESSED_SCALE = 0.94;

/**
 * Extra breathing room between the last piece of scrollable content and the top
 * of the bar, so a final list item clears the indicator rather than tucking
 * under it.
 */
export const TAB_BAR_CONTENT_CLEARANCE = 24;
