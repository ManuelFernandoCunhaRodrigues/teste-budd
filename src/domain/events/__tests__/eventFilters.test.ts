import type { Event } from '@/types/domain';

import {
  canApplyFilter,
  distanceKm,
  EVENT_FILTER_OPTIONS,
  filterEvents,
  isFree,
  isOnWeekend,
  isToday,
  NEARBY_RADIUS_KM,
} from '../eventFilters';

/** A Monday, so weekday/weekend cases are unambiguous. */
const MONDAY = new Date(2026, 6, 27, 12, 0);

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: 'e1',
    name: 'Evento',
    startsAt: new Date(2026, 6, 27, 20, 0).toISOString(),
    endsAt: new Date(2026, 6, 27, 23, 0).toISOString(),
    priceFromInCents: 5_000,
    date: '27 jul • 20:00',
    time: '20:00 - 23:00',
    location: 'Centro',
    price: 'A partir de R$ 50,00',
    about: '',
    image: 'forest',
    coordinate: { latitude: -2.53, longitude: -44.3 },
    ...overrides,
  };
}

describe('isFree', () => {
  it('decides on the amount, not the wording', () => {
    // The old service regexed the display copy, so renaming it broke the filter.
    expect(isFree(event({ priceFromInCents: 0, price: 'A partir de R$ 50' }))).toBe(true);
    expect(isFree(event({ priceFromInCents: 5_000, price: 'Entrada gratuita' }))).toBe(false);
  });
});

describe('isToday', () => {
  it('matches an event starting today', () => {
    expect(isToday(event(), MONDAY)).toBe(true);
  });

  it('excludes an event on another day', () => {
    expect(
      isToday(
        event({
          startsAt: new Date(2026, 6, 29, 20, 0).toISOString(),
          endsAt: new Date(2026, 6, 29, 23, 0).toISOString(),
        }),
        MONDAY,
      ),
    ).toBe(false);
  });

  it('still matches an event that started yesterday and is running past midnight', () => {
    const lateNight = new Date(2026, 6, 27, 1, 0);

    expect(
      isToday(
        event({
          startsAt: new Date(2026, 6, 26, 22, 0).toISOString(),
          endsAt: new Date(2026, 6, 27, 4, 0).toISOString(),
        }),
        lateNight,
      ),
    ).toBe(true);
  });

  it('returns false for an unparseable date instead of throwing', () => {
    expect(isToday(event({ startsAt: 'not a date', endsAt: 'also not' }), MONDAY)).toBe(false);
  });
});

describe('isOnWeekend', () => {
  it('matches Saturday and Sunday', () => {
    expect(isOnWeekend(event({ startsAt: new Date(2026, 7, 1, 20, 0).toISOString() }))).toBe(true);
    expect(isOnWeekend(event({ startsAt: new Date(2026, 7, 2, 20, 0).toISOString() }))).toBe(true);
  });

  it('excludes weekdays, including Friday', () => {
    expect(isOnWeekend(event({ startsAt: new Date(2026, 6, 31, 22, 0).toISOString() }))).toBe(false);
    expect(isOnWeekend(event({ startsAt: new Date(2026, 6, 29, 20, 0).toISOString() }))).toBe(false);
  });

  it('handles an invalid date', () => {
    expect(isOnWeekend(event({ startsAt: '' }))).toBe(false);
  });
});

describe('distanceKm', () => {
  it('is zero for the same point', () => {
    const point = { latitude: -2.53, longitude: -44.3 };
    expect(distanceKm(point, point)).toBeCloseTo(0, 5);
  });

  it('approximates a known separation', () => {
    // One degree of latitude is ~111 km.
    const distance = distanceKm(
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 0 },
    );
    expect(distance).toBeGreaterThan(110);
    expect(distance).toBeLessThan(112);
  });
});

