import { act, fireEvent, screen } from '@testing-library/react-native';

import type { PublishedReview } from '@/domain/reviews/reviewTypes';

import {
  useReviewsStore,
  type SubmitDraftResult,
} from '../../store/reviewsStore';
import {
  renderReviewsSheet,
  resetReviewsSheetState,
  REVIEWS_BAR,
  REVIEWS_USER,
} from './reviewsSheetTestHarness';

jest.mock('@/hooks/useModalAccessibility', () => ({
  __esModule: true,
  useModalAccessibility: () => ({ current: null }),
}));

jest.mock('react-native-reanimated', () => {
  const reanimated = jest.requireActual('react-native-reanimated/mock');
  return {
    ...reanimated,
    default: reanimated.default,
    useReducedMotion: () => true,
  };
});

jest.mock('../../services/reviewService', () => ({
  __esModule: true,
  fetchVenueReviews: jest.fn(),
  submitVenueReview: jest.fn(),
}));

const { fetchVenueReviews, submitVenueReview } = require('../../services/reviewService') as {
  fetchVenueReviews: jest.Mock;
  submitVenueReview: jest.Mock;
};

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

function publishedReview(text: string): PublishedReview {
  return {
    id: 'published-review-1',
    venueId: REVIEWS_BAR.id,
    userId: REVIEWS_USER.id,
    author: REVIEWS_USER.name,
    initial: 'A',
    date: 'agora',
    stars: 5,
    text,
    publishedAt: '2026-07-27T12:00:00.000Z',
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  resetReviewsSheetState();
  fetchVenueReviews.mockResolvedValue([]);
});

it('closes through both Android back and the backdrop', async () => {
  const onClose = jest.fn();
  await renderReviewsSheet({ onClose });

  const modal = screen.container.queryAll(
    (instance) => typeof instance.props.onRequestClose === 'function',
  )[0];
  expect(modal).toBeDefined();

  await act(() => {
    modal.props.onRequestClose();
  });
  expect(onClose).toHaveBeenCalledTimes(1);

  await fireEvent.press(
    screen.getByTestId('reviews-backdrop', { includeHiddenElements: true }),
  );
  expect(onClose).toHaveBeenCalledTimes(2);
});

it('shows submission loading, drops a duplicate press and updates the count and list', async () => {
  const publication = deferred<{
    review: PublishedReview;
    backendMode: 'dev';
  }>();
  const comment = 'Ambiente ótimo, atendimento rápido.';
  submitVenueReview.mockReturnValue(publication.promise);

  await renderReviewsSheet();
  expect(await screen.findByText('Ainda não há avaliações.')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Dar nota 5 de 5'));
  await fireEvent.changeText(
    screen.getByLabelText('Conte como foi sua experiência'),
    comment,
  );

  const send = await screen.findByLabelText('Enviar avaliação');
  expect(send.props.accessibilityState.disabled).toBe(false);
  let submission: Promise<SubmitDraftResult>;
  let duplicate: typeof submission;
  await act(() => {
    // Start through the same store action used by the sheet, but deliberately
    // do not return its promise: the pending UI must be inspected first.
    submission = useReviewsStore.getState().submitDraft({
      venueId: REVIEWS_BAR.id,
      user: REVIEWS_USER,
    });
    duplicate = useReviewsStore.getState().submitDraft({
      venueId: REVIEWS_BAR.id,
      user: REVIEWS_USER,
    });
  });

  const sending = await screen.findByLabelText('Enviando…');
  expect(sending.props.accessibilityState).toMatchObject({
    busy: true,
    disabled: true,
  });

  await expect(duplicate!).resolves.toMatchObject({ status: 'submitting' });
  await fireEvent.press(sending);
  expect(submitVenueReview).toHaveBeenCalledTimes(1);

  await act(async () => {
    publication.resolve({
      review: publishedReview(comment),
      backendMode: 'dev',
    });
    await publication.promise;
    await submission!;
  });

  expect(await screen.findByText(/285 avaliações/)).toBeTruthy();
  expect(screen.getByText(comment)).toBeTruthy();
  expect(submitVenueReview).toHaveBeenCalledTimes(1);
});
