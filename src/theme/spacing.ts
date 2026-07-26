/** Spacing scale in points, matching the design's 2px-based rhythm. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

/** Horizontal padding used by most screens in the design. */
export const SCREEN_PADDING = spacing.lg;

/**
 * Minimum touch target. Every interactive element in the design already
 * measures 44pt; keep this constant when adding new ones.
 */
export const MIN_TOUCH_TARGET = 44;

export type SpacingToken = keyof typeof spacing;
