import { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { Toast } from '@/components/feedback';
import { Avatar, Button, Divider, RatingBadge, StarRating, Touchable } from '@/components/ui';
import type { ReviewPublicationStatus } from '@/domain/reviews/reviewTypes';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { normalizeError } from '@/services/errors';
import { useSessionStore } from '@/store/sessionStore';
import { showToast } from '@/store/toastStore';
import { colors, duration } from '@/theme';
import {
  formatRating,
  formatReviewCount,
  parseRating,
  ratingQualityLabel,
} from '@/utils/rating';
import type { Bar, Review } from '@/types/domain';

import { fetchVenueReviews } from '../services/reviewService';
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
  /** Native handle of the control that opened the sheet. */
  restoreFocusTarget?: number | null;
}

type DisplayReview = Review & {
  status?: ReviewPublicationStatus;
  errorMessage?: string;
};

const DISMISS_DISTANCE = 88;
const DISMISS_VELOCITY = 900;

/** Bottom sheet listing a venue's reviews and letting the user add one. */
export function ReviewsSheet({
  bar,
  visible,
  onClose,
  restoreFocusTarget,
}: ReviewsSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const translateY = useSharedValue(windowHeight);
  const titleRef = useModalAccessibility(
    visible,
    `Avaliações de ${bar.name}`,
    restoreFocusTarget,
  );
  const user = useSessionStore((state) => state.user);
  const draftUserId = user?.id ?? 'anonymous';
  const draftAuthorName = user?.name ?? 'Você';

  // `useShallow` is required: the selector filters and therefore creates a new
  // array. A reference-stable snapshot prevents a useSyncExternalStore loop.
  const localReviews = useReviewsStore(
    useShallow((state) => selectVisibleReviewsForVenue(state, bar.id)),
  );
  const activeReview = useReviewsStore((state) => selectActiveReview(state, bar.id, draftUserId));
  const updateDraft = useReviewsStore((state) => state.updateDraft);
  const discardDraft = useReviewsStore((state) => state.discardDraft);
  const submitDraft = useReviewsStore((state) => state.submitDraft);

  const {
    data: loadedReviews,
    status: reviewsStatus,
    error: reviewsError,
    reload: reloadReviews,
  } = useAsyncData(
    () => (visible ? fetchVenueReviews(bar.id) : Promise.resolve([])),
    `reviews:${bar.id}:${visible ? 'visible' : 'hidden'}`,
  );

  const reviews = useMemo(
    () => mergeReviews(localReviews, loadedReviews ?? []),
    [loadedReviews, localReviews],
  );
  // A just-published local review is added to the stale catalogue aggregate so
  // the score updates immediately. Once the reviews endpoint returns that same
  // id, the server has synchronized it and it must not be counted a second time
  // on a later app launch.
  const reviewsNotYetInServerAggregate = useMemo(() => {
    const remoteIds = new Set((loadedReviews ?? []).map((review) => review.id));
    return localReviews.filter((review) => !remoteIds.has(review.id));
  }, [loadedReviews, localReviews]);
  const summary = useMemo(
    () =>
      calculateRatingSummary(
        bar.rating,
        bar.reviewsCount,
        reviewsNotYetInServerAggregate,
      ),
    [bar.rating, bar.reviewsCount, reviewsNotYetInServerAggregate],
  );

  useEffect(() => {
    if (!visible) return;

    translateY.set(windowHeight);
    translateY.set(
      reduceMotion
        ? 0
        : withTiming(0, {
            duration: duration.enter,
          }),
    );
  }, [reduceMotion, translateY, visible, windowHeight]);

  const finishClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (reduceMotion) {
      finishClose();
      return;
    }

    translateY.set(withTiming(
      windowHeight,
      { duration: duration.base },
      (finished) => {
        if (finished) runOnJS(finishClose)();
      },
    ));
  }, [finishClose, reduceMotion, translateY, windowHeight]);

  const dragGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(6)
        .failOffsetX([-24, 24])
        .onUpdate((event) => {
          translateY.set(Math.max(0, event.translationY));
        })
        .onEnd((event) => {
          if (event.translationY >= DISMISS_DISTANCE || event.velocityY >= DISMISS_VELOCITY) {
            translateY.set(withTiming(
              windowHeight,
              { duration: duration.base },
              (finished) => {
                if (finished) runOnJS(finishClose)();
              },
            ));
            return;
          }

          translateY.set(withSpring(0, { damping: 22, stiffness: 260 }));
        }),
    [finishClose, translateY, windowHeight],
  );

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  const handleSubmit = async () => {
    if (!user) {
      showToast('Entre novamente para publicar sua avaliação.');
      return;
    }

    try {
      const result = await submitDraft({ venueId: bar.id, user });
      showToast(result.message);
    } catch (error) {
      showToast(normalizeError(error).userMessage);
    }
  };

  const header = (
    <View>
      <RatingSummary
        name={bar.name}
        quality={ratingQualityLabel(summary.rating)}
        rating={summary.rating}
        reviewsCount={summary.count}
        titleRef={titleRef}
      />

      <Divider className="my-4" />

      <ReviewComposer
        errorMessage={activeReview?.errorMessage}
        onChangeStars={(stars) =>
          updateDraft({ venueId: bar.id, userId: draftUserId, authorName: draftAuthorName, stars })
        }
        onChangeText={(text) =>
          updateDraft({ venueId: bar.id, userId: draftUserId, authorName: draftAuthorName, text })
        }
        onDiscard={() => discardDraft(bar.id, draftUserId)}
        onSubmit={handleSubmit}
        stars={activeReview?.stars ?? 0}
        status={activeReview?.status ?? 'idle'}
        text={activeReview?.text ?? ''}
      />

      <Divider className="my-4" />
    </View>
  );

  const listState =
    reviewsStatus === 'loading' ? (
      <ReviewsLoadingState />
    ) : reviewsStatus === 'error' ? (
      <ReviewsErrorState
        description={reviewsError?.message}
        onRetry={reloadReviews}
      />
    ) : (
      <ReviewsEmptyState />
    );

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      onRequestClose={requestClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <GestureHandlerRootView style={styles.fill}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.fill}
        >
          <View className="flex-1 justify-end">
            <Pressable
              accessibilityElementsHidden
              accessible={false}
              className="bg-black/55"
              importantForAccessibility="no-hide-descendants"
              onPress={requestClose}
              style={StyleSheet.absoluteFill}
              testID="reviews-backdrop"
            />

            <Animated.View
              accessibilityViewIsModal
              aria-modal
              className="rounded-t-3xl bg-surface-sheet pt-1"
              importantForAccessibility="yes"
              onAccessibilityEscape={requestClose}
              style={[
                {
                  maxHeight: Math.min(windowHeight * 0.88, windowHeight - insets.top - 16),
                },
                animatedSheetStyle,
              ]}
              testID="reviews-sheet"
            >
              <View className="relative h-12 items-center justify-center">
                <GestureDetector gesture={dragGesture}>
                  <View
                    accessibilityHint="Arraste para baixo para fechar."
                    accessibilityLabel="Alça das avaliações"
                    className="h-11 w-20 items-center justify-center"
                  >
                    <View className="h-1 w-10 rounded-sm bg-text-dim" />
                  </View>
                </GestureDetector>

                <Touchable
                  accessibilityLabel="Fechar avaliações"
                  accessibilityRole="button"
                  className="absolute right-2 h-11 min-w-[64px] items-center justify-center"
                  onPress={requestClose}
                >
                  <Text className="text-sm font-bold text-text-muted">Fechar</Text>
                </Touchable>
              </View>

              <FlatList
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingBottom: insets.bottom + 24,
                }}
                data={reviews}
                ItemSeparatorComponent={ReviewSeparator}
                keyboardShouldPersistTaps="handled"
                keyExtractor={(review) => review.id}
                ListEmptyComponent={listState}
                ListFooterComponent={
                  reviews.length > 0 && reviewsStatus !== 'success' ? listState : null
                }
                ListHeaderComponent={header}
                renderItem={({ item }) => <ReviewRow review={item} />}
                showsVerticalScrollIndicator={false}
              />
              <Toast />
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

