import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { VenueSummary } from '@/domain/cart/cartTypes';

/**
 * Which venue the catalogue on screen belongs to.
 *
 * Product cards sit several layers below the screen that knows the venue
 * (`FeaturedGrid`, `MenuSectionList`, then each row), so the context carries it
 * down instead of threading a prop through components that have no other use for
 * it. The screen supplies the value — the cart store never looks a venue up by
 * id, which is what §13 rules out.
 */
const VenueContext = createContext<VenueSummary | null>(null);

export interface CatalogVenueProviderProps {
  venue: VenueSummary;
  children: ReactNode;
}

export function CatalogVenueProvider({ venue, children }: CatalogVenueProviderProps) {
  // Memoised on the identity fields so consumers do not re-render when the
  // parent re-creates the object literal.
  const value = useMemo<VenueSummary>(() => ({ id: venue.id, name: venue.name }), [venue.id, venue.name]);

  return <VenueContext.Provider value={value}>{children}</VenueContext.Provider>;
}

/**
 * The venue selling the products in this subtree.
 *
 * Throws when missing: a product card that cannot name its venue must not
 * silently add an unattributable item to the cart.
 */
export function useCatalogVenue(): VenueSummary {
  const venue = useContext(VenueContext);

  if (!venue) {
    throw new Error(
      'useCatalogVenue: no venue in context. Wrap the catalogue in <CatalogVenueProvider>.',
    );
  }

  return venue;
}

/** Non-throwing variant, for components that merely want to know. */
export function useOptionalCatalogVenue(): VenueSummary | null {
  return useContext(VenueContext);
}
