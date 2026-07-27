import {
  isPublishedReviewPayload,
  isReviewPayload,
  type PublishedReview,
} from '../reviewTypes';

const VALID_REVIEW: PublishedReview = {
  id: 'review-1',
  venueId: 'venue-1',
  userId: 'user-1',
  author: 'Marina S.',
  initial: 'M',
  date: 'há 2 dias',
  stars: 5,
  text: 'Ambiente ótimo e atendimento rápido.',
  publishedAt: '2026-07-27T12:00:00.000Z',
};

it('accepts a complete review payload from the service boundary', () => {
  expect(isReviewPayload(VALID_REVIEW)).toBe(true);
  expect(isPublishedReviewPayload(VALID_REVIEW)).toBe(true);
});

it.each([0, 1.5, 6])('rejects the invalid score %s', (stars) => {
  expect(isReviewPayload({ ...VALID_REVIEW, stars })).toBe(false);
});

it('rejects mis-encoded text before it reaches the UI or persistence', () => {
  const mangledCedilla = String.fromCodePoint(0x00c3, 0x00a7);

  expect(
    isReviewPayload({
      ...VALID_REVIEW,
      text: `Avalia${mangledCedilla}ão ilegível`,
    }),
  ).toBe(false);
});

it('rejects an incomplete publication envelope', () => {
  expect(isPublishedReviewPayload({ ...VALID_REVIEW, venueId: '' })).toBe(false);
  expect(isPublishedReviewPayload({ ...VALID_REVIEW, publishedAt: 'not-a-date' })).toBe(false);
});
