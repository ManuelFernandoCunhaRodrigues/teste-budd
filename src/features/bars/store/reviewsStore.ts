import { create } from 'zustand';

import type { Review } from '@/types/domain';

interface ReviewsState {
  /** Reviews the user submitted, keyed by bar id. */
  byBarId: Record<string, Review[]>;
  submit: (barId: string, stars: number, text: string) => void;
}

/**
 * Reviews written during this session.
 *
 * Feature-local rather than in `src/store` because nothing outside the venue
 * screens reads it. They prepend to the seed list from `mocks/reviews`.
 */
export const useReviewsStore = create<ReviewsState>((set) => ({
  byBarId: {},

  submit: (barId, stars, text) =>
    set((state) => {
      const review: Review = {
        id: `user-${Date.now()}`,
        author: 'Você',
        initial: 'V',
        date: 'agora',
        stars,
        text: text.trim(),
      };

      return {
        byBarId: {
          ...state.byBarId,
          [barId]: [review, ...(state.byBarId[barId] ?? [])],
        },
      };
    }),
}));
