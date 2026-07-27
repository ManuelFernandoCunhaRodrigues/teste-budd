import { Text, View } from 'react-native';

import { Badge, Card, GradientImage } from '@/components/ui';
import { formatCents } from '@/utils/money';

import { formatShowDate, showsForArtist } from '../services/lineupService';
import type { LineUpArtist } from '../types';

export interface ArtistResultCardProps {
  artist: LineUpArtist;
  onPress: () => void;
}

/**
 * An artist in the search results.
 *
 * Shows the next date rather than a count, because the question behind the
 * search is "can I see them soon" — and says so plainly when there is none,
 * instead of leaving the line blank.
 */
export function ArtistResultCard({ artist, onPress }: ArtistResultCardProps) {
  const [nextShow] = showsForArtist(artist.id);
  const price = nextShow?.minimumPriceInCents;

  const nextLabel = nextShow
    ? `Próximo show: ${formatShowDate(nextShow.startsAt)}`
    : 'Sem shows agendados';

  return (
    <Card
      accessibilityLabel={`${artist.name}, ${artist.genre}. ${nextLabel}`}
      className="flex-row"
      onPress={onPress}
    >
      <GradientImage className="w-[28%]" token={artist.image} />

      <View className="min-w-0 flex-1 px-3.5 py-3">
        <View className="flex-row items-center gap-2">
          <Text className="min-w-0 flex-1 text-base font-extrabold text-text" numberOfLines={1}>
            {artist.name}
          </Text>
          {artist.featured ? <Badge label="Destaque" tone="bar" /> : null}
        </View>

        <Text className="mt-0.5 text-sm text-text-muted" numberOfLines={1}>
          {artist.genre}
        </Text>

        <Text
          className={nextShow ? 'mt-2 text-sm text-text-soft' : 'mt-2 text-sm text-text-dim'}
          numberOfLines={1}
        >
          {nextLabel}
        </Text>

        {nextShow ? (
          <Text className="mt-1 text-sm text-text-muted" numberOfLines={1}>
            {nextShow.venue.name} — {nextShow.venue.city}
          </Text>
        ) : null}

        {price === undefined ? null : (
          <Text className="mt-1.5 text-sm font-extrabold text-primary">
            {price === 0 ? 'Entrada gratuita' : `A partir de ${formatCents(price)}`}
          </Text>
        )}
      </View>
    </Card>
  );
}
