import { Text, View } from 'react-native';

import { Card, GradientImage } from '@/components/ui';
import { BarCard } from '@/features/bars';
import { formatCents } from '@/utils/money';

import type { AssistantResult } from '../assistantTypes';

export interface AssistantResultCardProps {
  result: AssistantResult;
  onOpen: (result: AssistantResult) => void;
}

/**
 * One card in an assistant answer.
 *
 * Venues render through the feed's own `BarCard` rather than a chat-specific
 * copy: a bar the assistant suggests should look like the same bar the user
 * already knows from ROLÊ and from their favourites.
 */
export function AssistantResultCard({ result, onOpen }: AssistantResultCardProps) {
  if (result.kind === 'bar') {
    return <BarCard bar={result.bar} onPress={() => onOpen(result)} />;
  }

  if (result.kind === 'event') {
    const { event } = result;

    return (
      <Card
        accessibilityLabel={`${event.name}. ${event.date}. ${event.location}. ${event.price}`}
        className="flex-row"
        onPress={() => onOpen(result)}
      >
        <GradientImage className="w-[32%]" token={event.image} />

        <View className="min-w-0 flex-1 px-3.5 py-3">
          <Text className="text-base font-extrabold leading-tight text-text" numberOfLines={2}>
            {event.name}
          </Text>
          <Text className="mt-1 text-sm text-text-muted" numberOfLines={1}>
            {event.date} · {event.time}
          </Text>
          <Text className="mt-0.5 text-sm text-text-muted" numberOfLines={1}>
            {event.location}
          </Text>
          <Text className="mt-1.5 text-sm font-extrabold text-primary">{event.price}</Text>
        </View>
      </Card>
    );
  }

  const { product, venueName } = result;

  return (
    <Card
      accessibilityLabel={`${product.name}. ${venueName}. ${formatCents(product.priceInCents)}`}
      className="flex-row"
      onPress={() => onOpen(result)}
    >
      <GradientImage className="w-[32%]" token={product.image} />

      <View className="min-w-0 flex-1 px-3.5 py-3">
        <Text className="text-base font-extrabold leading-tight text-text" numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="mt-1 text-sm text-text-muted" numberOfLines={1}>
          {venueName}
        </Text>

        <View className="mt-1.5 flex-row items-center gap-2">
          <Text className="text-sm font-extrabold text-primary">
            {formatCents(product.priceInCents)}
          </Text>
          {/* Only the promotional note earns green here; the price already has it. */}
          {product.promoNote ? (
            <Text className="text-xs font-bold text-primary" numberOfLines={1}>
              {product.promoNote}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
