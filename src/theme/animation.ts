/** Animation durations in milliseconds, lifted from the design's keyframes. */
export const duration = {
  press: 120,
  fast: 180,
  base: 250,
  enter: 420,
  slow: 600,
  flame: 1600,
  glow: 1800,
} as const;

/** How long each faux-loading screen dwells before revealing its content. */
export const loadingDelay = {
  boot: 1900,
  role: 1100,
  map: 1850,
  artist: 700,
} as const;

/** Toast visibility window. */
export const TOAST_DURATION = 2200;

/** Layering. Keeping these central avoids z-index arms races. */
export const zIndex = {
  base: 0,
  card: 1,
  header: 5,
  nav: 10,
  overlay: 20,
  dialog: 22,
  toast: 25,
} as const;

export const opacity = {
  pressed: 0.85,
  disabled: 0.45,
  scrim: 0.55,
} as const;
