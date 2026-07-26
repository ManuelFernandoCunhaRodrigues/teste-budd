import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/constants/storage';
import {
  toReviewInitial,
  validateReviewFields,
  type PublishedReview,
  type ReviewPublicationStatus,
} from '@/domain/reviews/reviewTypes';
import type { AuthenticatedUser } from '@/services/auth/authTypes';
import { AppError, normalizeError, reportError } from '@/services/errors';
import { createIdempotencyKey } from '@/utils/idempotency';

import { submitVenueReview } from '../services/reviewService';

export interface LocalReview {
  id: string;
  venueId: string;
  userId: string;
  author: string;
  initial: string;
  date: string;
  stars: number;
  text: string;
  status: ReviewPublicationStatus;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  errorMessage?: string;
}

export interface ReviewDraftInput {
  venueId: string;
  userId: string;
  authorName: string;
  stars?: number;
  text?: string;
}

export interface SubmitDraftInput {
  venueId: string;
  user: Pick<AuthenticatedUser, 'id' | 'name'>;
}

export interface SubmitDraftResult {
  status: 'submitting' | 'published';
  message: string;
  review?: LocalReview;
}

interface ReviewsState {
  reviews: LocalReview[];
  hasHydrated: boolean;

  updateDraft: (input: ReviewDraftInput) => void;
  discardDraft: (venueId: string, userId: string) => void;
  submitDraft: (input: SubmitDraftInput) => Promise<SubmitDraftResult>;
  resetForUser: (userId?: string) => void;
  reset: () => void;
}

const REVIEWS_VERSION = 1;
const REVIEW_STATUSES: ReviewPublicationStatus[] = ['draft', 'submitting', 'published', 'failed'];

type PersistedReviews = Pick<ReviewsState, 'reviews'>;

function activeReviewFor(
  reviews: readonly LocalReview[],
  venueId: string,
  userId: string,
): LocalReview | undefined {
  return reviews.find(
    (review) =>
      review.venueId === venueId && review.userId === userId && review.status !== 'published',
  );
}

function replaceReview(
  reviews: readonly LocalReview[],
  id: string,
  next: LocalReview,
): LocalReview[] {
  return reviews.map((review) => (review.id === id ? next : review));
}

function removeActiveReview(
  reviews: readonly LocalReview[],
  venueId: string,
  userId: string,
): LocalReview[] {
  return reviews.filter(
    (review) =>
      !(
        review.venueId === venueId &&
        review.userId === userId &&
        review.status !== 'published'
      ),
  );
}

function toPublishedLocalReview(review: PublishedReview, existing: LocalReview): LocalReview {
  return {
    ...existing,
    id: review.id,
    venueId: review.venueId,
    userId: review.userId,
    author: review.author,
    initial: review.initial,
    date: review.date,
    stars: review.stars,
    text: review.text,
    status: 'published',
    publishedAt: review.publishedAt,
    updatedAt: review.publishedAt,
    errorMessage: undefined,
  };
}

function isValidReview(value: unknown): value is LocalReview {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<LocalReview>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.venueId === 'string' &&
    typeof candidate.userId === 'string' &&
    typeof candidate.author === 'string' &&
    typeof candidate.initial === 'string' &&
    typeof candidate.date === 'string' &&
    typeof candidate.text === 'string' &&
    typeof candidate.idempotencyKey === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    typeof candidate.stars === 'number' &&
    REVIEW_STATUSES.includes(candidate.status as ReviewPublicationStatus)
  );
}

function isValidPersisted(value: unknown): value is PersistedReviews {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PersistedReviews>;
  return Array.isArray(candidate.reviews) && candidate.reviews.every(isValidReview);
}

