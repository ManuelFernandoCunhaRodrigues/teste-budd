import { Text, View } from 'react-native';

import { Button, Card, GradientImage } from '@/components/ui';
import { FollowersIcon, GlobeIcon } from '@/components/ui/icons';
import { ARTIST_DATA_SOURCE } from '@/mocks/artists';
import { colors } from '@/theme';
import type { Artist } from '@/types/domain';

export interface ArtistCardProps {
  artist: Artist;
  onPress: () => void;
}

/** Grid card for a line-up artist. */
export function ArtistCard({ artist, onPress }: ArtistCardProps) {
  return (
    <Card
      accessibilityLabel={`${artist.name}, ${artist.albums} álbuns`}
      className="flex-1 border-[#222] bg-[#111] rounded-lg"
      onPress={onPress}
    >
      <GradientImage className="h-[150px] w-full" token="plum" />

      <View className="px-3.5 pb-3.5 pt-3">
        <Text className="text-lg font-extrabold leading-tight text-text" numberOfLines={1}>
          {artist.name}
        </Text>

        <View className="mt-2 flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <FollowersIcon color={colors.textMuted} size={12} />
            <Text className="text-xs text-text-muted">{artist.followers}</Text>
          </View>
          <Text className="text-xs text-text-muted">{artist.albums} álbuns</Text>
        </View>

        <Button
          className="mt-3 self-start rounded-2xl px-4"
          label="Site"
          leading={<GlobeIcon color={colors.background} size={13} />}
          onPress={onPress}
          size="sm"
        />

        <Text className="mt-3 border-t border-border-muted pt-2.5 text-2xs text-text-faint">
          Dados: {ARTIST_DATA_SOURCE}
        </Text>
      </View>
    </Card>
  );
}
