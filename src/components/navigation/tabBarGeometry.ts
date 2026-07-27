import {
  NOTCH_DEPTH,
  NOTCH_WIDTH,
  TAB_BAR_BOTTOM_CORNER_RADIUS,
  TAB_BAR_CORNER_RADIUS,
  TAB_BAR_OVERHANG,
  TAB_COUNT,
} from './tabs.config';

/**
 * Pure geometry for the tab bar outline.
 *
 * Kept out of the component, and free of hooks, so the shape can be asserted
 * directly in tests: a path is easy to get subtly wrong and impossible to spot
 * in a snapshot.
 *
 * Both functions are worklets — the notch is redrawn on the UI thread on every
 * frame of the slide, so they must be callable from there.
 */

/** Horizontal centre of tab `index`, in bar-local coordinates. */
export function tabCenter(index: number, barWidth: number): number {
  'worklet';
  return ((index + 0.5) * barWidth) / TAB_COUNT;
}

/**
 * Keeps the notch inside the bar.
 *
 * The outer tabs are centred at 10% of the bar's width, which is closer to the
 * edge than half the notch is wide, so their notch would otherwise hang off the
 * end and leave an open path. Clamping costs a couple of points of alignment on
 * the first and last tab only — and because the indicator is positioned from
 * this same function, the two can never drift apart.
 */
export function clampNotchCenter(center: number, barWidth: number): number {
  'worklet';
  if (!Number.isFinite(center) || !Number.isFinite(barWidth)) return 0;

  const half = NOTCH_WIDTH / 2;
  if (barWidth <= NOTCH_WIDTH) return barWidth / 2;
  return Math.min(Math.max(center, half), barWidth - half);
}

/**
 * The bar outline: discreetly rounded top corners, a concave notch centred on
 * `center`, and heavily rounded bottom corners.
 *
 * The notch is two mirrored cubic Béziers rather than a circular arc. Every
 * control point shares a y with the anchor it belongs to, which makes the
 * tangent horizontal at the start, at the floor and at the end — so the curve
 * enters and leaves the flat edge smoothly instead of meeting it at an angle.
 * The previous arc-plus-fillet construction computed its chord from one y and
 * drew its endpoints at another, leaving a slight kink.
 *
 * Corner radii shrink to whatever room the notch leaves them, so the path stays
 * closed and self-consistent even when the notch sits against a corner.
 */
export function buildTabBarPath(center: number, barWidth: number, totalHeight: number): string {
  'worklet';

  // Degenerate during the first layout pass; a valid empty path avoids an SVG
  // warning and is replaced as soon as the real width arrives. `isFinite` rather
  // than `<= 0`, because a NaN width slips through a comparison and poisons every
  // coordinate downstream.
  if (!Number.isFinite(barWidth) || !Number.isFinite(totalHeight) || !Number.isFinite(center)) {
    return 'M0,0 Z';
  }
  if (barWidth <= 0 || totalHeight <= 0) return 'M0,0 Z';

  const top = TAB_BAR_OVERHANG;
  const half = NOTCH_WIDTH / 2;
  const cx = clampNotchCenter(center, barWidth);

  const left = cx - half;
  const right = cx + half;

  const leftRadius = Math.max(0, Math.min(TAB_BAR_CORNER_RADIUS, left));
  const rightRadius = Math.max(0, Math.min(TAB_BAR_CORNER_RADIUS, barWidth - right));

  // Bézier handle lengths, as a fraction of the notch half-width. 0.36 keeps the
  // shoulders gentle; 0.52 flattens the floor so the indicator sits in a bowl
  // rather than a V.
  const shoulder = half * 0.36;
  const floor = half * 0.52;
  const depth = top + NOTCH_DEPTH;

  const start =
    leftRadius > 0.5
      ? `M0,${(top + leftRadius).toFixed(2)} A${leftRadius.toFixed(2)},${leftRadius.toFixed(2)} 0 0 1 ${leftRadius.toFixed(2)},${top.toFixed(2)} `
      : `M0,${top.toFixed(2)} `;

  const end =
    rightRadius > 0.5
      ? `H${(barWidth - rightRadius).toFixed(2)} A${rightRadius.toFixed(2)},${rightRadius.toFixed(2)} 0 0 1 ${barWidth.toFixed(2)},${(top + rightRadius).toFixed(2)} `
      : `H${barWidth.toFixed(2)} `;

  // Bottom corners are rounded far harder than the top ones, which is what makes
  // the bar read as a floating pill rather than a panel stuck to the edge. The
  // radius is capped by both half the width and the body height, so a narrow or
  // short bar degrades to a smaller curve instead of an invalid path.
  const bottomRadius = Math.max(
    0,
    Math.min(TAB_BAR_BOTTOM_CORNER_RADIUS, barWidth / 2, totalHeight - top),
  );

  const bottom =
    bottomRadius > 0.5
      ? `V${(totalHeight - bottomRadius).toFixed(2)} ` +
        `A${bottomRadius.toFixed(2)},${bottomRadius.toFixed(2)} 0 0 1 ${(barWidth - bottomRadius).toFixed(2)},${totalHeight.toFixed(2)} ` +
        `H${bottomRadius.toFixed(2)} ` +
        `A${bottomRadius.toFixed(2)},${bottomRadius.toFixed(2)} 0 0 1 0,${(totalHeight - bottomRadius).toFixed(2)} Z`
      : `V${totalHeight.toFixed(2)} H0 Z`;

  return (
    start +
    `H${left.toFixed(2)} ` +
    `C${(left + shoulder).toFixed(2)},${top.toFixed(2)} ` +
    `${(cx - floor).toFixed(2)},${depth.toFixed(2)} ` +
    `${cx.toFixed(2)},${depth.toFixed(2)} ` +
    `C${(cx + floor).toFixed(2)},${depth.toFixed(2)} ` +
    `${(right - shoulder).toFixed(2)},${top.toFixed(2)} ` +
    `${right.toFixed(2)},${top.toFixed(2)} ` +
    end +
    bottom
  );
}
