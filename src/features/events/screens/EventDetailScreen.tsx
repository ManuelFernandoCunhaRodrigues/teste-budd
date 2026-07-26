import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/navigation/BackButton';
import { ErrorState, LoadingState } from '@/components/feedback';
import { Badge, Button, GradientImage } from '@/components/ui';
import { CalendarIcon, MapPinIcon, TicketIcon } from '@/components/ui/icons';
import {
  buildMenuCategories,
  FEATURED_CATEGORY_ID,
  filterMenuSections,
} from '@/domain/catalog/menuFilters';
import { CatalogVenueProvider, CategoryChips, FeaturedGrid, MenuSectionList } from '@/features/catalog';
import { fetchHostBarForEvent } from '@/features/bars/services/barService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { availabilityMessage } from '@/services/tickets/ticketService';
import { colors } from '@/theme';

import { EventMiniMap } from '../components/EventMiniMap';
import { PriceLabel } from '../components/PriceLabel';
import { TicketSheet } from '../components/TicketSheet';
import { useEvent } from '../hooks/useEvents';
import { useTicketPurchase } from '../hooks/useTicketPurchase';

export interface EventDetailScreenProps {
  eventId: string;
}

/** Event detail: artwork, schedule, description, venue map and the bar menu. */
export function EventDetailScreen({ eventId }: EventDetailScreenProps) {
  const { data: event, status, error, reload } = useEvent(eventId);
  const [categoryId, setCategoryId] = useState<string>(FEATURED_CATEGORY_ID);
  const [ticketsVisible, setTicketsVisible] = useState(false);

  const tickets = useTicketPurchase(eventId);

  /**
   * The venue whose menu may be shown alongside the event.
   *
   * Resolved through the venue service, and only when it is unambiguous. This
   * keeps real event payloads from being mixed with local seed bars.
   */
  const { data: hostVenue } = useAsyncData(
    () => fetchHostBarForEvent(eventId),
    `event-host:${eventId}`,
  );

  if (status === 'loading' || status === 'idle') {
    return <LoadingState description="Buscando os melhores lugares…" title="Carregando rolês" />;
  }

  if (status === 'error' || !event) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <ErrorState description={error?.message} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const unavailableReason = tickets.availability
    ? availabilityMessage(tickets.availability)
    : null;
  const canBuy = tickets.stage !== 'loading' && !unavailableReason;

  return (
    <View className="flex-1 bg-bg">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <GradientImage className="h-[230px]" token={event.image}>
          <View className="absolute left-4 top-4 z-10">
            <BackButton accessibilityHint="Voltar para os rolês" fallbackHref="/role" variant="overlay" />
          </View>
          <Badge className="absolute bottom-3.5 left-4" label="Evento" />
        </GradientImage>

        <View className="px-5 pt-5.5">
          <Text accessibilityRole="header" className="text-6xl font-black leading-tight text-text">
            {event.name}
          </Text>

          <View className="mt-4 flex-row items-center gap-2.5">
            <CalendarIcon color={colors.primary} size={16} />
            <Text className="text-lg font-bold text-primary">{event.date}</Text>
          </View>

          <View className="mt-2.5 flex-row items-center gap-2.5">
            <MapPinIcon color={colors.textMuted} size={16} />
            <Text className="flex-1 text-md text-text-muted">{event.location}</Text>
          </View>

          <View className="mt-5 flex-row gap-3">
            <View className="flex-1 rounded-lg border border-border bg-surface p-3.5">
              <Text className="text-sm text-text-muted">Entrada</Text>
              <View className="mt-1">
                <PriceLabel price={event.price} />
              </View>
            </View>
            <View className="flex-1 rounded-lg border border-border bg-surface p-3.5">
              <Text className="text-sm text-text-muted">Horário</Text>
              <Text className="mt-1 text-xl font-extrabold text-text">{event.time}</Text>
            </View>
          </View>

          <Text accessibilityRole="header" className="mt-6 text-2xl font-extrabold text-text">
            Sobre o evento
          </Text>
          <Text className="mt-2 text-md leading-6 text-text-soft">{event.about}</Text>

          {event.coordinate ? (
            <>
              <Text accessibilityRole="header" className="mt-6.5 text-2xl font-extrabold text-text">
                Local
              </Text>
              <EventMiniMap coordinate={event.coordinate} locationLabel={event.location} />
            </>
          ) : null}
        </View>

        {/* Only rendered when the host venue is unambiguous, so anything added
            here is credited to the bar that actually sells it. */}
        {hostVenue ? (
          <CatalogVenueProvider venue={{ id: hostVenue.id, name: hostVenue.name }}>
            <View className="pt-6">
              <CategoryChips
                categories={buildMenuCategories(hostVenue.sections)}
                contentClassName="px-5 gap-2.5"
                onSelect={setCategoryId}
                selectedId={categoryId}
              />
            </View>

            {categoryId === FEATURED_CATEGORY_ID ? (
              <View className="px-5 pt-4">
                <Text
                  accessibilityRole="header"
                  className="mb-3.5 text-3xl font-extrabold text-text"
                >
                  Menu · {hostVenue.name}
                </Text>
                <FeaturedGrid products={hostVenue.featured} />
              </View>
            ) : null}

            <View className="px-5 pb-6">
              <MenuSectionList sections={filterMenuSections(hostVenue.sections, categoryId)} />
            </View>
          </CatalogVenueProvider>
        ) : null}
      </ScrollView>

      <SafeAreaView edges={['bottom']}>
        <View className="border-t border-surface-raised bg-[#0A0A0A] px-4.5 py-3.5">
          {/* Disabled with an explanation instead of failing after the tap. */}
          {unavailableReason ? (
            <Text className="pb-2.5 text-center text-sm text-text-muted">{unavailableReason}</Text>
          ) : null}

          <Button
            disabled={!canBuy}
            fullWidth
            label={tickets.stage === 'loading' ? 'Verificando ingressos…' : 'Comprar ingresso'}
            leading={<TicketIcon color={colors.background} size={20} />}
            onPress={() => setTicketsVisible(true)}
            size="lg"
          />
        </View>
      </SafeAreaView>

      <TicketSheet
        controller={tickets}
        eventName={event.name}
        onClose={() => setTicketsVisible(false)}
        visible={ticketsVisible}
      />
    </View>
  );
}
