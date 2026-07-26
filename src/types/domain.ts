import type { GradientToken } from '@/theme/gradients';
import type { MoneyInCents } from '@/utils/money';

/**
 * A purchasable item on a venue's menu.
 *
 * `venueId` is part of the identity, not decoration: the same drink sold by two
 * bars is two different offers at two different prices, and a product without
 * its origin cannot be turned into an order line. Prices are integer cents;
 * formatting to BRL happens in the UI.
 */
export interface Product {
  id: string;
  /** The venue selling this item. */
  venueId: string;
  name: string;
  description?: string;
  priceInCents: MoneyInCents;
  /** Struck-through original price when discounted. */
  oldPriceInCents?: MoneyInCents;
  /** Discount pill, e.g. `"-15%"`. */
  discount?: string;
  /** Promotional note shown in green. */
  promo?: string;
  /** Corner badge on the product image, e.g. `"Mais pedido"`. */
  tag?: string;
  image: GradientToken;
}

/** A titled group of products, e.g. "Cervejas". */
export interface MenuSection {
  id: string;
  title: string;
  items: Product[];
}

/** A discount voucher offered by a venue. */
export interface Coupon {
  id: string;
  /** Face value, e.g. `"R$ 19"`. */
  value: string;
  /** Minimum spend required, e.g. `"R$ 29"`. */
  minimum: string;
}

/** Geographic point. */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/** A bar / venue. */
export interface Bar {
  id: string;
  name: string;
  /** e.g. `"Boteco • Petiscos"`. */
  category: string;
  /** Human-readable address line. */
  location: string;
  rating: string;
  /** Distance from the user, e.g. `"2.4 km"`. */
  distance: string;
  image: GradientToken;
  /** Monogram shown in the detail screen's circular badge. */
  initial: string;
  reviewsCount: number;
  minOrder: string;
  /** Preparation estimate, e.g. `"40-50 min"`. */
  eta: string;
  /** Menu chips are derived from `sections` via `buildMenuCategories`. */
  serviceFee: string;
  /** Machine-readable counterparts of `minOrder` / `serviceFee`. */
  minOrderInCents: MoneyInCents;
  serviceFeeInCents: MoneyInCents;
  coordinate: Coordinate;
  coupons: Coupon[];
  featured: Product[];
  sections: MenuSection[];
  /** Events hosted at this venue. */
  eventIds: string[];
}

/**
 * A ticketed event.
 *
 * `startsAt` / `endsAt` / `priceFromInCents` are the machine-readable truth that
 * filtering runs on. `date`, `time` and `price` are display copy derived from
 * them — filtering on those strings (as "Gratuitos" used to, by regex) breaks the
 * moment the wording changes.
 */
export interface Event {
  id: string;
  name: string;
  /** ISO 8601 with offset, e.g. `"2026-07-26T15:00:00-03:00"`. */
  startsAt: string;
  /** ISO 8601 with offset. May fall on the following day. */
  endsAt: string;
  /** Cheapest ticket. `0` means free entry. */
  priceFromInCents: MoneyInCents;
  /** e.g. `"23 mai • 15:00"`. Derived from `startsAt`. */
  date: string;
  /** e.g. `"15:00 - 23:50"`. Derived from `startsAt`/`endsAt`. */
  time: string;
  location: string;
  /** e.g. `"A partir de R$ 50"` or `"Entrada gratuita"`. Derived from price. */
  price: string;
  about: string;
  image: GradientToken;
  coordinate?: Coordinate;
}

/** A line-up artist. */
export interface Artist {
  id: string;
  name: string;
  /** Abbreviated name for the avatar rail. */
  shortName: string;
  albums: number;
  /** Follower count in thousands, as shown in the design. */
  followers: number;
}

/** A pin on the map with its bottom-sheet card. */
export interface Place {
  id: string;
  name: string;
  address: string;
  hours: string;
  image: GradientToken;
  coordinate: Coordinate;
  /** What tapping the card opens. */
  target: { type: 'bar'; id: string } | { type: 'event'; id: string };
}

/** A user-visible review on a venue. */
export interface Review {
  id: string;
  author: string;
  initial: string;
  /** Relative date label, e.g. `"há 2 dias"`. */
  date: string;
  stars: number;
  text: string;
}

/** A personalised suggestion on the recommendations screen. */
export interface Recommendation {
  id: string;
  kind: 'Bar' | 'Evento' | 'Produto';
  name: string;
  /** Why this was suggested. */
  reason: string;
  image: GradientToken;
  target: { type: 'bars' } | { type: 'events' };
}
