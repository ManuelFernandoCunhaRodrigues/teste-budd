import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { EmptyState, ErrorState } from '@/components/feedback';
import { Screen, ScreenHeader } from '@/components/layout';
import { Card, GradientImage, IconButton, RatingLabel, Skeleton, Touchable } from '@/components/ui';
import { EmptyHeartIcon, HeartIcon } from '@/components/ui/icons';
import { ROUTES } from '@/constants/routes';
import { useFavoriteBars } from '@/features/bars/hooks/useBars';
import { useFavoritesStore } from '@/store/favoritesStore';
import { colors } from '@/theme';

/** The user's saved venues. */
export function FavoritesScreen() {
  const router = useRouter();
  const { data: bars, status, error, reload } = useFavoriteBars();
  const removeFavorite = useFavoritesStore((state) => state.remove);

  return (
    <Screen contentClassName="pb-10" scroll>
      <ScreenHeader backFallbackHref="/profile" title="Bares favoritos" />

      <View className="gap-3.5 px-4.5 pt-1.5">
        {status === 'loading' ? (
          <>
            <Skeleton className="h-[112px] rounded-xl" />
            <Skeleton className="h-[112px] rounded-xl" />
          </>
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
              <Card className="min-h-[112px] flex-row" key={bar.id}>
                <Touchable
                  accessibilityLabel={`Abrir ${bar.name}`}
                  accessibilityRole="button"
                  className="w-[34%]"
                  feedback="card"
                  onPress={() => router.push(ROUTES.bar(bar.id))}
                >
                  <GradientImage className="h-full w-full" token={bar.image} />
                </Touchable>

                <View className="relative min-w-0 flex-1 justify-center py-3.5 pl-4 pr-3.5">
                  <Touchable
                    accessibilityLabel={`${bar.name}, ${bar.category}`}
                    accessibilityRole="button"
                    feedback="none"
                    onPress={() => router.push(ROUTES.bar(bar.id))}
                  >
                    <Text
                      className="pr-9 text-lg font-extrabold leading-tight text-text"
                      numberOfLines={1}
                    >
                      {bar.name}
                    </Text>
                    <Text className="mt-1 text-sm text-text-muted" numberOfLines={1}>
                      {bar.category}
                    </Text>
                    <View className="mt-2 flex-row items-center gap-2">
                      <RatingLabel rating={bar.rating} />
                      <Text className="text-text-ghost">•</Text>
                      <Text className="text-sm text-text-muted">{bar.distance}</Text>
                    </View>
                  </Touchable>

                  <IconButton
                    accessibilityLabel={`Remover ${bar.name} dos favoritos`}
                    className="absolute right-3 top-3"
                    onPress={() => removeFavorite(bar.id)}
                    size={34}
                  >
                    <HeartIcon color={colors.primary} filled size={18} />
                  </IconButton>
                </View>
              </Card>
            ))
          : null}
      </View>
    </Screen>
  );
}
