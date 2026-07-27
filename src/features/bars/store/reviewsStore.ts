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
import { isTextIntact } from '@/utils/textIntegrity';

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

/**
 * Bumped to 3 so persisted text is re-checked and an interrupted `submitting`
 * record can be recovered as an editable retry on the next launch.
 */
const REVIEWS_VERSION = 3;
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
    Number.isInteger(candidate.stars) &&
    (candidate.stars ?? -1) >= 0 &&
    (candidate.stars ?? 6) <= 5 &&
    (candidate.status !== 'published' || (candidate.stars ?? 0) >= 1) &&
    REVIEW_STATUSES.includes(candidate.status as ReviewPublicationStatus) &&
    // Text written by a build with a broken encoding is unreadable and cannot be
    // recovered, so it does not count as valid.
    isTextIntact(candidate.author, candidate.text, candidate.date, candidate.errorMessage)
  );
}

/**
 * Keeps the reviews that survive validation and drops the rest.
 *
 * Per-record rather than all-or-nothing: one review written by a build with a
 * broken encoding should not cost the user every other review they left. The
 * discarded ones are reported so a recurring source shows up in logs instead of
 * disappearing quietly.
 *
 * Deliberately does not *repair* mojibake. The mangling is not reliably
 * reversible, and a store that silently fixes bad text would hide the encoding
 * fault that produced it.
 */
function keepValidReviews(value: unknown): LocalReview[] {
  const candidate = (value as Partial<PersistedReviews> | null)?.reviews;
  if (!Array.isArray(candidate)) return [];

  const kept = candidate.filter(isValidReview).map(recoverInterruptedSubmission);

  if (kept.length !== candidate.length) {
    reportError(new Error('reviewsStore: discarded unreadable persisted reviews'), {
      scope: 'reviewsStore.migrate',
      discarded: String(candidate.length - kept.length),
    });
  }

  return kept;
}

/**
 * A process can be killed after persisting `submitting` but before the request
 * resolves. On the next launch that state must be editable and retryable rather
 * than becoming a permanent lock.
 */
function recoverInterruptedSubmission(review: LocalReview): LocalReview {
  if (review.status !== 'submitting') return review;

  return {
    ...review,
    status: 'failed',
    errorMessage: 'O envio anterior foi interrompido. Tente novamente.',
  };
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
            author: authorName || 'Você',
            initial: toReviewInitial(authorName || 'Você'),
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
            userMessage: 'Escreva sua avaliação antes de enviar.',
            detail: 'reviewsStore.submitDraft: no draft',
          });
        }

        if (draft.status === 'submitting') {
          return { status: 'submitting', message: 'Sua avaliação já está sendo enviada.' };
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
                ? 'Avaliação publicada no modo de demonstração.'
                : 'Avaliação publicada.',
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
      // Filters instead of wiping: v1 could contain reviews written with a
      // mis-encoded build, and dropping the whole array to remove one of them
      // would take the user's good reviews with it.
      migrate: (persisted) => ({ reviews: keepValidReviews(persisted) }),
      onRehydrateStorage: () => (state, error) => {
        if (error && __DEV__) console.warn('[reviews] failed to restore', error);

        if (!state) {
          useReviewsStore.setState({ hasHydrated: true });
          return;
        }

        const normalized = keepValidReviews({ reviews: state.reviews });
        const changed =
          normalized.length !== state.reviews.length ||
          normalized.some((review, index) => review !== state.reviews[index]);

        useReviewsStore.setState({
          hasHydrated: true,
          ...(changed ? { reviews: normalized } : null),
        });
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
    (review) => review.venueId === venueId && review.status === 'published',
  );
}
