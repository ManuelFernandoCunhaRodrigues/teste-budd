import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar, Button, Divider } from '@/components/ui';
import type { ReviewPublicationStatus } from '@/domain/reviews/reviewTypes';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { REVIEWS } from '@/mocks/reviews';
import { normalizeError } from '@/services/errors';
import { useSessionStore } from '@/store/sessionStore';
import { showToast } from '@/store/toastStore';
import type { Bar, Review } from '@/types/domain';

import {
  selectActiveReview,
  selectVisibleReviewsForVenue,
  useReviewsStore,
} from '../store/reviewsStore';
import { ReviewComposer } from './ReviewComposer';

export interface ReviewsSheetProps {
  bar: Bar;
  visible: boolean;
  onClose: () => void;
}

/** Bottom sheet listing a venue's reviews and letting the user add one. */
export function ReviewsSheet({ bar, visible, onClose }: ReviewsSheetProps) {
  const titleRef = useModalAccessibility(visible, `Avaliações de ${bar.name}`);
  const user = useSessionStore((state) => state.user);
  const draftUserId = user?.id ?? 'anonymous';
  const draftAuthorName = user?.name ?? 'Voce';

  const localReviews = useReviewsStore((state) => selectVisibleReviewsForVenue(state, bar.id));
  const activeReview = useReviewsStore((state) => selectActiveReview(state, bar.id, draftUserId));
  const updateDraft = useReviewsStore((state) => state.updateDraft);
  const discardDraft = useReviewsStore((state) => state.discardDraft);
  const submitDraft = useReviewsStore((state) => state.submitDraft);

  const reviews: DisplayReview[] = [...localReviews, ...REVIEWS];

  const handleSubmit = async () => {
    if (!user) {
      showToast('Entre novamente para publicar sua avaliacao.');
      return;
    }

    try {
      const result = await submitDraft({ venueId: bar.id, user });
      showToast(result.message);
    } catch (error) {
      showToast(normalizeError(error).userMessage);
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      {/* Tapping the scrim dismisses, matching the design. */}
      <Pressable
        accessibilityLabel="Fechar avaliacoes"
        accessibilityRole="button"
        className="flex-1 justify-end bg-black/55"
        onPress={onClose}
      >
        {/* Stops taps inside the sheet from reaching the scrim. */}
        <Pressable
          accessibilityViewIsModal
          aria-modal
          className="max-h-[82%] rounded-t-3xl bg-surface-sheet px-5 pb-6 pt-2"
          importantForAccessibility="yes"
          onPress={(event) => event.stopPropagation()}
        >
          <View className="mx-auto mb-4 mt-2 h-1 w-10 rounded-sm bg-[#333]" />

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center gap-4">
              <Text className="text-[44px] font-black leading-none text-primary">
                {bar.rating}
              </Text>
              <View>
                <Text
                  accessibilityLabel={`Avaliações de ${bar.name}`}
                  accessibilityRole="header"
                  className="text-2xl text-primary"
                  ref={titleRef}
                >
                  ★★★★★
                </Text>
                <Text className="mt-1 text-base text-text-muted">
                  {bar.reviewsCount} avaliacoes • Super
                </Text>
              </View>
            </View>

            <Divider className="my-4.5" />

            <ReviewComposer
              errorMessage={activeReview?.errorMessage}
              onChangeStars={(stars) =>
                updateDraft({
                  venueId: bar.id,
                  userId: draftUserId,
                  authorName: draftAuthorName,
                  stars,
                })
              }
              onChangeText={(text) =>
                updateDraft({
                  venueId: bar.id,
                  userId: draftUserId,
                  authorName: draftAuthorName,
                  text,
                })
              }
              onDiscard={() => discardDraft(bar.id, draftUserId)}
              onSubmit={handleSubmit}
              stars={activeReview?.stars ?? 0}
              status={activeReview?.status ?? 'idle'}
              text={activeReview?.text ?? ''}
            />

            <Divider className="my-4.5" />

            {reviews.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}

            <Button className="mt-4.5" fullWidth label="Fechar" onPress={onClose} size="lg" />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type DisplayReview = Review & {
  status?: ReviewPublicationStatus;
  errorMessage?: string;
};

function ReviewRow({ review }: { review: DisplayReview }) {
  const dateLabel =
    review.status === 'submitting' ? 'Enviando' : review.status === 'failed' ? 'Falhou' : review.date;

  return (
    <View className="border-t border-surface-alt py-3">
      <View className="flex-row items-center gap-2.5">
        <Avatar className="bg-surface-raised" initial={review.initial} size={38} />
        <View className="min-w-0 flex-1">
          <Text className="text-md font-bold text-text">{review.author}</Text>
          <Text className="text-xs text-text-dim">{dateLabel}</Text>
        </View>
        <Text className="text-base font-extrabold text-primary">★ {review.stars}</Text>
      </View>
      <Text className="mt-2 text-base leading-5 text-text-soft">{review.text}</Text>
      {review.status === 'failed' && review.errorMessage ? (
        <Text className="mt-1.5 text-sm text-danger-alt">{review.errorMessage}</Text>
      ) : null}
    </View>
  );
}
