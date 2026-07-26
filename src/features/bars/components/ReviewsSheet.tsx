import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar, Button, Divider } from '@/components/ui';
import { REVIEWS } from '@/mocks/reviews';
import type { Bar, Review } from '@/types/domain';

import { useReviewsStore } from '../store/reviewsStore';
import { ReviewComposer } from './ReviewComposer';

export interface ReviewsSheetProps {
  bar: Bar;
  visible: boolean;
  onClose: () => void;
}

/** Bottom sheet listing a venue's reviews and letting the user add one. */
export function ReviewsSheet({ bar, visible, onClose }: ReviewsSheetProps) {
  const userReviews = useReviewsStore((state) => state.byBarId[bar.id] ?? []);
  const submit = useReviewsStore((state) => state.submit);

  const reviews: Review[] = [...userReviews, ...REVIEWS];

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      {/* Tapping the scrim dismisses, matching the design. */}
      <Pressable
        accessibilityLabel="Fechar avaliações"
        accessibilityRole="button"
        className="flex-1 justify-end bg-black/55"
        onPress={onClose}
      >
        {/* Stops taps inside the sheet from reaching the scrim. */}
        <Pressable
          className="max-h-[82%] rounded-t-3xl bg-surface-sheet px-5 pb-6 pt-2"
          onPress={(event) => event.stopPropagation()}
        >
          <View className="mx-auto mb-4 mt-2 h-1 w-10 rounded-sm bg-[#333]" />

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center gap-4">
              <Text className="text-[44px] font-black leading-none text-primary">
                {bar.rating}
              </Text>
              <View>
                <Text className="text-2xl text-primary">★★★★★</Text>
                <Text className="mt-1 text-base text-text-muted">
                  {bar.reviewsCount} avaliações • Super
                </Text>
              </View>
            </View>

            <Divider className="my-4.5" />

            <ReviewComposer onSubmit={(stars, text) => submit(bar.id, stars, text)} />

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

function ReviewRow({ review }: { review: Review }) {
  return (
    <View className="border-t border-surface-alt py-3">
      <View className="flex-row items-center gap-2.5">
        <Avatar className="bg-surface-raised" initial={review.initial} size={38} />
        <View className="min-w-0 flex-1">
          <Text className="text-md font-bold text-text">{review.author}</Text>
          <Text className="text-xs text-text-dim">{review.date}</Text>
        </View>
        <Text className="text-base font-extrabold text-primary">★ {review.stars}</Text>
      </View>
      <Text className="mt-2 text-base leading-5 text-text-soft">{review.text}</Text>
    </View>
  );
}
