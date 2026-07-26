/**
 * The design uses CSS `linear-gradient(150deg, …)` fills as stand-in artwork
 * for venue and product photography. React Native has no CSS gradients, so
 * each one is modelled as a colour pair rendered by `expo-linear-gradient`.
 *
 * These are placeholders for real imagery — when the API starts returning
 * photo URLs, swap the `GradientFill` on the entity for an image source.
 */
export type GradientFill = readonly [string, string];

export const gradients = {
  neutral: ['#1C1C1C', '#0A0A0A'],
  green: ['#12240F', '#060B05'],
  amber: ['#241A10', '#0B0704'],
  blue: ['#101822', '#05080B'],
  plum: ['#201018', '#0A0508'],
  forest: ['#0F3312', '#040804'],
  violet: ['#1A1030', '#050408'],
  rust: ['#301A10', '#080504'],
} as const satisfies Record<string, GradientFill>;

export type GradientToken = keyof typeof gradients;
