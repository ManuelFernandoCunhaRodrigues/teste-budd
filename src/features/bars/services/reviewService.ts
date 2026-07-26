import type { PublishedReview, SubmitReviewInput } from '@/domain/reviews/reviewTypes';
import { backend, backendMode, type BackendMode } from '@/services/backend';

export interface SubmitReviewResult {
  review: PublishedReview;
  backendMode: BackendMode;
}

export async function submitVenueReview(input: SubmitReviewInput): Promise<SubmitReviewResult> {
  const review = await backend.submitReview(input);
  return { review, backendMode };
}
