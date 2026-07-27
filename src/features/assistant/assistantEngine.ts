import { BARS } from '@/mocks/bars';
import { EVENTS } from '@/mocks/events';
import type { Bar, Product } from '@/types/domain';

import type {
  AssistantAnswer,
  AssistantIntentId,
  AssistantResult,
  QuickSuggestion,
} from './assistantTypes';

/**
 * The simulated Budd assistant.
 *
 * Deliberately not an AI: it is a deterministic function from a phrase to
 * results already present in the app's data. That keeps the demo honest — every
 * venue, event and product it names is one the user can actually open — and
 * keeps it testable, which a model call would not be.
 *
 * Pure and free of React, in the same spirit as `carouselGeometry`: the chat
 * screen renders whatever this returns, and the matching can be asserted
 * without mounting anything.
 */

/** How many cards one answer shows before it stops being a conversation. */
const MAX_RESULTS = 3;

/**
 * Lower-cases and strips diacritics.
 *
 * Portuguese input arrives accented or not depending on the keyboard and on how
 * much care the user takes mid-sentence — "promoções", "promocoes" and
 * "PROMOÇÕES" have to reach the same intent.
 */
/**
 * The combining marks NFD splits accents into.
 *
 * Built from a string rather than written as a regex literal on purpose: as a
 * literal the range is a run of invisible combining characters in the source,
 * which reviews cannot read and editors re-encode.
 */
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

export function normalizeQuery(value: string): string {
  return value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().trim();
}

/**
 * Reads `"2.4 km"` or `"900 m"` as kilometres.
 *
 * The domain keeps distance as display copy, so proximity ranking has to parse
 * it. Unparseable values sort last rather than as zero — an unknown distance is
 * not the nearest venue.
 */
export function parseDistanceKm(distance: string): number {
  const match = /([\d.,]+)\s*(km|m)\b/i.exec(distance);
  if (!match) return Number.POSITIVE_INFINITY;

  const value = Number.parseFloat(match[1].replace(',', '.'));
  if (!Number.isFinite(value)) return Number.POSITIVE_INFINITY;

  return match[2].toLowerCase() === 'm' ? value / 1000 : value;
}

/**
 * Keywords per intent, in resolution order.
 *
 * Order is the whole design: "promoções de drinks" is a promotions question
 * that also mentions products, and "eventos perto de mim" mentions proximity
 * without being about bars. The specific intents are checked before the broad
 * ones, so the more informative reading wins.
 */
const INTENT_KEYWORDS: readonly { id: AssistantIntentId; keywords: readonly string[] }[] = [
  { id: 'live-music', keywords: ['musica ao vivo', 'ao vivo', 'banda', 'sertanejo'] },
  { id: 'date', keywords: ['casal', 'namorad', 'romantic', 'encontro', 'a dois'] },
  { id: 'group', keywords: ['amigos', 'galera', 'turma', 'grupo', 'aniversario'] },
  { id: 'promotions', keywords: ['promoc', 'desconto', 'combo', 'oferta', 'cupom'] },
  { id: 'top-rated', keywords: ['bem avaliad', 'melhor avaliad', 'melhores', 'nota alta'] },
  { id: 'events-today', keywords: ['evento', 'festa', 'show', 'agenda', 'programacao'] },
  { id: 'featured-products', keywords: ['produto', 'drink', 'bebida', 'cardapio', 'menu'] },
  { id: 'bars-nearby', keywords: ['bar', 'boteco', 'pub', 'perto', 'proxim', 'role'] },
];

/** The intent a phrase resolves to, or `fallback` when nothing matches. */
export function resolveIntent(query: string): AssistantIntentId {
  const normalized = normalizeQuery(query);
  if (!normalized) return 'fallback';

  const match = INTENT_KEYWORDS.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );

  return match?.id ?? 'fallback';
}

function barResults(bars: readonly Bar[]): AssistantResult[] {
  return bars.slice(0, MAX_RESULTS).map((bar) => ({ kind: 'bar', id: bar.id, bar }));
}

function byDistance(): Bar[] {
  return [...BARS].sort((a, b) => parseDistanceKm(a.distance) - parseDistanceKm(b.distance));
}

function byRating(): Bar[] {
  return [...BARS].sort((a, b) => b.rating - a.rating);
}

/** Most-reviewed first — the closest thing in the data to "busy tonight". */
function byPopularity(): Bar[] {
  return [...BARS].sort((a, b) => b.reviewsCount - a.reviewsCount);
}

