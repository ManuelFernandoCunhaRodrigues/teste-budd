import {
  isPublishedReviewPayload,
  isReviewPayload,
  type PublishedReview,
  type SubmitReviewInput,
} from '@/domain/reviews/reviewTypes';
import { REVIEWS } from '@/mocks/reviews';
import { api } from '@/services/api/client';
import { ENDPOINTS } from '@/services/api/endpoints';
import { backend, backendMode, type BackendMode } from '@/services/backend';
import { contentSourceMode, contentUnavailable } from '@/services/content/contentSource';
import { AppError, reportError } from '@/services/errors';
import { resolveMock } from '@/services/mock';
import type { Review } from '@/types/domain';

export interface SubmitReviewResult {
  review: PublishedReview;
  backendMode: BackendMode;
}

/** Loads public reviews for one venue, with explicit loading/error semantics. */
export async function fetchVenueReviews(venueId: string): Promise<Review[]> {
  let payload: unknown;

  if (contentSourceMode === 'http') {
    payload = await api.get<unknown>(ENDPOINTS.barReviews(venueId));
  } else if (contentSourceMode === 'unavailable') {
    throw contentUnavailable('reviews.list');
  } else {
    payload = await resolveMock(REVIEWS.filter((review) => review.venueId === venueId));
  }

  if (!Array.isArray(payload) || !payload.every(isReviewPayload)) {
    const error = invalidReviewResponse('list');
    reportError(error, { scope: 'reviewService.fetchVenueReviews', venueId });
    throw error;
  }

  return payload;
}

export async function submitVenueReview(input: SubmitReviewInput): Promise<SubmitReviewResult> {
  const review = await backend.submitReview(input);

  if (
    !isPublishedReviewPayload(review) ||
    review.venueId !== input.venueId ||
    review.userId !== input.userId
  ) {
    const error = invalidReviewResponse('submit');
    reportError(error, {
      scope: 'reviewService.submitVenueReview',
      venueId: input.venueId,
      userId: input.userId,
    });
    throw error;
  }

  return { review, backendMode };
}

function invalidReviewResponse(operation: 'list' | 'submit'): AppError {
  return new AppError('unknown', {
    userMessage:
      operation === 'list'
        ? 'Não foi possível carregar as avaliações.'
        : 'Não foi possível publicar sua avaliação agora. Seu texto foi preservado.',
    detail: `reviewService.${operation}: invalid or mis-encoded review payload`,
  });
}