interface RatingSummaryProps {
  rating: number | string;
  reviewsCount: number;
  quality: string | null;
  name: string;
  titleRef: React.RefObject<Text | null>;
}

function RatingSummary({ rating, reviewsCount, quality, name, titleRef }: RatingSummaryProps) {
  return (
    <View className="flex-row items-center gap-4">
      <Text
        accessibilityLabel={`Avaliações de ${name}. Nota média ${formatRating(rating)} de 5.`}
        accessibilityRole="header"
        className="text-4xl font-black leading-none text-primary"
        ref={titleRef}
      >
        {formatRating(rating)}
      </Text>

      <View className="min-w-0 flex-1 shrink">
        <StarRating readonly size={18} spacing={4} value={rating} />

        <Text className="mt-1.5 text-sm leading-5 text-text-muted">
          {formatReviewCount(reviewsCount)}
          {quality ? ` · ${quality}` : ''}
        </Text>
      </View>
    </View>
  );
}

function ReviewSeparator() {
  return <View className="h-px bg-border-subtle" />;
}

function ReviewsLoadingState() {
  return (
    <View
      accessibilityLabel="Carregando avaliações"
      accessibilityRole="progressbar"
      className="items-center py-8"
    >
      <ActivityIndicator color={colors.primary} />
      <Text className="mt-3 text-sm text-text-muted">Carregando avaliações…</Text>
    </View>
  );
}