function withLiveMusic(): Bar[] {
  const matches = BARS.filter((bar) => normalizeQuery(bar.category).includes('ao vivo'));
  // No venue is tagged for it in the current data, so rather than answering with
  // nothing the assistant falls back to the best-rated and says so in the reply.
  return matches.length > 0 ? matches : byRating();
}

function productResults(filter: (product: Product) => boolean): AssistantResult[] {
  const results: AssistantResult[] = [];

  for (const bar of BARS) {
    for (const product of bar.featured) {
      if (!filter(product)) continue;

      results.push({
        kind: 'product',
        id: product.id,
        product,
        venueId: bar.id,
        venueName: bar.name,
      });

      if (results.length === MAX_RESULTS) return results;
    }
  }

  return results;
}

function eventResults(): AssistantResult[] {
  return [...EVENTS]
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, MAX_RESULTS)
    .map((event) => ({ kind: 'event', id: event.id, event }));
}

interface IntentAnswer {
  reply: string;
  results: () => AssistantResult[];
  followUps: string[];
}

const ANSWERS: Record<AssistantIntentId, IntentAnswer> = {
  'live-music': {
    reply: 'Separei os bares mais bem avaliados para uma noite com música. Quer algo mais animado ou mais tranquilo?',
    results: () => barResults(withLiveMusic()),
    followUps: ['Ver eventos de hoje', 'Lugares mais bem avaliados'],
  },
  date: {
    reply: 'Para ir a dois, priorizei ambiente e avaliação. Posso filtrar pelos mais próximos?',
    results: () => barResults(byRating()),
    followUps: ['Encontrar bares perto de mim', 'Descobrir promoções'],
  },
  group: {
    reply: 'Estes são os mais movimentados entre os usuários — bom para ir com a galera.',
    results: () => barResults(byPopularity()),
    followUps: ['Descobrir promoções', 'Ver eventos de hoje'],
  },
  promotions: {
    reply: 'Achei combos e descontos ativos agora. Quer que eu filtre pelos bares mais próximos?',
    results: () => productResults((product) => Boolean(product.discount ?? product.promoNote)),
    followUps: ['Encontrar bares perto de mim', 'Produtos em destaque'],
  },
  'top-rated': {
    reply: 'Os mais bem avaliados do budd hoje.',
    results: () => barResults(byRating()),
    followUps: ['Encontrar bares perto de mim', 'Ver eventos de hoje'],
  },
  'events-today': {
    reply: 'Estes são os próximos eventos na agenda. Quer festas, shows ou algo mais tranquilo?',
    results: eventResults,
    followUps: ['Encontrar bares perto de mim', 'Descobrir promoções'],
  },
  'featured-products': {
    reply: 'Os destaques do cardápio agora.',
    results: () => productResults(() => true),
    followUps: ['Descobrir promoções', 'Encontrar bares perto de mim'],
  },
  'bars-nearby': {
    reply: 'Estes são os bares mais próximos de você.',
    results: () => barResults(byDistance()),
    followUps: ['Ver eventos de hoje', 'Descobrir promoções'],
  },
  fallback: {
    reply: 'Ainda não sei responder isso. Posso te ajudar a encontrar bares, eventos ou promoções — o que você procura?',
    results: () => [],
    followUps: ['Encontrar bares perto de mim', 'Ver eventos de hoje', 'Descobrir promoções'],
  },
};

/** The starter chips shown before the first message. */
export const QUICK_SUGGESTIONS: readonly QuickSuggestion[] = [
  { id: 'bars-nearby', label: 'Bares perto de mim', query: 'Encontrar bares perto de mim' },
  { id: 'events-today', label: 'Eventos de hoje', query: 'Ver eventos de hoje' },
  { id: 'promotions', label: 'Promoções', query: 'Descobrir promoções' },
  { id: 'live-music', label: 'Música ao vivo', query: 'Quero um lugar com música ao vivo' },
  { id: 'group', label: 'Rolê com amigos', query: 'Quero um lugar bom para ir com amigos' },
  { id: 'top-rated', label: 'Mais bem avaliados', query: 'Lugares mais bem avaliados' },
];

/** The assistant's answer to a phrase. */
export function answerFor(query: string): AssistantAnswer {
  const intent = resolveIntent(query);
  const answer = ANSWERS[intent];

  return {
    intent,
    reply: answer.reply,
    results: answer.results(),
    followUps: answer.followUps,
  };
}
