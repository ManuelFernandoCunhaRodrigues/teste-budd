import { Text, View } from 'react-native';

import { Badge, Card, GradientImage, RatingLabel } from '@/components/ui';
import { MapPinIcon } from '@/components/ui/icons';
import { colors } from '@/theme';
import type { Bar } from '@/types/domain';
import { cn } from '@/utils/cn';
import { formatRating } from '@/utils/rating';

export interface BarCardProps {
  bar: Bar;
  onPress: () => void;
  /**
   * Control pinned to the top-right of the details column — the favourites
   * screen puts its remove button here.
   *
   * It renders inside the card's own pressable. React Native's responder system
   * grants the touch to the innermost view that claims it, so a nested control
   * fires alone and the card does not also open the venue — asserted in this
   * component's tests rather than assumed.
   */
  action?: React.ReactNode;
}

/** Venue row in the ROLÊ feed: artwork on the left, details on the right. */
export function BarCard({ bar, onPress, action }: BarCardProps) {
  return (
    <Card
      accessibilityLabel={`${bar.name}, ${bar.category}, avaliação ${formatRating(bar.rating)}, ${bar.distance}`}
      className="min-h-[132px] flex-row"
      onPress={onPress}
    >
      <GradientImage className="w-[38%]" token={bar.image}>
        <Badge className="absolute left-2.5 top-2.5" label="Bar" tone="bar" />
      </GradientImage>

      <View className="relative min-w-0 flex-1 justify-center px-4 py-3.5">
        <Text
          // Cleared so a two-line name never runs under the action.
          className={cn(
            'text-xl font-extrabold leading-tight text-text',
            action ? 'pr-11' : null,
          )}
          numberOfLines={2}
        >
          {bar.name}
        </Text>

        <Text className="mt-1.5 text-sm text-text-muted" numberOfLines={1}>
          {bar.category}
        </Text>

        <View className="mt-1.5 flex-row items-center gap-1.5">
          <MapPinIcon color={colors.textMuted} size={12} />
          <Text className="flex-1 text-sm text-text-muted" numberOfLines={1}>
            {bar.location}
          </Text>
        </View>

        <View className="mt-2 flex-row items-center gap-2">
          <RatingLabel rating={bar.rating} />
          <Text className="text-text-ghost">•</Text>
          <Text className="text-sm font-semibold text-primary">{bar.distance}</Text>
        </View>

        {action ? <View className="absolute right-3 top-3">{action}</View> : null}
      </View>
    </Card>
  );
}
