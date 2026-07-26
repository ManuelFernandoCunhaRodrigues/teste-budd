import type { Review } from '@/types/domain';

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

export function validateReviewFields(stars: number, text: string): string | null {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return 'Escolha uma nota de 1 a 5 estrelas.';
  }

  const trimmed = text.trim();
  if (trimmed.length < 3) return 'Conte um pouco mais sobre sua experiencia.';
  if (trimmed.length > REVIEW_TEXT_LIMIT) {
    return `Sua avaliacao pode ter no maximo ${REVIEW_TEXT_LIMIT} caracteres.`;
  }

  return null;
}

export function toReviewInitial(name: string): string {
  const trimmed = name.trim();
  return (trimmed[0] ?? 'V').toUpperCase();
}
