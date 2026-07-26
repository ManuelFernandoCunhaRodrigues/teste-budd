import { RECHARGE } from '@/constants/app';

import { previewRechargeFee, validateRechargeAmount } from '../walletValidation';

describe('validateRechargeAmount', () => {
  it('rejects an empty field', () => {
    expect(validateRechargeAmount(null)?.code).toBe('validation');
  });

  it('rejects zero', () => {
    expect(validateRechargeAmount(0)?.code).toBe('validation');
  });

  it('rejects a negative amount', () => {
    expect(validateRechargeAmount(-5_000)?.code).toBe('validation');
  });

  it('rejects NaN and Infinity', () => {
    // These would slip past a naive range comparison.
    expect(validateRechargeAmount(Number.NaN)?.code).toBe('validation');
    expect(validateRechargeAmount(Number.POSITIVE_INFINITY)?.code).toBe('validation');
  });

  it('rejects fractional cents', () => {
    expect(validateRechargeAmount(1_000.5)?.code).toBe('validation');
  });

  it('rejects below the minimum', () => {
    expect(validateRechargeAmount(RECHARGE.minInCents - 1)?.code).toBe('validation');
  });

  it('rejects above the maximum', () => {
    expect(validateRechargeAmount(RECHARGE.maxInCents + 1)?.code).toBe('validation');
  });

  it('accepts the boundaries', () => {
    expect(validateRechargeAmount(RECHARGE.minInCents)).toBeNull();
    expect(validateRechargeAmount(RECHARGE.maxInCents)).toBeNull();
  });

  it('carries a user-safe message with no technical detail', () => {
    const error = validateRechargeAmount(0);

    expect(error?.userMessage).toBeTruthy();
    expect(error?.userMessage).not.toContain('validateRechargeAmount');
  });
});

describe('previewRechargeFee', () => {
  it('splits the amount into fee and net, in whole cents', () => {
    const { feeInCents, netInCents } = previewRechargeFee(10_000);

    expect(feeInCents).toBe(500);
    expect(netInCents).toBe(9_500);
    expect(feeInCents + netInCents).toBe(10_000);
  });

  it('never produces a fractional cent', () => {
    const { feeInCents, netInCents } = previewRechargeFee(333);

    expect(Number.isInteger(feeInCents)).toBe(true);
    expect(Number.isInteger(netInCents)).toBe(true);
    expect(feeInCents + netInCents).toBe(333);
  });
});
