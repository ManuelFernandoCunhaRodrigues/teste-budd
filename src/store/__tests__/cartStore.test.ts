import { BARS, findVenueProduct } from '@/mocks/bars';
import type { Product } from '@/types/domain';

import { selectCartCount, selectCartSubtotalInCents, useCartStore } from '../cartStore';

const BAR_A = { id: BARS[0].id, name: BARS[0].name };
const BAR_B = { id: BARS[1].id, name: BARS[1].name };

/** The same catalogue item as sold by a given venue. */
function chopp(venueId: string): Product {
  const product = findVenueProduct(venueId, 'chopp-artesanal-500');
  if (!product) throw new Error(`fixture missing: chopp at ${venueId}`);
  return product;
}

beforeEach(() => {
  useCartStore.getState().clear();
});

describe('adding items', () => {
  it('the first product sets the venue', () => {
    useCartStore.getState().addProduct({ venue: BAR_A, product: chopp(BAR_A.id) });

    expect(useCartStore.getState().venue).toEqual(BAR_A);
    expect(selectCartCount(useCartStore.getState())).toBe(1);
  });

  it('accepts another item from the same venue', () => {
    const state = useCartStore.getState();
    state.addProduct({ venue: BAR_A, product: chopp(BAR_A.id) });

    const gin = findVenueProduct(BAR_A.id, 'gin-tonica');
    expect(gin).toBeDefined();
    const result = useCartStore.getState().addProduct({ venue: BAR_A, product: gin as Product });

    expect(result).toBe('added');
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('merges a repeat of the same offer into one line', () => {
    useCartStore.getState().addProduct({ venue: BAR_A, product: chopp(BAR_A.id) });
    useCartStore.getState().addProduct({ venue: BAR_A, product: chopp(BAR_A.id) });

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });
});

describe('multi-venue policy', () => {
  it('does not merge a product from another venue', () => {
    useCartStore.getState().addProduct({ venue: BAR_A, product: chopp(BAR_A.id) });
    const result = useCartStore.getState().addProduct({ venue: BAR_B, product: chopp(BAR_B.id) });

    expect(result).toBe('needs_confirmation');
    // Nothing changed yet — the cart is untouched until the user decides.
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().venue).toEqual(BAR_A);
    expect(useCartStore.getState().pendingSwitch).not.toBeNull();
  });

  it('a chopp from two bars never becomes a single line', () => {
    useCartStore.getState().addProduct({ venue: BAR_A, product: chopp(BAR_A.id) });
    useCartStore.getState().addProduct({ venue: BAR_B, product: chopp(BAR_B.id) });
    useCartStore.getState().confirmVenueSwitch();

    const { items, venue } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(venue).toEqual(BAR_B);
    expect(items[0].venueId).toBe(BAR_B.id);
  });

  it('cancelling preserves the current cart', () => {
    useCartStore.getState().addProduct({ venue: BAR_A, product: chopp(BAR_A.id) });
    useCartStore.getState().addProduct({ venue: BAR_B, product: chopp(BAR_B.id) });
    useCartStore.getState().cancelVenueSwitch();

    const { items, venue, pendingSwitch } = useCartStore.getState();
    expect(pendingSwitch).toBeNull();
    expect(venue).toEqual(BAR_A);
    expect(items).toHaveLength(1);
    expect(items[0].venueId).toBe(BAR_A.id);
  });

  it('confirming replaces the cart with the parked item', () => {
    useCartStore.getState().addProduct({ venue: BAR_A, product: chopp(BAR_A.id) });
    useCartStore.getState().addProduct({ venue: BAR_A, product: chopp(BAR_A.id) });
    useCartStore.getState().addProduct({ venue: BAR_B, product: chopp(BAR_B.id) });
    useCartStore.getState().confirmVenueSwitch();

    expect(selectCartCount(useCartStore.getState())).toBe(1);
    expect(useCartStore.getState().pendingSwitch).toBeNull();
  });

  it('prices differ per venue, so the subtotal follows the venue', () => {
    useCartStore.getState().addProduct({ venue: BAR_A, product: chopp(BAR_A.id) });
    const atA = selectCartSubtotalInCents(useCartStore.getState());

    useCartStore.getState().clear();
    useCartStore.getState().addProduct({ venue: BAR_B, product: chopp(BAR_B.id) });
    const atB = selectCartSubtotalInCents(useCartStore.getState());

    expect(atA).not.toBe(atB);
  });
});

describe('removing items', () => {
  it('emptying the cart releases the venue', () => {
    useCartStore.getState().addProduct({ venue: BAR_A, product: chopp(BAR_A.id) });
    const { lineId } = useCartStore.getState().items[0];

    useCartStore.getState().removeLine(lineId);

    expect(useCartStore.getState().items).toHaveLength(0);
    // With no venue held, the next add is free to pick any bar without a prompt.
    expect(useCartStore.getState().venue).toBeNull();
  });

  it('decrementing the last unit releases the venue', () => {
    useCartStore.getState().addProduct({ venue: BAR_A, product: chopp(BAR_A.id) });
    const { lineId } = useCartStore.getState().items[0];

    useCartStore.getState().decrementLine(lineId);

    expect(useCartStore.getState().venue).toBeNull();
  });

  it('after emptying, a different venue is accepted without confirmation', () => {
    useCartStore.getState().addProduct({ venue: BAR_A, product: chopp(BAR_A.id) });
    useCartStore.getState().removeLine(useCartStore.getState().items[0].lineId);

    const result = useCartStore.getState().addProduct({ venue: BAR_B, product: chopp(BAR_B.id) });

    expect(result).toBe('added');
    expect(useCartStore.getState().venue).toEqual(BAR_B);
  });
});

describe('catalogue integrity', () => {
  it('each venue owns its own product instances', () => {
    // The old mocks spread one shared object into every bar, so a mutation in
    // one venue's menu was visible in all of them.
    expect(BARS[0].featured[0]).not.toBe(BARS[1].featured[0]);
  });

  it('every product carries its venue', () => {
    for (const bar of BARS) {
      for (const product of bar.featured) {
        expect(product.venueId).toBe(bar.id);
      }
      for (const section of bar.sections) {
        for (const product of section.items) {
          expect(product.venueId).toBe(bar.id);
        }
      }
    }
  });

  it('prices are integer cents', () => {
    for (const bar of BARS) {
      for (const product of bar.featured) {
        expect(Number.isInteger(product.priceInCents)).toBe(true);
      }
    }
  });
});
