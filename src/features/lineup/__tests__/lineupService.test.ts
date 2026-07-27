import { LINEUP_ARTISTS, LINEUP_CITIES, LINEUP_SHOWS } from '../services/lineupData';
import {
  DEFAULT_LINEUP_FILTERS,
  buildDirectionsUrl,
  canStartTicketFlow,
  filterShows,
  nearbyShows,
  normalizeText,
  searchArtists,
  showsForArtist,
  ticketStatusLabel,
  withDistances,
} from '../services/lineupService';
import type { LineUpShow } from '../types';

/**
 * The LineUp domain.
 *
 * This is where a wrong answer is invisible: a search that silently drops an
 * artist, a radius that keeps a venue it should exclude, or a distance computed
 * against the wrong origin all render as a plausible screen. The feature had no
 * coverage at all before this file.
 */

const SAO_LUIS = LINEUP_CITIES.find((city) => city.id === 'sao-luis');
const withCoordinate = LINEUP_SHOWS.find((show) => show.venue.coordinate);

describe('normalizeText', () => {
  it('folds case and accents so both spellings reach the same match', () => {
    expect(normalizeText('CECÍLIA')).toBe('cecilia');
    expect(normalizeText('  Forró  ')).toBe('forro');
    expect(normalizeText('Eletrônica')).toBe(normalizeText('eletronica'));
  });
});

describe('searchArtists', () => {
  it('returns everyone when the query is empty', () => {
    expect(searchArtists('')).toHaveLength(LINEUP_ARTISTS.length);
    expect(searchArtists('   ')).toHaveLength(LINEUP_ARTISTS.length);
  });

  it('finds an artist by full name', () => {
    const target = LINEUP_ARTISTS[0];
    expect(searchArtists(target.name).map((artist) => artist.id)).toContain(target.id);
  });

  it('finds an artist by part of the name', () => {
    expect(searchArtists('jorge').map((artist) => artist.id)).toContain('jorge-mateus');
  });

  it('ignores accents in both directions', () => {
    // The catalogue spells her "Cecília"; a phone keyboard often will not.
    expect(searchArtists('cecilia').map((artist) => artist.id)).toContain('cecilia-leite');
    expect(searchArtists('CECÍLIA').map((artist) => artist.id)).toContain('cecilia-leite');
    expect(searchArtists('forro').map((artist) => artist.id)).toContain('aguila');
  });

  it('reaches an artist through the venue their show plays', () => {
    const show = LINEUP_SHOWS[0];
    expect(searchArtists(show.venue.name).map((artist) => artist.id)).toContain(show.artistId);
  });

  it('returns nothing for a query that matches no one', () => {
    expect(searchArtists('zzzz-nao-existe')).toHaveLength(0);
  });
});

describe('filterShows', () => {
  it('orders results by start time', () => {
    const result = filterShows(LINEUP_SHOWS, '', DEFAULT_LINEUP_FILTERS);
    const times = result.map((show) => Date.parse(show.startsAt));

    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('drops sold-out and cancelled shows when only available is on', () => {
    const result = filterShows(LINEUP_SHOWS, '', {
      ...DEFAULT_LINEUP_FILTERS,
      onlyAvailable: true,
    });

    expect(result.length).toBeGreaterThan(0);
    for (const show of result) {
      expect(['available', 'last_tickets']).toContain(show.ticketStatus);
    }
  });

  it('keeps only shows carrying the chosen genre', () => {
    const result = filterShows(LINEUP_SHOWS, '', { ...DEFAULT_LINEUP_FILTERS, genre: 'Forró' });

    expect(result.length).toBeGreaterThan(0);
    for (const show of result) {
      expect(show.genres.map(normalizeText)).toContain('forro');
    }
  });

  it('reads the free band as zero, not as "cheap"', () => {
    const result = filterShows(LINEUP_SHOWS, '', { ...DEFAULT_LINEUP_FILTERS, price: 'free' });

    for (const show of result) {
      expect(show.minimumPriceInCents ?? 0).toBe(0);
    }
  });

  it('splits the price bands without overlapping at the boundary', () => {
    const under = filterShows(LINEUP_SHOWS, '', { ...DEFAULT_LINEUP_FILTERS, price: 'under50' });
    const over = filterShows(LINEUP_SHOWS, '', { ...DEFAULT_LINEUP_FILTERS, price: 'over100' });

    for (const show of under) {
      expect(show.minimumPriceInCents ?? 0).toBeLessThanOrEqual(5000);
      expect(show.minimumPriceInCents ?? 0).toBeGreaterThan(0);
    }
    for (const show of over) {
      expect(show.minimumPriceInCents ?? 0).toBeGreaterThan(10000);
    }
  });
});

describe('withDistances', () => {
  it('reports no distance rather than inventing one without an origin', () => {
    const result = withDistances(LINEUP_SHOWS, null);

    for (const entry of result) {
      expect(entry.distanceInMeters).toBeNull();
      expect(entry.distanceLabel).toBeNull();
    }
  });

  it('formats under a kilometre in metres', () => {
    if (!withCoordinate?.venue.coordinate) throw new Error('fixture sem coordenada');

    // Origin on top of the venue: the label must not read "0 km".
    const [entry] = withDistances([withCoordinate], withCoordinate.venue.coordinate);

    expect(entry.distanceInMeters).toBeLessThan(1000);
    expect(entry.distanceLabel).toMatch(/m de você$/);
  });

  it('formats a kilometre or more in kilometres', () => {
    if (!SAO_LUIS) throw new Error('fixture sem São Luís');

    const far = { latitude: SAO_LUIS.coordinate.latitude + 0.5, longitude: SAO_LUIS.coordinate.longitude };
    const entries = withDistances(LINEUP_SHOWS.filter((show) => show.venue.coordinate), far);

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.distanceLabel).toMatch(/km de você$/);
    }
  });
});