function ReviewsErrorState({
  description,
  onRetry,
}: {
  description?: string;
  onRetry: () => void;
}) {
  return (
    <View className="items-center py-8">
      <Text accessibilityRole="alert" className="text-center text-md font-bold text-text">
        Não foi possível carregar as avaliações.
      </Text>
      {description ? (
        <Text className="mt-1 text-center text-sm leading-5 text-text-muted">{description}</Text>
      ) : null}
      <Button className="mt-4" label="Tentar novamente" onPress={onRetry} size="sm" />
    </View>
  );
}

function ReviewsEmptyState() {
  return (
    <View className="items-center py-8">
      <Text className="text-center text-md font-bold text-text">Ainda não há avaliações.</Text>
      <Text className="mt-1 text-center text-sm leading-5 text-text-muted">
        Seja a primeira pessoa a avaliar este local.
      </Text>
    </View>
  );
}

function ReviewRow({ review }: { review: DisplayReview }) {
  return (
    <View className="py-4">
      <View className="flex-row items-start gap-3">
        <Avatar className="bg-surface-raised" initial={review.initial} size={38} />

        <View className="min-w-0 flex-1">
          <Text className="text-md font-bold text-text" numberOfLines={1}>
            {review.author}
          </Text>
          <Text className="mt-0.5 text-xs text-text-dim" numberOfLines={1}>
            {review.date}
          </Text>
        </View>

        <RatingBadge value={review.stars} />
      </View>

      <Text className="mt-3 text-base leading-6 text-text-soft">{review.text}</Text>
    </View>
  );
}

function mergeReviews(local: readonly DisplayReview[], remote: readonly Review[]): DisplayReview[] {
  const seen = new Set<string>();
  return [...local, ...remote].filter((review) => {
    if (seen.has(review.id)) return false;
    seen.add(review.id);
    return true;
  });
}

function calculateRatingSummary(
  baseRating: number | string,
  baseCount: number,
  localPublished: readonly DisplayReview[],
): { rating: number; count: number } {
  const numericBase = parseRating(baseRating);
  const safeBaseCount = Number.isFinite(baseCount) && baseCount > 0 ? Math.round(baseCount) : 0;
  const baseTotal = Number.isFinite(numericBase) ? numericBase * safeBaseCount : 0;
  const localTotal = localPublished.reduce((sum, review) => sum + review.stars, 0);
  const count = safeBaseCount + localPublished.length;

  return {
    count,
    rating: count > 0 ? (baseTotal + localTotal) / count : 0,
  };
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
