import { Text, View } from 'react-native';

import { Badge, Button, Card, GradientImage } from '@/components/ui';
import { MapPinIcon } from '@/components/ui/icons';
import { colors } from '@/theme';
import type { Event } from '@/types/domain';

import { PriceLabel } from './PriceLabel';

export interface EventCardProps {
  event: Event;
  onPress: () => void;
  onBuy: () => void;
}

/** Event row in the ROLÊ feed. */
export function EventCard({ event, onPress, onBuy }: EventCardProps) {
  return (
    <Card
      accessibilityLabel={`${event.name}, ${event.date}, ${event.location}, ${event.price}`}
      className="min-h-[140px] flex-row"
      onPress={onPress}
    >
      <GradientImage className="w-[38%]" token={event.image}>
        <Badge className="absolute left-2.5 top-2.5" label="Evento" />
      </GradientImage>

      <View className="min-w-0 flex-1 justify-center px-4 py-3.5">
        <Text className="text-lg font-extrabold leading-tight text-text" numberOfLines={2}>
          {event.name}
        </Text>

        <Text className="mt-1.5 text-sm font-bold text-primary" numberOfLines={1}>
          {event.date}
        </Text>

        <View className="mt-1.5 flex-row items-center gap-1.5">
          <MapPinIcon color={colors.textMuted} size={12} />
          <Text className="flex-1 text-sm text-text-muted" numberOfLines={1}>
            {event.location}
          </Text>
        </View>

        <View className="mt-2.5 flex-row items-end justify-between gap-2.5">
          <View className="min-w-0 flex-1">
            <PriceLabel price={event.price} />
          </View>
          <Button label="Comprar" onPress={onBuy} size="sm" />
        </View>
      </View>
    </Card>
  );
}
