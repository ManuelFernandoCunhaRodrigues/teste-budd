import { View } from 'react-native';

import { BackButton } from '@/components/navigation/BackButton';
import { GradientImage, IconButton } from '@/components/ui';
import { HeartIcon } from '@/components/ui/icons';
import { colors } from '@/theme';
import type { GradientToken } from '@/theme/gradients';

export interface BarCoverProps {
  image: GradientToken;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  barName: string;
}

/** Venue cover artwork with the floating back and favourite controls. */
export function BarCover({ image, isFavorite, onToggleFavorite, barName }: BarCoverProps) {
  return (
    <GradientImage className="h-[158px]" token={image}>
      <View className="absolute left-4 top-4 z-10">
        <BackButton accessibilityHint="Voltar para a lista de bares" fallbackHref="/role" variant="overlay" />
      </View>

      <View className="absolute right-4 top-4 z-10">
        <IconButton
          accessibilityLabel={
            isFavorite ? `Remover ${barName} dos favoritos` : `Adicionar ${barName} aos favoritos`
          }
          accessibilityState={{ selected: isFavorite }}
          onPress={onToggleFavorite}
          variant="overlay"
        >
          <HeartIcon color={isFavorite ? colors.primary : colors.text} filled={isFavorite} size={20} />
        </IconButton>
      </View>
    </GradientImage>
  );
}
