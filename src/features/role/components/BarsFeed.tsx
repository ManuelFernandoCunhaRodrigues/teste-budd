import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';

import { EmptyState, ErrorState } from '@/components/feedback';
import { useTabBarContentInset } from '@/components/navigation';
import { Skeleton } from '@/components/ui';
import { EmptyHeartIcon } from '@/components/ui/icons';
import { ROUTES } from '@/constants/routes';
import { BarCard } from '@/features/bars';
import { useBars } from '@/features/bars/hooks/useBars';
import { colors } from '@/theme';
import type { Bar } from '@/types/domain';

import { SearchField } from './SearchField';

export interface BarsFeedProps {
  /** Rendered above the search field — the feed's tab switcher. */
  header?: React.ReactNode;
}

/**
 * Venue tab of the ROLÊ feed: search plus the matching venue list.
 *
 * Virtualised. This used to be `bars.map()` inside a `View` nested in the
 * screen's `ScrollView`, so every card mounted at once and none were ever
 * recycled (M-01). The list now owns the scroll and the screen no longer wraps
 * it — nesting a `FlatList` inside a `ScrollView` would break virtualisation and
 * warn at runtime.
 */
export function BarsFeed({ header }: BarsFeedProps) {
  const router = useRouter();
  const tabBarInset = useTabBarContentInset();
  const [query, setQuery] = useState('');
  const { data: bars, status, error, reload } = useBars(query);

  const renderItem = useCallback(
    ({ item }: { item: Bar }) => (
      <BarCard bar={item} onPress={() => router.push(ROUTES.bar(item.id))} />
    ),
    [router],
  );

  const keyExtractor = useCallback((item: Bar) => item.id, []);

  return (
    <FlatList
      ListEmptyComponent={
        <View className="gap-3.5 px-4 pt-2">
          {status === 'loading' ? (
            <>
              <Skeleton className="h-[132px] rounded-xl" />
              <Skeleton className="h-[132px] rounded-xl" />
              <Skeleton className="h-[132px] rounded-xl" />
            </>
          ) : null}

          {status === 'error' ? (
            <ErrorState className="py-16" description={error?.message} onRetry={reload} />
          ) : null}

          {status === 'success' ? (
            <EmptyState
              className="py-16"
              description="Tente buscar por outro nome ou categoria."
              icon={<EmptyHeartIcon color={colors.surfaceMuted} size={72} />}
              title="Nenhum bar encontrado"
            />
          ) : null}
        </View>
      }
      ListHeaderComponent={
        <>
          {header}
          <View className="px-4.5 pb-0.5 pt-2.5">
            <SearchField onChangeText={setQuery} value={query} />
          </View>
        </>
      }
      contentContainerClassName="gap-3.5 px-4 pb-2 pt-2"
      contentContainerStyle={{ paddingBottom: tabBarInset }}
      data={status === 'success' ? bars : []}
      // Keeps the search field usable without an extra dismiss tap.
      keyboardShouldPersistTaps="handled"
      keyExtractor={keyExtractor}
      // The header holds a text input, so the keyboard must not be pulled down
      // mid-typing by the list's own scroll handling.
      keyboardDismissMode="none"
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      // Roughly one screenful; the rest mounts as the user scrolls.
      initialNumToRender={5}
      windowSize={7}
      removeClippedSubviews
    />
  );
}
