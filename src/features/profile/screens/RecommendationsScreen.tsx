import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { EmptyState } from '@/components/feedback';
import { Screen, ScreenHeader } from '@/components/layout';
import { Card, GradientImage } from '@/components/ui';
import { StarOutlineIcon } from '@/components/ui/icons';
import { ROUTES } from '@/constants/routes';
import { recommendationHref } from '@/domain/recommendations/recommendationTargets';
import { RECOMMENDATIONS } from '@/mocks/profile';
import { selectHasInterests, usePreferencesStore } from '@/store/preferencesStore';

/** Personalised suggestions, gated on having picked at least one interest. */
export function RecommendationsScreen() {
  const router = useRouter();
  const hasInterests = usePreferencesStore(selectHasInterests);

  if (!hasInterests) {
    return (
      <Screen>
        <ScreenHeader backFallbackHref="/profile" title="Recomendações" />
        <EmptyState
          actionLabel="Escolher interesses"
          description="Escolha seus interesses e o budd monta uma seleção de bares, eventos e produtos pra você."
          icon={<StarOutlineIcon color="#3A3A3A" size={88} />}
          onAction={() => router.push(ROUTES.preferences)}
          title="Sem recomendações ainda"
        />
      </Screen>
    );
  }

  return (
    <Screen contentClassName="pb-10" scroll>
      <ScreenHeader backFallbackHref="/profile" title="Recomendações" />

      <View className="gap-3.5 px-4.5 pt-2">
        {RECOMMENDATIONS.map((recommendation) => (
          <Card
            accessibilityLabel={`${recommendation.kind}: ${recommendation.name}. ${recommendation.reason}`}
            className="min-h-[120px] flex-row"
            key={recommendation.id}
            // Opens the recommended entity itself. Every card used to push
            // `/role` regardless of what it suggested (M-03).
            onPress={() => router.push(recommendationHref(recommendation))}
          >
            <GradientImage className="w-[38%]" token={recommendation.image} />

            <View className="min-w-0 flex-1 justify-center px-4 py-3.5">
              <Text className="text-xs font-extrabold uppercase tracking-wide text-primary">
                {recommendation.kind}
              </Text>
              <Text className="mt-1 text-lg font-extrabold text-text" numberOfLines={2}>
                {recommendation.name}
              </Text>
              <Text className="mt-1.5 text-sm text-text-muted">{recommendation.reason}</Text>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
