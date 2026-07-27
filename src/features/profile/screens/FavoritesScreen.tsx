import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { EmptyState, ErrorState, SkeletonList } from '@/components/feedback';
import { Screen, ScreenHeader } from '@/components/layout';
import { IconButton } from '@/components/ui';
import { EmptyHeartIcon, HeartIcon } from '@/components/ui/icons';
import { ROUTES } from '@/constants/routes';
import { BarCard } from '@/features/bars';
import { useFavoriteBars } from '@/features/bars/hooks/useBars';
import { useFavoritesStore } from '@/store/favoritesStore';
import { colors } from '@/theme';

/**
 * The user's saved venues.
 *
 * Renders the same `BarCard` as the ROLÊ feed rather than a second card built
 * from the same parts. The screen only adds the remove control; keeping one
 * component means a venue reads identically wherever it is listed, and the
 * name no longer truncates on a single line here while wrapping there.
 */
export function FavoritesScreen() {
  const router = useRouter();
  const { data: bars, status, error, reload } = useFavoriteBars();
  const removeFavorite = useFavoritesStore((state) => state.remove);

  return (
    <Screen contentClassName="pb-10" scroll>
      <ScreenHeader backFallbackHref="/profile" title="Bares favoritos" />

      <View className="gap-3.5 px-4.5 pt-1.5">
        {status === 'loading' ? (
          <SkeletonList count={2} />
        ) : null}

        {status === 'error' ? (
          <ErrorState className="py-20" description={error?.message} onRetry={reload} />
        ) : null}

        {status === 'success' && bars?.length === 0 ? (
          <EmptyState
            actionLabel="Explorar bares"
            className="py-20"
            description="Toque no coração de um bar para salvá-lo aqui e acessar rápido."
            icon={<EmptyHeartIcon color="#3A3A3A" size={88} />}
            onAction={() => router.push(ROUTES.role)}
            title="Nenhum bar favorito ainda"
          />
        ) : null}

        {status === 'success'
          ? bars?.map((bar) => (
              <BarCard
                action={
                  <IconButton
                    accessibilityLabel={`Remover ${bar.name} dos favoritos`}
                    onPress={() => removeFavorite(bar.id)}
                    size={34}
                  >
                    <HeartIcon color={colors.primary} filled size={18} />
                  </IconButton>
                }
                bar={bar}
                key={bar.id}
                onPress={() => router.push(ROUTES.bar(bar.id))}
              />
            ))
          : null}
      </View>
    </Screen>
  );
}
