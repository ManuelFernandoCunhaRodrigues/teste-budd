/** Corner radii in points. */
export const radius = {
  xs: 7,
  sm: 9,
  md: 12,
  lg: 14,
  xl: 16,
  '2xl': 20,
  '3xl': 26,
  pill: 30,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
