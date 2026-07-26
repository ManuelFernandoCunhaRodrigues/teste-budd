import { createCartLineId } from '../cartTypes';

describe('createCartLineId', () => {
  it('separates the same product sold by different venues', () => {
    // The C-03 defect in one assertion: keyed by product id alone, a chopp from
    // two bars collapsed into a single line at one bar's price.
    const barA = createCartLineId({ venueId: 'bar-do-ze', productId: 'chopp-artesanal-500' });
    const barB = createCartLineId({ venueId: 'quintal-74', productId: 'chopp-artesanal-500' });

    expect(barA).not.toBe(barB);
  });

  it('is stable for the same input', () => {
    const input = { venueId: 'bar-do-ze', productId: 'chopp-artesanal-500' };
    expect(createCartLineId(input)).toBe(createCartLineId(input));
  });

  it('separates variants of the same product', () => {
    const small = createCartLineId({ venueId: 'v1', productId: 'p1', variantId: '300ml' });
    const large = createCartLineId({ venueId: 'v1', productId: 'p1', variantId: '500ml' });

    expect(small).not.toBe(large);
  });

  it('treats option order as irrelevant', () => {
    // Picking "gelo, limão" and "limão, gelo" is the same drink; splitting them
    // would leave two half-quantity lines.
    const first = createCartLineId({
      venueId: 'v1',
      productId: 'p1',
      selectedOptionIds: ['gelo', 'limao'],
    });
    const second = createCartLineId({
      venueId: 'v1',
      productId: 'p1',
      selectedOptionIds: ['limao', 'gelo'],
    });

    expect(first).toBe(second);
  });

  it('de-duplicates repeated options', () => {
    const once = createCartLineId({ venueId: 'v1', productId: 'p1', selectedOptionIds: ['gelo'] });
    const twice = createCartLineId({
      venueId: 'v1',
      productId: 'p1',
      selectedOptionIds: ['gelo', 'gelo'],
    });

    expect(once).toBe(twice);
  });

  it('separates different add-ons', () => {
    const plain = createCartLineId({ venueId: 'v1', productId: 'p1' });
    const withAddOn = createCartLineId({ venueId: 'v1', productId: 'p1', addOnIds: ['dose-extra'] });

    expect(plain).not.toBe(withAddOn);
  });

  it('keeps option and add-on lists in separate segments', () => {
    // Without per-segment encoding these two could serialise identically.
    const asOption = createCartLineId({ venueId: 'v1', productId: 'p1', selectedOptionIds: ['x'] });
    const asAddOn = createCartLineId({ venueId: 'v1', productId: 'p1', addOnIds: ['x'] });

    expect(asOption).not.toBe(asAddOn);
  });

  it('does not collide when an id contains a separator character', () => {
    const withPipe = createCartLineId({ venueId: 'a|b', productId: 'c' });
    const shifted = createCartLineId({ venueId: 'a', productId: 'b|c' });

    expect(withPipe).not.toBe(shifted);
  });

  it('ignores notes, which are not a commercial variant', () => {
    // `notes` is deliberately absent from the identity: a stray space in free
    // text must not split a line.
    const base = createCartLineId({ venueId: 'v1', productId: 'p1' });
    expect(base).toBe(createCartLineId({ venueId: 'v1', productId: 'p1' }));
  });
});
