/**
 * The splash sequence, as numbers.
 *
 * Kept apart from the components for the same reason the tab bar's geometry is:
 * a timeline is easy to get subtly wrong — a phase that starts before the one
 * feeding it, a total that drifts from the sum of its parts — and impossible to
 * see in a rendered frame. Here it can be asserted directly.
 *
 * One shared value drives everything, and each phase reads a slice of it. That
 * is what keeps the sequence from becoming a pile of `setTimeout`s that fall out
 * of step on a slow device.
 */

/** Milliseconds for the full sequence, inside the 2.8–3.5s the design asks for. */
export const SPLASH_DURATION_MS = 3000;

/** Shortened path when the OS asks for reduced motion. */
export const SPLASH_REDUCED_DURATION_MS = 600;

export interface SplashPhase {
  /** Fraction of the whole sequence where this phase begins. */
  start: number;
  end: number;
}

/**
 * The five acts, in normalised time.
 *
 * Boundaries are shared rather than butted together: `connect` starts exactly
 * where `scatter` ends, so no frame belongs to both or to neither.
 */
export const SPLASH_PHASES = {
  /** A single point wakes up. */
  spark: { start: 0, end: 500 / SPLASH_DURATION_MS },
  /** Other places and experiences appear around it. */
  scatter: { start: 500 / SPLASH_DURATION_MS, end: 1100 / SPLASH_DURATION_MS },
  /** Routes are drawn between them. */
  connect: { start: 1100 / SPLASH_DURATION_MS, end: 1800 / SPLASH_DURATION_MS },
  /** The network gathers towards the centre. */
  converge: { start: 1800 / SPLASH_DURATION_MS, end: 2400 / SPLASH_DURATION_MS },
  /** The mark finishes forming. */
  reveal: { start: 2400 / SPLASH_DURATION_MS, end: 1 },
} as const satisfies Record<string, SplashPhase>;

export type SplashPhaseName = keyof typeof SPLASH_PHASES;

/**
 * Progress within a phase, from the overall progress.
 *
 * Clamped at both ends so a phase reads 0 before its turn and stays at 1
 * afterwards, instead of running backwards or overshooting into the next act.
 */
export function phaseProgress(overall: number, phase: SplashPhase): number {
  'worklet';
  const span = phase.end - phase.start;
  if (span <= 0) return overall >= phase.end ? 1 : 0;

  const local = (overall - phase.start) / span;
  return local < 0 ? 0 : local > 1 ? 1 : local;
}

/**
 * The network's nodes, in a 100×100 viewBox.
 *
 * Hand-placed rather than generated: random points look like noise and land
 * differently on every launch, which the design explicitly rules out. Each one
 * stands for something the app is about, and they are ordered by when they
 * appear — index doubles as the stagger slot.
 */
export const SPLASH_NODES = [
  { x: 50, y: 58, r: 3.2, delay: 0 },
  { x: 26, y: 34, r: 2.4, delay: 1 },
  { x: 74, y: 30, r: 2.8, delay: 2 },
  { x: 18, y: 68, r: 2.0, delay: 3 },
  { x: 82, y: 64, r: 2.2, delay: 4 },
  { x: 38, y: 18, r: 1.8, delay: 5 },
  { x: 62, y: 82, r: 2.4, delay: 6 },
] as const;

/**
 * Curved routes between the nodes.
 *
 * Quadratic rather than straight: a bent line reads as a path through a city,
 * while a straight one reads as a wireframe. Control points are pulled off the
 * midpoint so no two curves bow the same way.
 */
export const SPLASH_LINKS = [
  { from: 0, to: 1, bow: -12 },
  { from: 0, to: 2, bow: 10 },
  { from: 0, to: 3, bow: 8 },
  { from: 0, to: 4, bow: -9 },
  { from: 1, to: 5, bow: 6 },
  { from: 2, to: 4, bow: 7 },
  { from: 3, to: 6, bow: -8 },
] as const;

/** Quadratic path between two nodes, bowed by `bow` off the midpoint. */
export function linkPath(fromIndex: number, toIndex: number, bow: number): string {
  const from = SPLASH_NODES[fromIndex];
  const to = SPLASH_NODES[toIndex];
  if (!from || !to) return '';

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  // Offset perpendicular to the segment, so the bow follows the line's own
  // direction instead of always bending the same way on screen.
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const controlX = midX + (-dy / length) * bow;
  const controlY = midY + (dx / length) * bow;

  return `M${from.x},${from.y} Q${controlX.toFixed(2)},${controlY.toFixed(2)} ${to.x},${to.y}`;
}

/** Stagger slot for node `index`, as a fraction of the scatter phase. */
export function nodeDelayFraction(index: number): number {
  'worklet';
  const total = SPLASH_NODES.length;
  if (total <= 1) return 0;
  // The last node still gets a third of the phase to appear in, rather than
  // arriving exactly as the phase ends.
  return (index / total) * 0.66;
}
