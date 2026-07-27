import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Touchable } from '@/components/ui';
import { FlameIcon } from '@/components/ui/icons';
import { shadows } from '@/theme';
import type { Place } from '@/types/domain';

export interface PlaceCardProps {
  place: Place;
  onPress: () => void;
  selected?: boolean;
}

const CARD_MAX_WIDTH = 236;
const CARD_MEDIA_HEIGHT = 150;
const CARD_INFO_HEIGHT = 174;

/**
 * Venue card in the map's bottom carousel.
 *
 * Matches the compact map prototype: a light media block above a saturated
 * green information panel. Explicit heights keep the card from expanding over
 * the map when native map tiles or gradient placeholders are slow to draw.
 */
export function PlaceCard({ place, onPress, selected = false }: PlaceCardProps) {
  return (
    <Touchable
      accessibilityHint="Abre os detalhes deste lugar"
      accessibilityLabel={`${place.name}. ${place.address}. ${place.hours}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="overflow-hidden rounded-lg bg-white"
      feedback="card"
      onPress={onPress}
      style={[styles.card, selected ? styles.selectedCard : null, shadows.card]}
    >
      <View className="items-center justify-center bg-[#F3F3F3]" style={styles.media}>
        <ImagePlaceholderIcon color="#FFFFFF" size={24} />
        <Text className="mt-3 px-6 text-center text-xs font-extrabold text-white" numberOfLines={1}>
          {place.name}
        </Text>
        <Text className="mt-1 text-center text-[11px] font-bold text-white" numberOfLines={1}>
          or browse files
        </Text>
      </View>

      <View className="bg-primary px-4 pt-3" style={styles.info}>
        <View className="flex-row items-center gap-2">
          <FlameIcon color="#128318" size={13} />
          <Text className="min-w-0 flex-1 text-base font-extrabold text-black" numberOfLines={1}>
            {place.name}
          </Text>
        </View>

        <Text className="mt-2 text-sm leading-[18px] text-black" numberOfLines={2}>
          {place.address}
        </Text>

        <Text className="mt-3 text-xs leading-4 text-black" numberOfLines={3}>
          {place.hours}
        </Text>
      </View>
    </Touchable>
  );
}

function ImagePlaceholderIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={4} width={17} height={16} rx={2} stroke={color} strokeWidth={1.5} />
      <Path
        d="M7 16l3.2-3.2 2.4 2.4 2.1-2.1L19 17.4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.2 8.7h.1"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
  },
  media: {
    height: CARD_MEDIA_HEIGHT,
  },
  info: {
    height: CARD_INFO_HEIGHT,
  },
  selectedCard: {
    transform: [{ translateY: -2 }],
  },
});
