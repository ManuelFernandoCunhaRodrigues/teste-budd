import { Modal, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, GradientImage } from '@/components/ui';
import type { Artist } from '@/types/domain';

export interface ArtistSheetProps {
  artist: Artist | null;
  onClose: () => void;
}

/** Bottom sheet showing an artist's cover art and stats. */
export function ArtistSheet({ artist, onClose }: ArtistSheetProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const maxSheetHeight = Math.max(360, height - insets.top - 24);
  const artworkMaxHeight = Math.min(270, height * 0.32);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={artist !== null}>
      <View className="flex-1 justify-end bg-black/55">
        <View
          className="rounded-t-3xl bg-surface-sheet px-5 pt-5.5"
          style={{ maxHeight: maxSheetHeight }}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {artist ? (
              <>
                <GradientImage
                  className="mx-auto mb-4 w-full max-w-[270px] overflow-hidden rounded-xl"
                  style={{ aspectRatio: 1, maxHeight: artworkMaxHeight }}
                  token="blue"
                />

                <View className="items-center">
                  <Text
                    accessibilityRole="header"
                    className="text-center text-7xl font-extrabold text-text"
                    numberOfLines={3}
                  >
                    {artist.name}
                  </Text>
                  <Text className="mt-1 text-2xl font-semibold text-primary">
                    {artist.albums} albuns
                  </Text>
                </View>

                <View className="mt-5 flex-row gap-3.5">
                  <GradientImage className="flex-1 rounded-xl" style={{ aspectRatio: 1 }} token="neutral" />
                  <GradientImage className="flex-1 rounded-xl" style={{ aspectRatio: 1 }} token="neutral" />
                </View>
              </>
            ) : null}
          </ScrollView>

          <View className="border-t border-border-subtle pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            <Button
              className="rounded-pill"
              fullWidth
              label="Fechar"
              onPress={onClose}
              size="lg"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
