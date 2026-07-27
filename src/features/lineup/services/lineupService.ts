import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

import { isValidCoordinate } from '@/services/location/locationService';
import type { Coordinate } from '@/types/domain';

import { LINEUP_ARTISTS, LINEUP_CITIES, LINEUP_SHOWS } from './lineupData';
import type {
  CityOption,
  DateFilter,
  LineUpArtist,
  LineUpFilters,
  LineUpShow,
  PriceFilter,
  ShowWithDistance,
} from '../types';

export const DEFAULT_LINEUP_FILTERS: LineUpFilters = {
  radiusKm: 10,
  genre: 'Todos',
  date: 'all',
  price: 'all',
  onlyAvailable: false,
  accessibility: false,
  ageRating: 'Todos',
  eventType: 'Todos',
};

export function fetchLineUpArtists(): Promise<LineUpArtist[]> {
  return delay(LINEUP_ARTISTS);
}

export function fetchLineUpShows(): Promise<LineUpShow[]> {
  return delay(LINEUP_SHOWS);
}

export function findLineUpArtist(id: string): LineUpArtist | null {
  return LINEUP_ARTISTS.find((artist) => artist.id === id) ?? null;
}

export function showsForArtist(artistId: string): LineUpShow[] {
  return LINEUP_SHOWS
    .filter((show) => show.artistId === artistId)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export function artistForShow(show: LineUpShow): LineUpArtist | null {
  return findLineUpArtist(show.artistId);
}

export function cityLabel(city: CityOption): string {
  return `${city.name}, ${city.state}`;
}

export function searchCities(query: string): CityOption[] {
  const needle = normalizeText(query);
  if (!needle) return LINEUP_CITIES;

  return LINEUP_CITIES.filter((city) => normalizeText(cityLabel(city)).includes(needle));
}

export function searchArtists(query: string, artists = LINEUP_ARTISTS, shows = LINEUP_SHOWS): LineUpArtist[] {
  const needle = normalizeText(query);
  if (!needle) return artists;

  return artists.filter((artist) => {
    const artistShows = shows.filter((show) => show.artistId === artist.id);
    const haystack = [
      artist.name,
      artist.shortName,
      artist.genre,
      ...artist.genres,
      ...artistShows.flatMap((show) => [
        show.title,
        show.venue.name,
        show.venue.city,
        show.description,
        ...show.genres,
      ]),
    ]
      .map(normalizeText)
      .join(' ');

    return haystack.includes(needle);
  });
}

export function filterShows(
  shows: LineUpShow[],
  query: string,
  filters: LineUpFilters,
): LineUpShow[] {
  const needle = normalizeText(query);

  return shows
    .filter((show) => {
      if (needle && !showMatchesQuery(show, needle)) return false;
      if (filters.genre !== 'Todos' && !show.genres.some((genre) => normalizeText(genre) === normalizeText(filters.genre))) {
        return false;
      }
      if (filters.onlyAvailable && show.ticketStatus !== 'available' && show.ticketStatus !== 'last_tickets') {
        return false;
      }
      if (filters.accessibility && !show.accessibilityInfo) return false;
      if (filters.ageRating !== 'Todos' && show.ageRating !== filters.ageRating) return false;
      if (filters.eventType !== 'Todos' && show.eventType !== filters.eventType) return false;
      if (!matchesPrice(show.minimumPriceInCents, filters.price)) return false;
      if (!matchesDate(show.startsAt, filters.date)) return false;
      return true;
    })
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export function withDistances(
  shows: LineUpShow[],
  origin: Coordinate | null,
): ShowWithDistance[] {
  return shows.map((show) => {
    const distanceInMeters =
      origin && isValidCoordinate(origin) && isValidCoordinate(show.venue.coordinate)
        ? distanceBetween(origin, show.venue.coordinate)
        : null;

    return {
      show,
      distanceInMeters,
      distanceLabel: distanceInMeters === null ? null : formatDistance(distanceInMeters),
    };
  });
}

export function nearbyShows(
  shows: LineUpShow[],
  origin: Coordinate | null,
  radiusKm: number,
): ShowWithDistance[] {
  return withDistances(shows, origin)
    .filter((entry) => entry.distanceInMeters === null || entry.distanceInMeters <= radiusKm * 1000)
    .sort((a, b) => {
      const left = a.distanceInMeters ?? Number.POSITIVE_INFINITY;
      const right = b.distanceInMeters ?? Number.POSITIVE_INFINITY;
      if (left !== right) return left - right;
      return Date.parse(a.show.startsAt) - Date.parse(b.show.startsAt);
    });
}

/**
 * Formats a full ISO timestamp as "16 de ago., 22:00".
 *
 * Returns an empty string for anything it cannot parse instead of throwing.
 * `Intl.DateTimeFormat` raises `RangeError` on an invalid date, which takes the
 * whole screen down — and the value reaching here is data, not a constant. This
 * crashed the artist screen when a `HH:mm` string was passed by mistake.
 */
export function formatShowDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function ticketStatusLabel(status: LineUpShow['ticketStatus']): string {
  switch (status) {
    case 'available':
      return 'Disponível';
    case 'last_tickets':
      return 'Últimos ingressos';
    case 'sold_out':
      return 'Ingressos esgotados';
    case 'cancelled':
      return 'Evento cancelado';
  }
}

export function canStartTicketFlow(show: LineUpShow): boolean {
  return show.ticketStatus === 'available' || show.ticketStatus === 'last_tickets';
}

export function buildDirectionsUrl(show: LineUpShow): string | null {
  const label = `${show.venue.name}, ${show.venue.address}, ${show.venue.city} ${show.venue.state}`;
  const query = encodeURIComponent(label);

  if (isValidCoordinate(show.venue.coordinate)) {
    const { latitude, longitude } = show.venue.coordinate;
    if (Platform.OS === 'ios') return `maps://?q=${query}&ll=${latitude},${longitude}`;
    return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${query})`;
  }

  if (!label.trim()) return null;
  if (Platform.OS === 'ios') return `maps://?q=${query}`;
  return `geo:0,0?q=${query}`;
}

export async function openDirections(show: LineUpShow): Promise<boolean> {
  const url = buildDirectionsUrl(show);
  if (!url) return false;

  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
    return true;
  }

  const fallback = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${show.venue.name} ${show.venue.address} ${show.venue.city} ${show.venue.state}`,
  )}`;
  await Linking.openURL(fallback);
  return true;
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function showMatchesQuery(show: LineUpShow, needle: string): boolean {
  const artist = artistForShow(show);
  const fields = [
    show.title,
    show.description,
    show.venue.name,
    show.venue.address,
    show.venue.city,
    show.venue.neighborhood ?? '',
    ...(artist ? [artist.name, artist.genre, ...artist.genres] : []),
    ...show.genres,
  ];

  return fields.map(normalizeText).join(' ').includes(needle);
}

function matchesPrice(price: number | undefined, filter: PriceFilter): boolean {
  const amount = price ?? 0;
  switch (filter) {
    case 'all':
      return true;
    case 'free':
      return amount === 0;
    case 'under50':
      return amount > 0 && amount <= 5000;
    case 'between50and100':
      return amount > 5000 && amount <= 10000;
    case 'over100':
      return amount > 10000;
  }
}

function matchesDate(iso: string, filter: DateFilter): boolean {
  if (filter === 'all') return true;

  const event = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  const diffDays = Math.round((event.getTime() - today.getTime()) / 86_400_000);

  switch (filter) {
    case 'today':
      return diffDays === 0;
    case 'tomorrow':
      return diffDays === 1;
    case 'weekend':
      return event.getDay() === 0 || event.getDay() === 6;
    case 'next7':
      return diffDays >= 0 && diffDays <= 7;
  }
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function distanceBetween(a: Coordinate, b: Coordinate): number {
  const radiusMeters = 6371000;
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);

  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * radiusMeters * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function formatDistance(distanceInMeters: number): string {
  if (distanceInMeters < 1000) return `${Math.round(distanceInMeters)} m de você`;
  const kilometers = distanceInMeters / 1000;
  const maximumFractionDigits = kilometers >= 10 ? 0 : 1;
  return `${kilometers.toLocaleString('pt-BR', { maximumFractionDigits })} km de você`;
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), 120);
  });
}
