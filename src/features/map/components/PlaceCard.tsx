import { Text, View } from 'react-native';

import { GradientImage, Touchable } from '@/components/ui';
import { FlameIcon } from '@/components/ui/icons';
import { shadows } from '@/theme';
import type { Place } from '@/types/domain';

export interface PlaceCardProps {
  place: Place;
  onPress: () => void;
  width: number;
}

/**
 * Venue card in the map's bottom carousel.
 *
 * Unlike the rest of the app this card is light-on-green — it sits over the
 * map, where the dark surface treatment would disappear.
 */
export function PlaceCard({ place, onPress, width }: PlaceCardProps) {
  return (
    <Touchable
      accessibilityLabel={`${place.name}. ${place.address}`}
      accessibilityRole="button"
      className="overflow-hidden rounded-xl bg-white"
      feedback="card"
      onPress={onPress}
      style={[{ width }, shadows.card]}
    >
      <GradientImage className="h-[150px] w-full" token={place.image} />

      <View className="bg-primary px-4 pb-4 pt-3.5">
        <View className="flex-row items-center gap-2">
          <FlameIcon color="#0A0A0A" size={18} />
          <Text className="flex-1 text-2xl font-extrabold text-[#0A0A0A]" numberOfLines={1}>
            {place.name}
          </Text>
        </View>

        <Text className="mt-2 text-base leading-5 text-[#123312]" numberOfLines={2}>
          {place.address}
        </Text>

        <Text className="mt-2 text-xs leading-4 text-[#1C3D1C]" numberOfLines={2}>
          {place.hours}
        </Text>
      </View>
    </Touchable>
  );
}
