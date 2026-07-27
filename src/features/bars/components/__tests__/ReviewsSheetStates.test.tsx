import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '@/services/errors';
import type { Review } from '@/types/domain';

import { useReviewsStore, type LocalReview } from '../../store/reviewsStore';
import {
  renderReviewsSheet,
  resetReviewsSheetState,
  REVIEWS_BAR,
  REVIEWS_METRICS,
} from './reviewsSheetTestHarness';

jest.mock('@/hooks/useModalAccessibility', () => ({
  __esModule: true,
  useModalAccessibility: () => ({ current: null }),
}));

jest.mock('../../services/reviewService', () => {
  const actual = jest.requireActual('../../services/reviewService');
  return {
    __esModule: true,
    ...actual,
    fetchVenueReviews: jest.fn(),
  };
});

const { fetchVenueReviews } = require('../../services/reviewService') as {
  fetchVenueReviews: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  resetReviewsSheetState();
});

it('shows a loading state while reviews are unresolved', async () => {
  fetchVenueReviews.mockReturnValue(new Promise(() => {}));

  await renderReviewsSheet();

  expect(screen.getByLabelText('Carregando avaliações')).toBeTruthy();
  expect(fetchVenueReviews).toHaveBeenCalledWith(REVIEWS_BAR.id);
});

it('shows an error and retries the same venue', async () => {
  fetchVenueReviews
    .mockRejectedValueOnce(
      new AppError('network', {
        userMessage: 'Sem conexão para carregar as avaliações.',
      }),
    )
    .mockResolvedValueOnce([]);

  await renderReviewsSheet();

  expect(await screen.findByText('Não foi possível carregar as avaliações.')).toBeTruthy();
  expect(screen.getByText('Sem conexão para carregar as avaliações.')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Tentar novamente'));

  await waitFor(() => expect(fetchVenueReviews).toHaveBeenCalledTimes(2));
  expect(fetchVenueReviews).toHaveBeenLastCalledWith(REVIEWS_BAR.id);
  expect(await screen.findByText('Ainda não há avaliações.')).toBeTruthy();
});

it('renders the required empty copy when the venue has no reviews', async () => {
  fetchVenueReviews.mockResolvedValue([]);

  await renderReviewsSheet();

  expect(await screen.findByText('Ainda não há avaliações.')).toBeTruthy();
  expect(screen.getByText('Seja a primeira pessoa a avaliar este local.')).toBeTruthy();
});

it('does not count a persisted review again after the server returns the same id', async () => {
  const remote: Review = {
    id: 'server-synced-review',
    author: 'Ana',
    initial: 'A',
    date: 'agora',
    stars: 5,
    text: 'Avaliação já sincronizada pelo servidor.',
  };
  const local: LocalReview = {
    ...remote,
    venueId: REVIEWS_BAR.id,
    userId: 'u1',
    status: 'published',
    idempotencyKey: 'review-sync-key',
    createdAt: '2026-07-27T12:00:00.000Z',
    updatedAt: '2026-07-27T12:00:00.000Z',
    publishedAt: '2026-07-27T12:00:00.000Z',
  };

  useReviewsStore.setState({ reviews: [local], hasHydrated: true });
  fetchVenueReviews.mockResolvedValue([remote]);

  await renderReviewsSheet();

  expect(await screen.findByText(/284 avaliações/)).toBeTruthy();
  expect(screen.queryByText(/285 avaliações/)).toBeNull();
  expect(screen.getAllByText(remote.text)).toHaveLength(1);
});

it('adds the Android gesture inset to the list bottom padding', async () => {
  fetchVenueReviews.mockReturnValue(new Promise(() => {}));

  await renderReviewsSheet();

  const scrollView = screen.container.queryAll(
    (instance) => instance.type === 'RCTScrollView',
  )[0];
  expect(scrollView).toBeDefined();
  expect(scrollView.props.contentContainerStyle).toMatchObject({
    paddingHorizontal: 20,
    paddingBottom: REVIEWS_METRICS.insets.bottom + 24,
  });
});
