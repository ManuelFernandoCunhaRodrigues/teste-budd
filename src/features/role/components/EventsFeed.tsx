import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { EmptyState, ErrorState } from '@/components/feedback';
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

/** Event tab of the ROLÊ feed: filter chips plus the matching event list. */
export function EventsFeed() {
  const router = useRouter();
  const [filterId, setFilterId] = useState<EventFilterId>('all');
  const { data: events, status, error, reload } = useFeedEvents();

  // "Perto de mim" is the only filter that needs a fix; the rest never wait on it.
  const location = useUserLocation();

  const visibleEvents = useMemo(() => {
    if (!events) return [];

    return filterEvents(events, [filterId], {
      userCoordinate: location.isPrecise ? location.coordinate : null,
    });
  }, [events, filterId, location.isPrecise, location.coordinate]);

  const openEvent = (id: string) => router.push(ROUTES.event(id));

  const needsLocation = !canApplyFilter(filterId, {
    userCoordinate: location.isPrecise ? location.coordinate : null,
  });

  const isFiltered = filterId !== 'all';

  return (
    <View>
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

      <View className="gap-3.5 px-4 pb-2 pt-2">
        {status === 'loading' ? (
          <>
            <Skeleton className="h-[140px] rounded-xl" />
            <Skeleton className="h-[140px] rounded-xl" />
          </>
        ) : null}

        {status === 'error' ? (
          <ErrorState className="py-16" description={error?.message} onRetry={reload} />
        ) : null}

        {/* The filter is selected but cannot be evaluated. Saying so beats
            silently returning a list that ignores distance. */}
        {status === 'success' && needsLocation ? (
          <View className="rounded-xl border border-border bg-surface p-4">
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

        {status === 'success' && !needsLocation && visibleEvents.length === 0 ? (
          <EmptyState
            actionLabel={isFiltered ? 'Limpar filtros' : undefined}
            className="py-16"
            description="Nenhum evento encontrado com estes filtros."
            icon={<StarOutlineIcon color={colors.surfaceMuted} size={72} />}
            onAction={isFiltered ? () => setFilterId('all') : undefined}
            title="Nenhum evento por aqui"
          />
        ) : null}

        {status === 'success' && !needsLocation
          ? visibleEvents.map((event) => (
              <EventCard
                event={event}
                key={event.id}
                onBuy={() => openEvent(event.id)}
                onPress={() => openEvent(event.id)}
              />
            ))
          : null}
      </View>
    </View>
  );
}
