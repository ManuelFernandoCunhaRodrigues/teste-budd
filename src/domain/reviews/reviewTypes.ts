import type { Review } from '@/types/domain';
import { isTextIntact } from '@/utils/textIntegrity';

export type ReviewPublicationStatus = 'draft' | 'submitting' | 'published' | 'failed';

export interface SubmitReviewInput {
  venueId: string;
  userId: string;
  authorName: string;
  stars: number;
  text: string;
  idempotencyKey: string;
}

export interface PublishedReview extends Review {
  venueId: string;
  userId: string;
  publishedAt: string;
}

export const REVIEW_TEXT_LIMIT = 500;

/**
 * Shortest accepted comment.
 *
 * Exported so the composer can disable its button on exactly the rule this
 * function enforces. When the two drifted apart, the button enabled into a
 * submission the server was always going to reject.
 */
export const REVIEW_TEXT_MINIMUM = 3;

export function validateReviewFields(stars: number, text: string): string | null {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return 'Escolha uma nota de 1 a 5 estrelas.';
  }

  const trimmed = text.trim();
  if (trimmed.length < REVIEW_TEXT_MINIMUM) {
    return 'Conte um pouco mais sobre sua experiência.';
  }
  if (trimmed.length > REVIEW_TEXT_LIMIT) {
    return `Sua avaliação pode ter no máximo ${REVIEW_TEXT_LIMIT} caracteres.`;
  }

  return null;
}

export function toReviewInitial(name: string): string {
  const trimmed = name.trim();
  return (trimmed[0] ?? 'V').toUpperCase();
}

/**
 * Runtime guard for review data crossing an I/O boundary.
 *
 * TypeScript types disappear from the bundle, so an HTTP response can still
 * contain an invalid score or mis-decoded text. Keeping that data out here
 * prevents it from reaching the UI or being persisted for the next launch.
 */
export function isReviewPayload(value: unknown): value is Review {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Review>;

  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.author === 'string' &&
    candidate.author.trim().length > 0 &&
    typeof candidate.initial === 'string' &&
    candidate.initial.trim().length > 0 &&
    typeof candidate.date === 'string' &&
    candidate.date.trim().length > 0 &&
    Number.isInteger(candidate.stars) &&
    (candidate.stars ?? 0) >= 1 &&
    (candidate.stars ?? 0) <= 5 &&
    typeof candidate.text === 'string' &&
    candidate.text.trim().length >= REVIEW_TEXT_MINIMUM &&
    isTextIntact(candidate.author, candidate.initial, candidate.date, candidate.text)
  );
}

/** Runtime guard for a review returned after publication. */
export function isPublishedReviewPayload(value: unknown): value is PublishedReview {
  if (!isReviewPayload(value)) return false;
  const candidate = value as Partial<PublishedReview>;

  return (
    typeof candidate.venueId === 'string' &&
    candidate.venueId.length > 0 &&
    typeof candidate.userId === 'string' &&
    candidate.userId.length > 0 &&
    typeof candidate.publishedAt === 'string' &&
    Number.isFinite(Date.parse(candidate.publishedAt))
  );
}
