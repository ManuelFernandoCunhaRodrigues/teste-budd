import { BARS } from '@/mocks/bars';

import { formatFollowers, formatNumber } from '../number';

/** `pt-BR` number and currency formatting (M-05). */

describe('formatNumber', () => {
  it('groups thousands with a dot', () => {
    expect(formatNumber(1234)).toContain('1.234');
    expect(formatNumber(1234567)).toContain('1.234.567');
  });

  it('leaves small numbers alone', () => {
    expect(formatNumber(27)).toBe('27');
  });

  it('degrades to zero rather than NaN', () => {
    expect(formatNumber(Number.NaN)).toBe('0');
  });
});

describe('formatFollowers', () => {
  it('reads the stored value as thousands', () => {
    // The card rendered a bare `27`, which reads as twenty-seven followers.
    expect(formatFollowers(27)).toBe('27 mil');
    expect(formatFollowers(52)).toBe('52 mil');
  });

  it('switches to millions above a thousand thousands', () => {
    expect(formatFollowers(1200)).toBe('1,2 mi');
  });

  it('drops a trailing zero decimal', () => {
    expect(formatFollowers(2000)).toBe('2 mi');
  });

  it('handles invalid input', () => {
    expect(formatFollowers(Number.NaN)).toBe('0');
    expect(formatFollowers(-5)).toBe('0');
  });
});

describe('catalogue money is in cents', () => {
  it('coupons carry integer cents, not display strings', () => {
    for (const coupon of BARS[0].coupons) {
      expect(Number.isInteger(coupon.valueInCents)).toBe(true);
      expect(Number.isInteger(coupon.minimumInCents)).toBe(true);
      // The old shape was `value: 'R$ 19'`, which bypassed formatting entirely.
      expect(coupon).not.toHaveProperty('value');
      expect(coupon).not.toHaveProperty('minimum');
    }
  });

  it('a voucher minimum is at least its face value', () => {
    for (const coupon of BARS[0].coupons) {
      expect(coupon.minimumInCents).toBeGreaterThanOrEqual(coupon.valueInCents);
    }
  });

  it('venue fees have machine-readable counterparts', () => {
    for (const bar of BARS) {
      expect(Number.isInteger(bar.minOrderInCents)).toBe(true);
      expect(Number.isInteger(bar.serviceFeeInCents)).toBe(true);
    }
  });
});
