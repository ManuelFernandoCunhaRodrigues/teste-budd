import { buildTabBarPath, clampNotchCenter, tabCenter } from '../tabBarGeometry';
import {
  CENTER_BUTTON_SIZE,
  CENTER_TAB_INDEX,
  NOTCH_DEPTH,
  NOTCH_WIDTH,
  TAB_BAR_CORNER_RADIUS,
  TAB_BAR_HORIZONTAL_MARGIN,
  TAB_BAR_OVERHANG,
  TAB_COUNT,
} from '../tabs.config';

/**
 * Tab bar outline geometry.
 *
 * Asserted as maths rather than as a snapshot: a path string diff tells you a
 * curve changed, not whether it is still closed, symmetric, or inside the bar.
 * These are the properties that actually break the shape on a device.
 */

/** Widths spanning a small Android phone up to a large tablet-ish layout. */
const SCREEN_WIDTHS = [320, 360, 390, 412, 430, 768];

function barWidthFor(screenWidth: number): number {
  return screenWidth - TAB_BAR_HORIZONTAL_MARGIN * 2;
}

function numbersIn(path: string): number[] {
  return (path.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

describe('tabCenter', () => {
  it('puts ROLÊ exactly in the middle of the bar', () => {
    expect(tabCenter(CENTER_TAB_INDEX, 300)).toBe(150);
  });

  it('spaces the five tabs evenly', () => {
    const width = 400;
    const centers = Array.from({ length: TAB_COUNT }, (_, i) => tabCenter(i, width));
    const gaps = centers.slice(1).map((c, i) => c - centers[i]);

    for (const gap of gaps) {
      expect(gap).toBeCloseTo(width / TAB_COUNT, 6);
    }
  });

  it('mirrors the first and last tab about the centre', () => {
    const width = 360;
    expect(tabCenter(0, width) + tabCenter(TAB_COUNT - 1, width)).toBeCloseTo(width, 6);
  });
});

describe('clampNotchCenter', () => {
  it.each(SCREEN_WIDTHS)('keeps the notch inside the bar at %ipt wide', (screenWidth) => {
    const width = barWidthFor(screenWidth);
    const half = NOTCH_WIDTH / 2;

    for (let index = 0; index < TAB_COUNT; index += 1) {
      const clamped = clampNotchCenter(tabCenter(index, width), width);

      expect(clamped - half).toBeGreaterThanOrEqual(0);
      expect(clamped + half).toBeLessThanOrEqual(width);
    }
  });

  it('leaves the centre tab untouched', () => {
    const width = barWidthFor(390);
    const raw = tabCenter(CENTER_TAB_INDEX, width);

    expect(clampNotchCenter(raw, width)).toBe(raw);
  });

  /**
   * How far the notch may sit from a tab centre, per screen width.
   *
   * One number for every size would either forbid the 72pt mouth outright or go
   * so slack that a real regression on a large phone slips through. The notch
   * only clamps where half of it does not fit beside the outer tab, which is a
   * function of width — so the budget is too.
   *
   * 390pt and up must be exact: that is every current phone, and the notch
   * missing the icon there would be a defect, not a trade.
   */
  const CLAMP_BUDGET_PT: Record<number, number> = {
    320: 7,
    360: 3,
    390: 0.01,
    412: 0.01,
    430: 0.01,
    768: 0.01,
  };

  it.each(SCREEN_WIDTHS)(
    'keeps the notch within its clamp budget at %ipt wide',
    (screenWidth) => {
      const width = barWidthFor(screenWidth);
      const budget = CLAMP_BUDGET_PT[screenWidth];

      expect(budget).toBeDefined();

      for (let index = 0; index < TAB_COUNT; index += 1) {
        const raw = tabCenter(index, width);
        expect(Math.abs(clampNotchCenter(raw, width) - raw)).toBeLessThan(budget);
      }
    },
  );

  it('tracks every tab exactly on a phone-sized screen', () => {
    // The headline guarantee, stated on its own so widening the notch again
    // cannot quietly trade it away inside a table of tolerances.
    const width = barWidthFor(390);

    for (let index = 0; index < TAB_COUNT; index += 1) {
      const raw = tabCenter(index, width);
      expect(clampNotchCenter(raw, width)).toBe(raw);
    }
  });

  it('centres the notch when the bar is narrower than the notch itself', () => {
    expect(clampNotchCenter(10, 40)).toBe(20);
  });
});

describe('buildTabBarPath', () => {
  const width = barWidthFor(390);
  const height = TAB_BAR_OVERHANG + 100;

  it.each(SCREEN_WIDTHS)('produces a closed path for every tab at %ipt', (screenWidth) => {
    const barWidth = barWidthFor(screenWidth);

    for (let index = 0; index < TAB_COUNT; index += 1) {
      const path = buildTabBarPath(tabCenter(index, barWidth), barWidth, height);

      expect(path.startsWith('M')).toBe(true);
      expect(path.trim().endsWith('Z')).toBe(true);
      expect(numbersIn(path).some(Number.isNaN)).toBe(false);
    }
  });

  it('never contains NaN or undefined, whatever the inputs', () => {
    for (const bad of [0, -10, Number.NaN]) {
      const path = buildTabBarPath(50, bad, height);
      expect(path).not.toMatch(/NaN|undefined/);
    }
  });

  it('anchors the notch symmetrically around the active tab', () => {
    const centre = tabCenter(CENTER_TAB_INDEX, width);
    const half = NOTCH_WIDTH / 2;
    const path = buildTabBarPath(centre, width, height);

    // Left anchor, notch floor, right anchor.
    expect(path).toContain(`H${(centre - half).toFixed(2)} `);
    expect(path).toContain(`${centre.toFixed(2)},${(TAB_BAR_OVERHANG + NOTCH_DEPTH).toFixed(2)}`);
    expect(path).toContain(`${(centre + half).toFixed(2)},${TAB_BAR_OVERHANG.toFixed(2)}`);
  });

  it('moves the notch when the active tab changes', () => {
    const first = buildTabBarPath(tabCenter(0, width), width, height);
    const middle = buildTabBarPath(tabCenter(CENTER_TAB_INDEX, width), width, height);
    const last = buildTabBarPath(tabCenter(TAB_COUNT - 1, width), width, height);

    expect(first).not.toBe(middle);
    expect(middle).not.toBe(last);
    expect(first).not.toBe(last);
  });

  it('rounds both top corners when the notch is in the middle', () => {
    const path = buildTabBarPath(tabCenter(CENTER_TAB_INDEX, width), width, height);
    const radius = TAB_BAR_CORNER_RADIUS.toFixed(2);

    // One arc per corner, both at the full radius.
    expect(path.match(new RegExp(`A${radius},${radius}`, 'g'))).toHaveLength(2);
  });

  it('shrinks the corner rather than letting the notch overrun it', () => {
    const path = buildTabBarPath(tabCenter(0, width), width, height);
    const full = TAB_BAR_CORNER_RADIUS.toFixed(2);

    // The left corner has no room left, so it must not still be drawn at full
    // radius — that is what used to push the curve outside the bar.
    expect(path.match(new RegExp(`A${full},${full}`, 'g')) ?? []).toHaveLength(1);
  });

  it('rounds the bottom corners instead of squaring them off', () => {
    const path = buildTabBarPath(tabCenter(CENTER_TAB_INDEX, width), width, height);

    // The old outline ended `V{height} H0 Z` — a hard rectangle against the
    // screen edge. It now reaches the same depth through two arcs, which is what
    // makes the bar read as floating.
    expect(path).not.toContain(`V${height.toFixed(2)} H0 Z`);
    expect(path).toContain(`,${height.toFixed(2)}`);
    expect(path.trim().endsWith('Z')).toBe(true);
  });

  it('never lets the bottom radius exceed the shape it is rounding', () => {
    // A narrow bar must degrade to a smaller curve rather than emit an arc the
    // path cannot close.
    const narrow = buildTabBarPath(20, 40, 120);

    expect(narrow).not.toContain('NaN');
    expect(narrow.trim().endsWith('Z')).toBe(true);
  });

  it('keeps the indicator clear of the notch floor', () => {
    // Geometric invariant, not a rendering detail: if the circle's lower edge
    // ever reaches the floor of the curve it reads as stuck to it.
    const indicatorBottom = CENTER_BUTTON_SIZE / 2 - 2;

    expect(NOTCH_DEPTH).toBeGreaterThan(indicatorBottom);
    // And the notch has to be wider than the circle, or it pokes out the sides.
    expect(NOTCH_WIDTH).toBeGreaterThan(CENTER_BUTTON_SIZE);
  });
});
