import { BARS } from '@/mocks/bars';

import {
  answerFor,
  normalizeQuery,
  parseDistanceKm,
  QUICK_SUGGESTIONS,
  resolveIntent,
} from '../assistantEngine';

/**
 * The simulated assistant.
 *
 * Two things have to hold for the demo to be honest: every phrase resolves to
 * an intent the app can answer, and every card names something that actually
 * exists in the data. A reply about a venue the user cannot open is worse than
 * no reply.
 */

describe('normalizeQuery', () => {
  it('makes accented and unaccented spellings the same query', () => {
    expect(normalizeQuery('PROMOÇÕES')).toBe('promocoes');
    expect(normalizeQuery('promoções')).toBe(normalizeQuery('promocoes'));
    expect(normalizeQuery('  Música ao Vivo  ')).toBe('musica ao vivo');
  });
});

describe('parseDistanceKm', () => {
  it('reads the display spelling the domain stores', () => {
    expect(parseDistanceKm('2.4 km')).toBe(2.4);
    expect(parseDistanceKm('900 m')).toBe(0.9);
    expect(parseDistanceKm('3,1 km')).toBe(3.1);
  });

  it('sorts an unreadable distance last rather than treating it as zero', () => {
    // Sorting ascending, Infinity lands at the end. Returning 0 would promote a
    // venue with no known distance to "nearest".
    expect(parseDistanceKm('perto daqui')).toBe(Number.POSITIVE_INFINITY);
    expect(parseDistanceKm('')).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('resolveIntent', () => {
  it.each([
    ['Quero um bar com música ao vivo hoje', 'live-music'],
    ['Me mostra eventos perto de mim', 'events-today'],
    ['Quero ver promoções de drinks', 'promotions'],
    ['Quero um lugar bom pra ir com amigos', 'group'],
    ['Sugestões para casal', 'date'],
    ['Lugares mais bem avaliados', 'top-rated'],
    ['Produtos em destaque', 'featured-products'],
    ['Encontrar bares perto de mim', 'bars-nearby'],
  ])('reads %j as %s', (query, expected) => {
    expect(resolveIntent(query)).toBe(expected);
  });

  it('prefers the more informative reading when a phrase matches twice', () => {
    // Both mention proximity; neither is a question about nearby bars.
    expect(resolveIntent('eventos perto de mim')).toBe('events-today');
    // Mentions drinks, but the question is about the discount.
    expect(resolveIntent('promoções de drinks')).toBe('promotions');
  });

  it('falls back instead of guessing', () => {
    expect(resolveIntent('qual a capital da França')).toBe('fallback');
    expect(resolveIntent('   ')).toBe('fallback');
  });
});

describe('answerFor', () => {
  it('always replies, and offers a way forward when it did not understand', () => {
    const answer = answerFor('asdfgh');

    expect(answer.intent).toBe('fallback');
    expect(answer.reply).not.toHaveLength(0);
    expect(answer.results).toHaveLength(0);
    // A dead end would strand the user in a chat with nothing to tap.
    expect(answer.followUps.length).toBeGreaterThan(0);
  });

  it('orders nearby bars by real distance, not by mock order', () => {
    const answer = answerFor('Encontrar bares perto de mim');
    const distances = answer.results.map((result) =>
      result.kind === 'bar' ? parseDistanceKm(result.bar.distance) : Number.NaN,
    );

    expect(distances.length).toBeGreaterThan(0);
    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
  });

  it('orders top-rated by rating', () => {
    const answer = answerFor('Lugares mais bem avaliados');
    const ratings = answer.results.map((result) =>
      result.kind === 'bar' ? result.bar.rating : Number.NaN,
    );

    expect([...ratings].sort((a, b) => b - a)).toEqual(ratings);
  });

  it('only offers products that carry a real discount', () => {
    const answer = answerFor('Descobrir promoções');

    expect(answer.results.length).toBeGreaterThan(0);
    for (const result of answer.results) {
      expect(result.kind).toBe('product');
      if (result.kind !== 'product') continue;
      expect(result.product.discount ?? result.product.promoNote).toBeTruthy();
    }
  });

  it('names a venue that exists for every product it suggests', () => {
    const answer = answerFor('Produtos em destaque');
    const ids = new Set(BARS.map((bar) => bar.id));

    for (const result of answer.results) {
      if (result.kind !== 'product') continue;
      expect(ids.has(result.venueId)).toBe(true);
      expect(result.venueName).not.toHaveLength(0);
    }
  });

  it('never floods the conversation with cards', () => {
    for (const suggestion of QUICK_SUGGESTIONS) {
      expect(answerFor(suggestion.query).results.length).toBeLessThanOrEqual(3);
    }
  });

  it('answers every starter chip with the intent it advertises', () => {
    // A chip that resolves elsewhere would be a button that lies about itself.
    for (const suggestion of QUICK_SUGGESTIONS) {
      expect(answerFor(suggestion.query).intent).toBe(suggestion.id);
    }
  });
});
