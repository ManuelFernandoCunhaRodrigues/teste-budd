import { BARS } from '@/mocks/bars';

const featured = BARS[0].featured;
const sections = BARS[0].sections;

describe('product offer semantics', () => {
  it('represents monetary promotions as current price plus previous price', () => {
    const discounted = featured.filter((product) => product.oldPriceInCents !== undefined);

    expect(discounted.length).toBeGreaterThan(0);
    for (const product of discounted) {
      expect(product.oldPriceInCents).toBeGreaterThan(product.priceInCents);
      expect(product.discount).toMatch(/^-/);
    }
  });

  it('keeps promo notes textual, not monetary prices', () => {
    const products = [...featured, ...sections.flatMap((section) => section.items)];
    const notes = products.flatMap((product) => product.promoNote ?? []);

    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every((note) => !/^R\$\s*\d/.test(note))).toBe(true);
  });
});
