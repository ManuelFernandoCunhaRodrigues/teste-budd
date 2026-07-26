/**
 * Type ramp. The design uses Inter; React Native falls back to the platform
 * system font (SF Pro / Roboto), which carries the same geometric feel and
 * avoids shipping a font binary. Register Inter with `expo-font` in
 * `app/_layout.tsx` if exact parity becomes a requirement.
 */
export const fontSize = {
  '2xs': 11,
  xs: 12,
  sm: 13,
  base: 14,
  md: 15,
  lg: 16,
  xl: 17,
  '2xl': 18,
  '3xl': 20,
  '4xl': 21,
  '5xl': 22,
  '6xl': 24,
  '7xl': 26,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
