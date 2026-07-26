import {
  canGoToNextMonth,
  canGoToPreviousMonth,
  clampMonthOffset,
  formatMonthLabel,
  isWithinMonth,
  monthRange,
  MONTH_OFFSET_RANGE,
} from '../formatDate';

/**
 * Order-history month stepper (M-04).
 *
 * The stepper allowed walking forward indefinitely into months that cannot hold
 * orders, and backwards without limit.
 */

/** Fixed reference so the assertions do not depend on the wall clock. */
const JULY_2026 = new Date(2026, 6, 15, 12, 0);

describe('clampMonthOffset', () => {
  it('never allows a future month', () => {
    expect(clampMonthOffset(1)).toBe(0);
    expect(clampMonthOffset(99)).toBe(MONTH_OFFSET_RANGE.max);
  });

  it('stops at the oldest navigable month', () => {
    expect(clampMonthOffset(-999)).toBe(MONTH_OFFSET_RANGE.min);
  });

  it('keeps values inside the range untouched', () => {
    expect(clampMonthOffset(-3)).toBe(-3);
    expect(clampMonthOffset(0)).toBe(0);
  });

  it('handles non-finite and fractional input', () => {
    expect(clampMonthOffset(Number.NaN)).toBe(0);
    expect(clampMonthOffset(Number.POSITIVE_INFINITY)).toBe(MONTH_OFFSET_RANGE.max);
    expect(clampMonthOffset(-2.7)).toBe(-2);
  });
});

describe('navigation guards', () => {
  it('forward is closed at the current month', () => {
    expect(canGoToNextMonth(0)).toBe(false);
    expect(canGoToNextMonth(-1)).toBe(true);
  });

  it('backward is closed at the range floor', () => {
    expect(canGoToPreviousMonth(MONTH_OFFSET_RANGE.min)).toBe(false);
    expect(canGoToPreviousMonth(0)).toBe(true);
  });
});

describe('formatMonthLabel', () => {
  it('labels the current month', () => {
    expect(formatMonthLabel(0, JULY_2026)).toBe('Julho de 2026');
  });

  it('crosses a year boundary going back', () => {
    expect(formatMonthLabel(-7, JULY_2026)).toBe('Dezembro de 2025');
  });
});

describe('monthRange', () => {
  it('spans the whole month inclusively', () => {
    const { start, end } = monthRange(0, JULY_2026);

    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(6);
    // Day 0 of August is 31 July.
    expect(end.getDate()).toBe(31);
    expect(end.getMonth()).toBe(6);
  });

  it('handles February in a leap year', () => {
    const { end } = monthRange(0, new Date(2028, 1, 10));
    expect(end.getDate()).toBe(29);
  });
});

describe('isWithinMonth', () => {
  it('includes an order from the same month', () => {
    expect(isWithinMonth(new Date(2026, 6, 3, 9, 0).toISOString(), 0, JULY_2026)).toBe(true);
  });

  it('includes the first and last instant of the month', () => {
    expect(isWithinMonth(new Date(2026, 6, 1, 0, 0, 0).toISOString(), 0, JULY_2026)).toBe(true);
    expect(isWithinMonth(new Date(2026, 6, 31, 23, 59, 59).toISOString(), 0, JULY_2026)).toBe(true);
  });

  it('excludes an order from an adjacent month', () => {
    expect(isWithinMonth(new Date(2026, 5, 30, 23, 0).toISOString(), 0, JULY_2026)).toBe(false);
    expect(isWithinMonth(new Date(2026, 7, 1, 1, 0).toISOString(), 0, JULY_2026)).toBe(false);
  });

  it('matches the month an offset refers to', () => {
    expect(isWithinMonth(new Date(2026, 5, 10).toISOString(), -1, JULY_2026)).toBe(true);
  });

  it('returns false for an invalid date instead of throwing', () => {
    expect(isWithinMonth('not a date', 0, JULY_2026)).toBe(false);
    expect(isWithinMonth('', 0, JULY_2026)).toBe(false);
  });
});
