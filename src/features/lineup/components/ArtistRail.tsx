import { ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Touchable } from '@/components/ui';
import type { Artist } from '@/types/domain';

export interface ArtistRailProps {
  artists: Artist[];
  /** Name of the artist currently being opened, if any. */
  loadingArtistId: string | null;
  onSelect: (artist: Artist) => void;
}

/** Story-style rail of circular artist avatars. */
export function ArtistRail({ artists, loadingArtistId, onSelect }: ArtistRailProps) {
  return (
    <ScrollView
      contentContainerClassName="px-4.5 pb-4.5 gap-4"
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {artists.map((artist) => {
        const loading = loadingArtistId === artist.id;

        return (
          <Touchable
            accessibilityLabel={`Abrir perfil de ${artist.name}`}
            accessibilityRole="button"
            accessibilityState={{ busy: loading, disabled: loading }}
            className="w-[84px] items-center"
            disabled={loading}
            key={artist.id}
            onPress={() => onSelect(artist)}
          >
            <View className="h-[84px] w-[84px]">
              <View
                className="h-[84px] w-[84px] rounded-full p-[3px]"
                style={{ backgroundColor: loading ? 'transparent' : '#33D13A' }}
              >
                <View
                  className="h-full w-full items-center justify-center overflow-hidden rounded-full bg-surface-alt"
                  style={{ opacity: loading ? 0.45 : 1 }}
                >
                  <Text className="text-center text-2xs text-text-dim">artista</Text>
                </View>
              </View>

              {loading ? <LoadingRing /> : null}
            </View>

            <Text className="mt-1.5 text-xs font-medium text-text-soft" numberOfLines={1}>
              {artist.shortName}
            </Text>
          </Touchable>
        );
      })}
    </ScrollView>
  );
}

/** Gradient arc drawn over an avatar while its profile loads. */
function LoadingRing() {
  return (
    <View className="absolute left-0 top-0">
      <Svg fill="none" height={84} viewBox="0 0 84 84" width={84}>
        <Defs>
          <LinearGradient id="budd-arc" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0%" stopColor="#35E85A" />
            <Stop offset="70%" stopColor="#176B2A" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#176B2A" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Circle cx={42} cy={42} r={40.5} stroke="#176B2A" strokeOpacity={0.35} strokeWidth={3} />
        <Circle
          cx={42}
          cy={42}
          r={40.5}
          stroke="url(#budd-arc)"
          strokeDasharray="190 65"
          strokeLinecap="round"
          strokeWidth={3}
        />
      </Svg>
    </View>
  );
}
