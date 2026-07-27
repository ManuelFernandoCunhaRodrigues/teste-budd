import { Easing } from 'react-native-reanimated';

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

/**
 * Easing curves, shared so the same kind of movement reads the same everywhere.
 *
 * `standard` covers almost everything. The other three exist for the cases where
 * direction carries meaning: something arriving should settle (`decelerate`),
 * something leaving should gather speed (`accelerate`), and something the user
 * asked for directly can afford a firmer attack (`emphasized`).
 */
export const easing = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  emphasized: Easing.bezier(0.3, 0, 0, 1),
  decelerate: Easing.out(Easing.cubic),
  accelerate: Easing.in(Easing.cubic),
} as const;

/**
 * Spring presets for movement the user drives.
 *
 * Timing is for state changes — a thing becomes visible, a colour becomes
 * another colour. Springs are for anything that should feel like it has mass:
 * a sheet being dragged, a button pushed, a notch chasing a tap.
 */
export const spring = {
  /** Settles without overshoot. Sheets, panels, anything large. */
  soft: { damping: 18, stiffness: 180, mass: 0.8 },
  /** Quick and tight, for direct manipulation. */
  interactive: { damping: 15, stiffness: 240, mass: 0.7 },
  /** Allows a little overshoot, for moments worth noticing. */
  expressive: { damping: 12, stiffness: 190, mass: 0.75 },
} as const;

/**
 * How far an element travels on entrance, in points.
 *
 * Deliberately small. A long slide reads as the screen being rebuilt; 8pt reads
 * as it settling into place.
 */
export const motionOffset = {
  screen: 8,
  card: 12,
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
