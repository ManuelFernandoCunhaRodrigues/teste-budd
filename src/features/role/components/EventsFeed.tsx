import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';

import { EmptyState, ErrorState } from '@/components/feedback';
import { useTabBarContentInset } from '@/components/navigation';
import { Button, Chip, Skeleton } from '@/components/ui';
import { StarOutlineIcon } from '@/components/ui/icons';
import { ROUTES } from '@/constants/routes';
import {
  canApplyFilter,
  EVENT_FILTER_OPTIONS,
  filterEvents,
  type EventFilterId,
} from '@/domain/events/eventFilters';
import { EventCard } from '@/features/events';
import { useFeedEvents } from '@/features/events/hooks/useEvents';
import { useUserLocation } from '@/features/map/hooks/useUserLocation';
import { colors } from '@/theme';
import type { Event } from '@/types/domain';

export interface EventsFeedProps {
  /** Rendered above the filter chips — the feed's tab switcher. */
  header?: React.ReactNode;
}

/**
 * Event tab of the ROLÊ feed: filter chips plus the matching event list.
 *
 * Virtualised for the same reason as `BarsFeed` (M-01): the list owns the vertical
 * scroll, so cards mount as they approach the viewport. The horizontal chip strip
 * stays a `ScrollView` — nesting is only a problem when both scroll the same axis.
 */
export function EventsFeed({ header }: EventsFeedProps) {
  const router = useRouter();
  const tabBarInset = useTabBarContentInset();
  const [filterId, setFilterId] = useState<EventFilterId>('all');
  const { data: events, status, error, reload } = useFeedEvents();

  // "Perto de mim" is the only filter that needs a fix; the rest never wait on it.
  const location = useUserLocation();

  const userCoordinate = location.isPrecise ? location.coordinate : null;

  const visibleEvents = useMemo(
    () => (events ? filterEvents(events, [filterId], { userCoordinate }) : []),
    [events, filterId, userCoordinate],
  );

  const needsLocation = !canApplyFilter(filterId, { userCoordinate });
  const isFiltered = filterId !== 'all';

  const renderItem = useCallback(
    ({ item }: { item: Event }) => (
      <EventCard
        event={item}
        onBuy={() => router.push(ROUTES.event(item.id))}
        onPress={() => router.push(ROUTES.event(item.id))}
      />
    ),
    [router],
  );

  const keyExtractor = useCallback((item: Event) => item.id, []);

  return (
    <FlatList
      ListEmptyComponent={
        <View className="gap-3.5 px-4 pt-2">
          {status === 'loading' ? (
            <>
              <Skeleton className="h-[140px] rounded-xl" />
              <Skeleton className="h-[140px] rounded-xl" />
            </>
          ) : null}

          {status === 'error' ? (
            <ErrorState className="py-16" description={error?.message} onRetry={reload} />
          ) : null}

          {status === 'success' && !needsLocation ? (
            <EmptyState
              actionLabel={isFiltered ? 'Limpar filtros' : undefined}
              className="py-16"
              description="Nenhum evento encontrado com estes filtros."
              icon={<StarOutlineIcon color={colors.surfaceMuted} size={72} />}
              onAction={isFiltered ? () => setFilterId('all') : undefined}
              title="Nenhum evento por aqui"
            />
          ) : null}
        </View>
      }
      ListHeaderComponent={
        <>
          {header}

          <ScrollView
            contentContainerClassName="px-4.5 gap-2.5"
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {EVENT_FILTER_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                onPress={() => setFilterId(option.id)}
                selected={filterId === option.id}
              />
            ))}
          </ScrollView>

          {/* The filter is selected but cannot be evaluated. Saying so beats
              silently returning a list that ignores distance. */}
          {status === 'success' && needsLocation ? (
            <View className="mx-4 mt-2 rounded-xl border border-border bg-surface p-4">
              <Text className="text-md font-bold text-text-soft">
                Precisamos da sua localização
              </Text>
              <Text className="mt-1 text-sm leading-5 text-text-muted">
                Para mostrar eventos perto de você, permita o acesso à localização.
              </Text>
              <View className="mt-3 flex-row gap-2">
                <Button label="Permitir" onPress={location.retry} size="sm" variant="outline" />
                <Button
                  label="Ver todos"
                  onPress={() => setFilterId('all')}
                  size="sm"
                  variant="ghost"
                />
              </View>
            </View>
          ) : null}
        </>
      }
      contentContainerClassName="gap-3.5 px-4 pb-2 pt-2"
      contentContainerStyle={{ paddingBottom: tabBarInset }}
      // Emptied while the location filter cannot run, so no misleading list shows.
      data={status === 'success' && !needsLocation ? visibleEvents : []}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      initialNumToRender={5}
      windowSize={7}
      removeClippedSubviews
    />
  );
}