describe('filterEvents', () => {
  const free = event({ id: 'free', priceFromInCents: 0 });
  const paid = event({ id: 'paid', priceFromInCents: 5_000 });

  it('"all" returns everything', () => {
    expect(filterEvents([free, paid], ['all'])).toHaveLength(2);
  });

  it('"free" returns only zero-priced events', () => {
    const result = filterEvents([free, paid], ['free']);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('free');
  });

  it('does not mutate the input', () => {
    const input = [free, paid];
    filterEvents(input, ['free']);
    expect(input).toHaveLength(2);
  });

  it('returns a new array even for "all"', () => {
    const input = [free, paid];
    expect(filterEvents(input, ['all'])).not.toBe(input);
  });

  it('excludes far events under "nearby"', () => {
    const near = event({ id: 'near', coordinate: { latitude: -2.53, longitude: -44.3 } });
    // Roughly 500 km away.
    const far = event({ id: 'far', coordinate: { latitude: -7.0, longitude: -44.3 } });

    const result = filterEvents([near, far], ['nearby'], {
      userCoordinate: { latitude: -2.53, longitude: -44.3 },
    });

    expect(result.map((item) => item.id)).toEqual(['near']);
  });

  it('returns nothing for "nearby" without a fix, rather than everything', () => {
    // Silently returning the unfiltered list would be a wrong answer presented
    // as a filtered one.
    expect(filterEvents([free, paid], ['nearby'], { userCoordinate: null })).toHaveLength(0);
  });

  it('excludes an event with no coordinate under "nearby"', () => {
    const noCoords = event({ id: 'no-coords', coordinate: undefined });

    expect(
      filterEvents([noCoords], ['nearby'], {
        userCoordinate: { latitude: -2.53, longitude: -44.3 },
      }),
    ).toHaveLength(0);
  });

  it('combines different filters with AND', () => {
    const freeToday = event({
      id: 'free-today',
      priceFromInCents: 0,
      startsAt: new Date(2026, 6, 27, 20, 0).toISOString(),
      endsAt: new Date(2026, 6, 27, 23, 0).toISOString(),
    });
    const freeAnotherDay = event({
      id: 'free-later',
      priceFromInCents: 0,
      startsAt: new Date(2026, 6, 30, 20, 0).toISOString(),
      endsAt: new Date(2026, 6, 30, 23, 0).toISOString(),
    });

    const result = filterEvents([freeToday, freeAnotherDay, paid], ['free', 'today'], {
      now: MONDAY,
    });

    expect(result.map((item) => item.id)).toEqual(['free-today']);
  });
});

describe('canApplyFilter', () => {
  it('only "nearby" depends on a location fix', () => {
    expect(canApplyFilter('all', {})).toBe(true);
    expect(canApplyFilter('free', {})).toBe(true);
    expect(canApplyFilter('today', {})).toBe(true);
    expect(canApplyFilter('weekend', {})).toBe(true);

    expect(canApplyFilter('nearby', { userCoordinate: null })).toBe(false);
    expect(
      canApplyFilter('nearby', { userCoordinate: { latitude: -2.5, longitude: -44.3 } }),
    ).toBe(true);
  });
});

describe('filter options', () => {
  it('every visible chip maps to a real filter', () => {
    // Guards against a decorative chip: each option id must be one the engine
    // actually implements.
    const events = [event({ priceFromInCents: 0 }), event({ id: 'e2' })];

    for (const option of EVENT_FILTER_OPTIONS) {
      expect(() =>
        filterEvents(events, [option.id], {
          now: MONDAY,
          userCoordinate: { latitude: -2.53, longitude: -44.3 },
        }),
      ).not.toThrow();
    }
  });

  it('declares the location dependency on the chip that has one', () => {
    const nearby = EVENT_FILTER_OPTIONS.find((option) => option.id === 'nearby');
    expect(nearby?.requires).toBe('location');
  });

  it('uses a sane radius', () => {
    expect(NEARBY_RADIUS_KM).toBeGreaterThan(0);
  });
});
