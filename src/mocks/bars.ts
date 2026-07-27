import type { Bar } from '@/types/domain';
import { parseCurrencyToCents } from '@/utils/money';

import { buildFeaturedProducts, buildMenuSections, COUPONS } from './catalog';
import { VENUE_EVENT_IDS } from './events';

/**
 * Mock venues. Coordinates are approximate points for the São Luís / MA
 * neighbourhoods named in each address — placeholder data until the API
 * provides real geocoding.
 *
 * Each venue builds its own catalogue. The previous `sharedCatalog` object was
 * spread into every bar, so all four exposed the *same* product instances — the
 * root cause of C-03.
 */

type AuthoredBar = Omit<
  Bar,
  | 'coupons'
  | 'categories'
  | 'featured'
  | 'sections'
  | 'eventIds'
  | 'minOrderInCents'
  | 'serviceFeeInCents'
>;

const AUTHORED_BARS: AuthoredBar[] = [
  {
    id: 'pixzinho-dos-crias',
    name: 'Pixzinho Dos Crias HeadShop',
    category: 'HeadShop • Lounge',
    location: 'Rua Lina Figuereido, Jardins de Allah',
    rating: 4.9,
    distance: '4.9 km',
    image: 'neutral',
    initial: 'P',
    reviewsCount: 284,
    minOrder: 'R$ 20,00',
    eta: '65-75 min',
    serviceFee: 'R$ 5,00',
    coordinate: { latitude: -2.5487, longitude: -44.249 },
  },
  {
    id: 'bar-do-ze',
    name: 'Bar do Zé',
    category: 'Boteco • Petiscos',
    location: 'Av. Litorânea, Calhau',
    rating: 4.7,
    distance: '2.4 km',
    image: 'amber',
    initial: 'Z',
    reviewsCount: 156,
    minOrder: 'R$ 15,00',
    eta: '40-50 min',
    serviceFee: 'R$ 4,00',
    coordinate: { latitude: -2.4869, longitude: -44.24 },
  },
  {
    id: 'quintal-74',
    name: 'Quintal 74',
    category: 'Pub • Música ao vivo',
    location: 'Rua do Sol, Centro',
    rating: 4.8,
    distance: '3.1 km',
    image: 'blue',
    initial: 'Q',
    reviewsCount: 203,
    minOrder: 'R$ 25,00',
    eta: '50-60 min',
    serviceFee: 'R$ 6,00',
    coordinate: { latitude: -2.5297, longitude: -44.3028 },
  },
  {
    id: 'terraco-anil',
    name: 'Terraço Anil',
    category: 'Rooftop • Drinks',
    location: 'Av. Santos Dumont, Anil',
    rating: 4.6,
    distance: '6.0 km',
    image: 'plum',
    initial: 'T',
    reviewsCount: 98,
    minOrder: 'R$ 30,00',
    eta: '70-80 min',
    serviceFee: 'R$ 7,00',
    coordinate: { latitude: -2.5423, longitude: -44.2601 },
  },
];

export const BARS: Bar[] = AUTHORED_BARS.map((authored) => ({
  ...authored,
  minOrderInCents: parseCurrencyToCents(authored.minOrder),
  serviceFeeInCents: parseCurrencyToCents(authored.serviceFee),
  coupons: COUPONS,
  // Fresh instances per venue — never a shared reference.
  featured: buildFeaturedProducts(authored.id),
  sections: buildMenuSections(authored.id),
  eventIds: VENUE_EVENT_IDS,
}));

/** The venue opened when a screen needs a fallback (mirrors the prototype). */
export const DEFAULT_BAR_ID = BARS[0].id;

/** Bars pre-marked as favourites, matching the design's initial state. */
export const INITIAL_FAVORITE_IDS = ['pixzinho-dos-crias', 'quintal-74'];

/** Venue lookup used by the cart and by the dev backend's price recalculation. */
export function findBarById(venueId: string): Bar | undefined {
  return BARS.find((bar) => bar.id === venueId);
}

/**
 * Every product a venue sells, flattened.
 *
 * The dev backend uses this as its price source so totals are resolved from the
 * catalogue rather than from whatever the client sent.
 */
export function findVenueProduct(venueId: string, productId: string) {
  const bar = findBarById(venueId);
  if (!bar) return undefined;

  const all = [...bar.featured, ...bar.sections.flatMap((section) => section.items)];
  return all.find((product) => product.id === productId);
}
