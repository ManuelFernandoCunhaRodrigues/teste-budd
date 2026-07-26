import { useCallback, useMemo } from 'react';

import { createCartLineId } from '@/domain/cart/cartTypes';
import { selectQuantityOfProduct, useCartStore } from '@/store/cartStore';
import type { Product } from '@/types/domain';

import { useCatalogVenue } from '../context/VenueContext';

export interface ProductQuantityControls {
  quantity: number;
  /** True while the item is not in the cart — swaps the stepper for "Adicionar". */
  showAddButton: boolean;
  increment: () => void;
  decrement: () => void;
}

/**
 * Binds one product, at one venue, to the cart store.
 *
 * Quantity is scoped by venue: the same drink sold by two bars is two different
 * offers, so the stepper on Bar A's menu must not reflect an item added at Bar B.
 * That scoping is the C-03 fix — previously the lookup was by product id alone.
 *
 * Adding an item from a different venue than the cart's does not merge and does
 * not clear anything: the store parks the request and the confirmation dialog
 * mounted in the private layout asks the user what to do.
 */
export function useProductQuantity(product: Product): ProductQuantityControls {
  const venue = useCatalogVenue();

  const quantity = useCartStore(useMemo(() => selectQuantityOfProduct(venue.id, product.id), [venue.id, product.id]));
  const addProduct = useCartStore((state) => state.addProduct);
  const decrementLine = useCartStore((state) => state.decrementLine);

  // No variants or add-ons in the current design, so the line identity is just
  // venue + product. Passing through `createCartLineId` keeps the key derivation
  // in one place for when options arrive.
  const lineId = useMemo(
    () => createCartLineId({ venueId: venue.id, productId: product.id }),
    [venue.id, product.id],
  );

  const increment = useCallback(() => {
    addProduct({ venue, product });
  }, [addProduct, venue, product]);

  const decrement = useCallback(() => decrementLine(lineId), [decrementLine, lineId]);

  return { quantity, showAddButton: quantity === 0, increment, decrement };
}
