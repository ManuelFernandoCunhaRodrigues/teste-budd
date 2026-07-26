import { Text, View } from 'react-native';

import { Avatar, Divider, RatingLabel, Touchable } from '@/components/ui';
import { ChevronRightIcon } from '@/components/ui/icons';
import type { Bar } from '@/types/domain';

export interface BarInfoCardProps {
  bar: Bar;
  onOpenReviews: () => void;
}

/**
 * The venue summary card that overlaps the cover artwork, carrying the
 * monogram badge, rating and service details.
 */
export function BarInfoCard({ bar, onOpenReviews }: BarInfoCardProps) {
  return (
    <View className="relative mx-4 -mt-[34px] rounded-2xl border border-border bg-surface px-4.5 pb-1.5 pt-[42px]">
      <View className="absolute -top-[62px] left-0 right-0 items-center">
        <Avatar bordered initial={bar.initial} size={94} />
      </View>

      <View className="flex-row items-center justify-between gap-2.5">
        <Text
          accessibilityRole="header"
          className="flex-1 text-4xl font-black leading-tight text-text"
          numberOfLines={2}
        >
          {bar.name}
        </Text>
        <ChevronRightIcon />
      </View>

      <Text className="mt-1.5 text-base text-text-muted">
        {bar.distance} • Mín {bar.minOrder}
      </Text>

      <Divider className="my-3.5" />

      <Touchable
        accessibilityHint="Abre as avaliações do local"
        accessibilityLabel={`Avaliação ${bar.rating}, ${bar.reviewsCount} avaliações`}
        accessibilityRole="button"
        className="flex-row items-center justify-between gap-2.5"
        feedback="none"
        onPress={onOpenReviews}
      >
        <View className="flex-1 flex-row items-center gap-2">
          <RatingLabel className="font-extrabold" rating={bar.rating} />
          <Text className="text-base text-text-muted">({bar.reviewsCount} avaliações)</Text>
          <Text className="text-text-ghost">•</Text>
          <Text className="text-base font-bold text-primary">Super</Text>
        </View>
        <ChevronRightIcon />
      </Touchable>

      <Divider className="my-3.5" />

      <View className="pb-3">
        <Text className="text-base font-bold text-text">Padrão • {bar.eta}</Text>
        <Text className="mt-1 text-base text-text-muted">
          Mais opções disponíveis na sacola
        </Text>
      </View>
    </View>
  );
}
