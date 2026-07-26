import type { CartItem } from '@/domain/cart/cartTypes';

import { ORDER_LIMITS, buildOrderItems, resolveCartVenueId } from '../orderValidation';

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    lineId: 'bar-do-ze|chopp||',
    venueId: 'bar-do-ze',
    productId: 'chopp-artesanal-500',
    name: 'Chopp',
    unitPriceInCents: 1440,
    quantity: 1,
    ...overrides,
  };
}

/** Captures the thrown `AppError`, whose `message` carries technical detail. */
function thrownFrom(run: () => unknown) {
  try {
    run();
  } catch (error) {
    return error as { code: string; userMessage: string };
  }
  throw new Error('expected the call to throw');
}

describe('buildOrderItems', () => {
  it('rejects an empty cart', () => {
    const error = thrownFrom(() => buildOrderItems([]));

    expect(error.code).toBe('validation');
    expect(error.userMessage).toMatch(/vazio/i);
  });

  it('rejects a cart spanning two venues', () => {
    const error = thrownFrom(() =>
      buildOrderItems([item(), item({ venueId: 'quintal-74', lineId: 'quintal-74|chopp||' })]),
    );

    expect(error.code).toBe('validation');
    expect(error.userMessage).toMatch(/mais de um estabelecimento/i);
  });

  it('rejects a non-integer quantity', () => {
    expect(() => buildOrderItems([item({ quantity: 1.5 })])).toThrow();
  });

  it('rejects a zero or negative quantity', () => {
    expect(() => buildOrderItems([item({ quantity: 0 })])).toThrow();
    expect(() => buildOrderItems([item({ quantity: -2 })])).toThrow();
  });

  it('rejects a quantity above the per-line limit', () => {
    expect(() =>
      buildOrderItems([item({ quantity: ORDER_LIMITS.maxQuantityPerLine + 1 })]),
    ).toThrow();
  });

  it('sends no price fields, so the client cannot set the amount charged', () => {
    const [wire] = buildOrderItems([item({ quantity: 3 })]);

    expect(wire).toEqual({ productId: 'chopp-artesanal-500', quantity: 3 });
    expect(JSON.stringify(wire)).not.toContain('Cents');
  });

  it('carries variant, option and add-on selections through', () => {
    const [wire] = buildOrderItems([
      item({
        variantId: '500ml',
        selectedOptionIds: ['gelo'],
        addOnIds: ['dose-extra'],
        notes: 'sem açúcar',
      }),
    ]);

    expect(wire.variantId).toBe('500ml');
    expect(wire.selectedOptionIds).toEqual(['gelo']);
    expect(wire.addOnIds).toEqual(['dose-extra']);
    expect(wire.notes).toBe('sem açúcar');
  });

  it('omits empty selections rather than sending empty arrays', () => {
    const [wire] = buildOrderItems([item({ selectedOptionIds: [], addOnIds: [] })]);

    expect(wire).not.toHaveProperty('selectedOptionIds');
    expect(wire).not.toHaveProperty('addOnIds');
  });
});

describe('resolveCartVenueId', () => {
  it('returns null for an empty cart', () => {
    expect(resolveCartVenueId([])).toBeNull();
  });

  it('returns the single venue', () => {
    expect(resolveCartVenueId([item(), item({ productId: 'gin-tonica' })])).toBe('bar-do-ze');
  });

  it('returns null when venues disagree, rather than picking one', () => {
    expect(resolveCartVenueId([item(), item({ venueId: 'quintal-74' })])).toBeNull();
  });
});
