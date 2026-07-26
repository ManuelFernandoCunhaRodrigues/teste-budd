import { ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { Badge, Card, GradientImage } from '@/components/ui';
import type { Event } from '@/types/domain';

export interface VenueEventsCarouselProps {
  events: Event[];
  onSelect: (event: Event) => void;
}

/**
 * Snap carousel of the venue's own events.
 *
 * The design centres each card with peeking neighbours; `snapToInterval` plus
 * symmetric padding reproduces that without a carousel dependency.
 */
export function VenueEventsCarousel({ events, onSelect }: VenueEventsCarouselProps) {
  const { width } = useWindowDimensions();
  const cardWidth = width * 0.7;
  const gap = 12;
  const sidePadding = (width - cardWidth) / 2;

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: sidePadding, gap }}
      decelerationRate="fast"
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToAlignment="start"
      snapToInterval={cardWidth + gap}
    >
      {events.map((event) => (
        <Card
          accessibilityLabel={`${event.name}, ${event.date}, ${event.price}`}
          className="rounded-lg"
          key={event.id}
          onPress={() => onSelect(event)}
          style={{ width: cardWidth }}
        >
          <GradientImage className="h-24" token={event.image}>
            <Badge className="absolute left-2 top-2" label="Evento" />
          </GradientImage>

          <View className="px-3.5 py-3">
            <Text className="text-md font-extrabold leading-tight text-text" numberOfLines={2}>
              {event.name}
            </Text>
            <Text className="mt-1 text-xs font-bold text-primary">{event.date}</Text>
            <View className="mt-2 flex-row items-center justify-between gap-2.5">
              <Text className="text-xs font-semibold text-text-softer">{event.price}</Text>
              <Text className="text-xs font-bold text-primary">Ver ›</Text>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
