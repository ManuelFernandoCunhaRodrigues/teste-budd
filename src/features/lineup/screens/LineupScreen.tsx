import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/layout';
import { useTabBarContentInset } from '@/components/navigation';
import { ARTISTS } from '@/mocks/artists';
import { loadingDelay } from '@/theme';
import type { Artist } from '@/types/domain';

import { ArtistCard } from '../components/ArtistCard';
import { ArtistRail } from '../components/ArtistRail';
import { ArtistSheet } from '../components/ArtistSheet';

/** Artist line-up: an avatar rail above a two-column card grid. */
export function LineupScreen() {
  const tabBarInset = useTabBarContentInset();
  const [loadingArtistId, setLoadingArtistId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Artist | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Opening an artist shows a brief spinner on their avatar before the sheet
  // appears, mirroring the design's fetch-then-present behaviour.
  const openArtist = useCallback((artist: Artist) => {
    setLoadingArtistId((current) => {
      if (current) return current;

      timer.current = setTimeout(() => {
        setLoadingArtistId(null);
        setSelected(artist);
      }, loadingDelay.artist);

      return artist.id;
    });
  }, []);

  const rows: Artist[][] = [];
  for (let index = 0; index < ARTISTS.length; index += 2) {
    rows.push(ARTISTS.slice(index, index + 2));
  }

  return (
    <>
      <Screen
        contentContainerStyle={{ paddingBottom: tabBarInset }}
        contentClassName="pt-3.5"
        scroll
      >
        <ArtistRail
          artists={ARTISTS}
          loadingArtistId={loadingArtistId}
          onSelect={openArtist}
        />

        <View className="gap-3.5 px-4">
          {rows.map((row) => (
            <View className="flex-row gap-3.5" key={row.map((artist) => artist.id).join('-')}>
              {row.map((artist) => (
                <ArtistCard artist={artist} key={artist.id} onPress={() => openArtist(artist)} />
              ))}
              {row.length === 1 ? <View className="flex-1" /> : null}
            </View>
          ))}
        </View>
      </Screen>

      <ArtistSheet artist={selected} onClose={() => setSelected(null)} />
    </>
  );
}
