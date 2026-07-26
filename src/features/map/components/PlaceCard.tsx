import { Text, View } from 'react-native';

import { GradientImage, Touchable } from '@/components/ui';
import { FlameIcon, MapPinIcon } from '@/components/ui/icons';
import { colors, shadows } from '@/theme';
import type { Place } from '@/types/domain';
import { cn } from '@/utils/cn';

export interface PlaceCardProps {
  place: Place;
  onPress: () => void;
  width: number;
  selected?: boolean;
}

function labelForPlace(place: Place): {
  category: string;
  distance: string;
  rating: string;
  status: string;
} {
  return {
    category: place.category ?? (place.target.type === 'bar' ? 'Bar' : 'Evento'),
    distance: place.distance ?? 'Distancia indisponivel',
    rating: place.rating ? `★ ${place.rating}` : 'Sem nota',
    status:
      place.isOpen === true
        ? 'Aberto agora'
        : place.isOpen === false
          ? 'Fechado agora'
          : 'Horario variavel',
  };
}

/**
 * Venue card in the map's bottom carousel.
 *
 * Uses the Budd dark surface treatment plus a border and elevation so the card
 * stays readable over both dense street maps and greener map regions.
 */
export function PlaceCard({ place, onPress, width, selected = false }: PlaceCardProps) {
  const labels = labelForPlace(place);

  return (
    <Touchable
      accessibilityHint="Abre os detalhes deste lugar"
      accessibilityLabel={`${place.name}. ${labels.category}. ${labels.distance}. ${labels.rating}. ${labels.status}. ${place.address}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        'overflow-hidden rounded-xl border bg-surface-sheet',
        selected ? 'border-primary' : 'border-border',
      )}
      feedback="card"
      onPress={onPress}
      style={[{ width, maxWidth: 360 }, shadows.card]}
    >
      {place.image ? (
        <GradientImage className="w-full" style={{ aspectRatio: 16 / 9 }} token={place.image} />
      ) : (
        <View
          className="w-full items-center justify-center bg-surface-raised"
          style={{ aspectRatio: 16 / 9 }}
        >
          <FlameIcon color={colors.primary} size={28} />
          <Text className="mt-2 text-sm font-bold text-text-muted">Sem imagem</Text>
        </View>
      )}

      <View className="p-4">
        <View className="flex-row items-start gap-2.5">
          <View className="mt-1 rounded-pill bg-primary-surface p-1.5">
            <MapPinIcon color={colors.primary} size={16} />
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-xs font-extrabold uppercase text-primary">
                {labels.category}
              </Text>
              {selected ? (
                <Text className="rounded-pill border border-primary-border px-2 py-0.5 text-2xs font-bold text-primary">
                  Selecionado
                </Text>
              ) : null}
            </View>

            <Text className="mt-1 text-3xl font-extrabold text-text" numberOfLines={2}>
              {place.name}
            </Text>
          </View>
        </View>

        <Text className="mt-2.5 text-sm leading-[18px] text-text-soft" numberOfLines={2}>
          {place.address}
        </Text>

        <View className="mt-3 flex-row flex-wrap gap-2">
          <Text className="rounded-pill bg-surface-raised px-2.5 py-1 text-xs font-bold text-text-soft">
            {labels.distance}
          </Text>
          <Text className="rounded-pill bg-surface-raised px-2.5 py-1 text-xs font-bold text-primary">
            {labels.rating}
          </Text>
          <Text
            className={cn(
              'rounded-pill border px-2.5 py-1 text-xs font-bold',
              place.isOpen === false
                ? 'border-danger-border text-danger-alt'
                : 'border-primary-border text-primary',
            )}
          >
            {labels.status}
          </Text>
        </View>

        <View className="mt-3 flex-row items-center justify-between gap-3">
          <Text className="min-w-0 flex-1 text-xs leading-4 text-text-dim" numberOfLines={2}>
            {place.hours}
          </Text>
          <Text className="text-sm font-extrabold text-primary">Ver detalhes</Text>
        </View>
      </View>
    </Touchable>
  );
}
