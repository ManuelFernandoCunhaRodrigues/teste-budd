import { Modal, Text, View } from 'react-native';

import { Button, GradientImage } from '@/components/ui';
import type { Artist } from '@/types/domain';

export interface ArtistSheetProps {
  artist: Artist | null;
  onClose: () => void;
}

/** Bottom sheet showing an artist's cover art and stats. */
export function ArtistSheet({ artist, onClose }: ArtistSheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={artist !== null}>
      <View className="flex-1 justify-end bg-black/55">
        <View className="rounded-t-3xl bg-surface-sheet px-5 pb-6 pt-5.5">
          {artist ? (
            <>
              <GradientImage
                className="mx-auto mb-4 h-[270px] w-full max-w-[270px] rounded-xl"
                token="blue"
              />

              <View className="items-center">
                <Text accessibilityRole="header" className="text-7xl font-extrabold text-text">
                  {artist.name}
                </Text>
                <Text className="mt-1 text-2xl font-semibold text-primary">
                  {artist.albums} álbuns
                </Text>
              </View>

              <View className="mt-5 flex-row gap-3.5">
                <GradientImage className="h-[150px] flex-1 rounded-xl" token="neutral" />
                <GradientImage className="h-[150px] flex-1 rounded-xl" token="neutral" />
              </View>
            </>
          ) : null}

          <Button
            className="mt-5.5 rounded-pill"
            fullWidth
            label="Fechar"
            onPress={onClose}
            size="lg"
          />
        </View>
      </View>
    </Modal>
  );
}