describe('nearbyShows', () => {
  it('excludes venues beyond the radius', () => {
    if (!SAO_LUIS) throw new Error('fixture sem São Luís');

    const tight = nearbyShows(LINEUP_SHOWS, SAO_LUIS.coordinate, 1);
    const wide = nearbyShows(LINEUP_SHOWS, SAO_LUIS.coordinate, 50);

    expect(tight.length).toBeLessThanOrEqual(wide.length);
    for (const entry of tight) {
      if (entry.distanceInMeters !== null) expect(entry.distanceInMeters).toBeLessThanOrEqual(1000);
    }
  });

  it('orders by distance, and by date when two are equally far', () => {
    if (!SAO_LUIS) throw new Error('fixture sem São Luís');

    const result = nearbyShows(LINEUP_SHOWS, SAO_LUIS.coordinate, 50);
    const distances = result.map((entry) => entry.distanceInMeters ?? Number.POSITIVE_INFINITY);

    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
  });

  it('keeps a venue with no coordinates instead of hiding it', () => {
    if (!SAO_LUIS) throw new Error('fixture sem São Luís');

    const unlocated: LineUpShow = {
      ...LINEUP_SHOWS[0],
      id: 'sem-coordenada',
      venue: { ...LINEUP_SHOWS[0].venue, coordinate: undefined },
    };

    // Dropping it would make an unknown location look like "too far away".
    const result = nearbyShows([unlocated], SAO_LUIS.coordinate, 1);
    expect(result).toHaveLength(1);
    expect(result[0].distanceLabel).toBeNull();
  });
});

describe('ticket status', () => {
  it('labels every status in readable Portuguese', () => {
    expect(ticketStatusLabel('available')).toBe('Disponível');
    expect(ticketStatusLabel('last_tickets')).toBe('Últimos ingressos');
    expect(ticketStatusLabel('sold_out')).toBe('Ingressos esgotados');
    expect(ticketStatusLabel('cancelled')).toBe('Evento cancelado');
  });

  it('only opens the purchase flow while tickets can actually be sold', () => {
    const of = (status: LineUpShow['ticketStatus']): LineUpShow => ({
      ...LINEUP_SHOWS[0],
      ticketStatus: status,
    });

    expect(canStartTicketFlow(of('available'))).toBe(true);
    expect(canStartTicketFlow(of('last_tickets'))).toBe(true);
    expect(canStartTicketFlow(of('sold_out'))).toBe(false);
    expect(canStartTicketFlow(of('cancelled'))).toBe(false);
  });
});

describe('buildDirectionsUrl', () => {
  it('points at the coordinates when the venue has them', () => {
    if (!withCoordinate?.venue.coordinate) throw new Error('fixture sem coordenada');

    const url = buildDirectionsUrl(withCoordinate);
    const { latitude, longitude } = withCoordinate.venue.coordinate;

    expect(url).toContain(String(latitude));
    expect(url).toContain(String(longitude));
  });

  it('falls back to the written address when there are none', () => {
    const unlocated: LineUpShow = {
      ...LINEUP_SHOWS[0],
      venue: { ...LINEUP_SHOWS[0].venue, coordinate: undefined },
    };

    const url = buildDirectionsUrl(unlocated);

    expect(url).not.toBeNull();
    expect(url).toContain(encodeURIComponent(unlocated.venue.name));
  });
});

describe('showsForArtist', () => {
  it('returns only that artist, soonest first', () => {
    const artistId = LINEUP_SHOWS[0].artistId;
    const result = showsForArtist(artistId);

    expect(result.length).toBeGreaterThan(0);
    for (const show of result) expect(show.artistId).toBe(artistId);

    const times = result.map((show) => Date.parse(show.startsAt));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('returns nothing for an artist with no dates', () => {
    expect(showsForArtist('artista-inexistente')).toHaveLength(0);
  });
});