export const useReviewsStore = create<ReviewsState>()(
  persist(
    (set, get) => ({
      reviews: [],
      hasHydrated: false,

      updateDraft: ({ venueId, userId, authorName, stars, text }) =>
        set((state) => {
          const existing = activeReviewFor(state.reviews, venueId, userId);
          if (existing?.status === 'submitting') return state;

          const now = new Date().toISOString();
          const next: LocalReview = {
            id: existing?.id ?? createIdempotencyKey('review-local'),
            venueId,
            userId,
            author: authorName || 'Voce',
            initial: toReviewInitial(authorName || 'Voce'),
            date: 'rascunho',
            stars: stars ?? existing?.stars ?? 0,
            text: text ?? existing?.text ?? '',
            status: 'draft',
            idempotencyKey: existing?.idempotencyKey ?? createIdempotencyKey('review'),
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
          };

          return {
            reviews: existing
              ? replaceReview(state.reviews, existing.id, next)
              : [next, ...state.reviews],
          };
        }),

      discardDraft: (venueId, userId) =>
        set((state) => ({ reviews: removeActiveReview(state.reviews, venueId, userId) })),

      submitDraft: async ({ venueId, user }) => {
        const draft = activeReviewFor(get().reviews, venueId, user.id);

        if (!draft) {
          throw new AppError('validation', {
            userMessage: 'Escreva sua avaliacao antes de enviar.',
            detail: 'reviewsStore.submitDraft: no draft',
          });
        }

        if (draft.status === 'submitting') {
          return { status: 'submitting', message: 'Sua avaliacao ja esta sendo enviada.' };
        }

        const validation = validateReviewFields(draft.stars, draft.text);
        if (validation) {
          set((state) => ({
            reviews: replaceReview(state.reviews, draft.id, {
              ...draft,
              status: 'failed',
              errorMessage: validation,
              updatedAt: new Date().toISOString(),
            }),
          }));

          throw new AppError('validation', {
            userMessage: validation,
            detail: 'reviewsStore.submitDraft: invalid draft',
          });
        }

        const submitting: LocalReview = {
          ...draft,
          author: user.name,
          initial: toReviewInitial(user.name),
          status: 'submitting',
          errorMessage: undefined,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ reviews: replaceReview(state.reviews, draft.id, submitting) }));

        try {
          const result = await submitVenueReview({
            venueId,
            userId: user.id,
            authorName: user.name,
            stars: submitting.stars,
            text: submitting.text,
            idempotencyKey: submitting.idempotencyKey,
          });

          const published = toPublishedLocalReview(result.review, submitting);
          set((state) => ({ reviews: replaceReview(state.reviews, draft.id, published) }));

          return {
            status: 'published',
            review: published,
            message:
              result.backendMode === 'dev'
                ? 'Avaliacao publicada no modo de demonstracao.'
                : 'Avaliacao publicada.',
          };
        } catch (error) {
          const normalized = normalizeError(error);
          reportError(error, {
            scope: 'reviewsStore.submitDraft',
            venueId,
            userId: user.id,
          });

          set((state) => ({
            reviews: replaceReview(state.reviews, draft.id, {
              ...submitting,
              status: 'failed',
              errorMessage: normalized.userMessage,
              updatedAt: new Date().toISOString(),
            }),
          }));

          throw normalized;
        }
      },

      resetForUser: (userId) =>
        set((state) => ({
          reviews: userId ? state.reviews.filter((review) => review.userId !== userId) : [],
        })),

      reset: () => set({ reviews: [] }),
    }),
    {
      name: STORAGE_KEYS.reviews,
      version: REVIEWS_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedReviews => ({ reviews: state.reviews }),
      migrate: (persisted, version) =>
        version >= REVIEWS_VERSION && isValidPersisted(persisted) ? persisted : { reviews: [] },
      onRehydrateStorage: () => (state, error) => {
        useReviewsStore.setState({ hasHydrated: true });
        if (error && __DEV__) console.warn('[reviews] failed to restore', error);

        if (state && !isValidPersisted({ reviews: state.reviews })) {
          useReviewsStore.setState({ reviews: [] });
        }
      },
    },
  ),
);

export function selectActiveReview(
  state: ReviewsState,
  venueId: string,
  userId: string,
): LocalReview | undefined {
  return activeReviewFor(state.reviews, venueId, userId);
}

export function selectVisibleReviewsForVenue(
  state: ReviewsState,
  venueId: string,
): LocalReview[] {
  return state.reviews.filter(
    (review) => review.venueId === venueId && review.status !== 'draft',
  );
}
