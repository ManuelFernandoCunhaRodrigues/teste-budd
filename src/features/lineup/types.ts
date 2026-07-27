import type { GradientToken } from '@/theme/gradients';
import type { Coordinate } from '@/types/domain';
import type { MoneyInCents } from '@/utils/money';

export type LineUpMode = 'nearby' | 'artists';
export type TicketSaleStatus = 'available' | 'last_tickets' | 'sold_out' | 'cancelled';
export type DistanceRadiusKm = 5 | 10 | 25 | 50;
export type DateFilter = 'all' | 'today' | 'tomorrow' | 'weekend' | 'next7';
export type PriceFilter = 'all' | 'free' | 'under50' | 'between50and100' | 'over100';

export interface LineUpArtist {
  id: string;
  name: string;
  shortName: string;
  genre: string;
  genres: string[];
  image: GradientToken;
  biography: string;
  origin?: string;
  followers?: number;
  featured?: boolean;
  website?: string;
}

export interface LineUpVenue {
  id: string;
  name: string;
  address: string;
  neighborhood?: string;
  city: string;
  state: string;
  coordinate?: Coordinate;
}

export interface LineUpTicketOption {
  id: string;
  label: string;
  type: 'inteira' | 'meia' | 'vip' | 'camarote' | 'pista';
  priceInCents: MoneyInCents;
  serviceFeeInCents: MoneyInCents;
  available: number;
  maxPerUser: number;
}

export interface LineUpShow {
  id: string;
  artistId: string;
  eventId: string;
  title: string;
  description: string;
  date: string;
  startsAt: string;
  endsAt: string;
  /**
   * Local opening time as `HH:mm` — not a timestamp.
   *
   * Deliberately spelled out: passing this to `formatShowDate`, which expects a
   * full ISO string, throws `RangeError` and takes the screen down.
   */
  doorsOpenAt?: string;
  venue: LineUpVenue;
  minimumPriceInCents?: MoneyInCents;
  ticketStatus: TicketSaleStatus;
  ticketOptions: LineUpTicketOption[];
  genres: string[];
  ageRating?: string;
  parkingInfo?: string;
  accessibilityInfo?: string;
  entryRules?: string[];
  allowedItems?: string[];
  forbiddenItems?: string[];
  attractions?: string[];
  eventType?: string;
}

export interface CityOption {
  id: string;
  name: string;
  state: string;
  coordinate: Coordinate;
}

export interface LineUpFilters {
  radiusKm: DistanceRadiusKm;
  genre: string;
  date: DateFilter;
  price: PriceFilter;
  onlyAvailable: boolean;
  accessibility: boolean;
  ageRating: string;
  eventType: string;
}

export interface ShowWithDistance {
  show: LineUpShow;
  distanceInMeters: number | null;
  distanceLabel: string | null;
}
