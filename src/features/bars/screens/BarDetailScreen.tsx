import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingState } from '@/components/feedback';
import { ROUTES } from '@/constants/routes';
import {
  buildMenuCategories,
  FEATURED_CATEGORY_ID,
  filterMenuSections,
} from '@/domain/catalog/menuFilters';
import { CatalogVenueProvider, CategoryChips, FeaturedGrid, MenuSectionList } from '@/features/catalog';
import { fetchEventsByIds } from '@/features/events/services/eventService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { selectCartCount, selectCartSubtotalInCents, useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import type { Event } from '@/types/domain';

import { BarCover } from '../components/BarCover';
import { BarInfoCard } from '../components/BarInfoCard';
import { CartBar } from '../components/CartBar';
import { CouponsRow } from '../components/CouponsRow';
import { ReviewsSheet } from '../components/ReviewsSheet';
import { VenueEventsCarousel } from '../components/VenueEventsCarousel';
import { useBar } from '../hooks/useBars';

export interface BarDetailScreenProps {
  barId: string;
}

/** Venue detail: cover, summary, coupons, in-house events and the full menu. */
export function BarDetailScreen({ barId }: BarDetailScreenProps) {
  const router = useRouter();
  const { data: bar, status, error, reload } = useBar(barId);
  const eventIdsKey = bar?.eventIds.join(',') ?? '';
  const { data: venueEvents, status: venueEventsStatus } = useAsyncData<Event[]>(
    () => (bar ? fetchEventsByIds(bar.eventIds) : Promise.resolve([])),
    `bar-events:${bar?.id ?? 'pending'}:${eventIdsKey}`,
  );

  const [categoryId, setCategoryId] = useState<string>(FEATURED_CATEGORY_ID);
  const [reviewsVisible, setReviewsVisible] = useState(false);

  const favoriteIds = useFavoritesStore((state) => state.barIds);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);

  const cartCount = useCartStore(selectCartCount);
  const cartSubtotalInCents = useCartStore(selectCartSubtotalInCents);

  const categories = useMemo(() => (bar ? buildMenuCategories(bar.sections) : []), [bar]);

  // The chips used to change colour and nothing else — this is what makes the
  // selection actually narrow the menu (A-04).
  const visibleSections = useMemo(
    () => (bar ? filterMenuSections(bar.sections, categoryId) : []),
    [bar, categoryId],
  );

  const showFeatured = categoryId === FEATURED_CATEGORY_ID;

  if (status === 'loading' || status === 'idle') {
    return <LoadingState description="Buscando os melhores lugares…" title="Carregando rolês" />;
  }

  if (status === 'error' || !bar) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <ErrorState description={error?.message} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const openEvent = (event: Event) => router.push(ROUTES.event(event.id));

  return (
    // Everything below sells on behalf of this venue, so the id and name travel
    // with each add instead of the cart store guessing an origin.
    <CatalogVenueProvider venue={{ id: bar.id, name: bar.name }}>
    <View className="flex-1 bg-bg">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <BarCover
          barName={bar.name}
          image={bar.image}
          isFavorite={favoriteIds.includes(bar.id)}
          onToggleFavorite={() => toggleFavorite(bar.id)}
        />

        <BarInfoCard bar={bar} onOpenReviews={() => setReviewsVisible(true)} />

        <View className="pt-4">
          <CouponsRow coupons={bar.coupons} />
        </View>

        <View className="pt-4.5">
          <Text
            accessibilityRole="header"
            className="mb-3 px-4 text-3xl font-extrabold text-text"
          >
            Eventos no local
          </Text>
          {venueEventsStatus === 'error' ? (
            <Text className="px-4 text-sm text-text-muted">
              Eventos do local indisponiveis no momento.
            </Text>
          ) : (
            <VenueEventsCarousel events={venueEvents ?? []} onSelect={openEvent} />
          )}
        </View>

        <View className="pt-3.5">
          <CategoryChips
            categories={categories}
            onSelect={setCategoryId}
            selectedId={categoryId}
          />
        </View>

        {showFeatured ? (
          <View className="px-4 pb-1.5 pt-4">
            <Text accessibilityRole="header" className="mb-3.5 text-3xl font-extrabold text-text">
              Destaques
            </Text>
            <FeaturedGrid products={bar.featured} />
          </View>
        ) : null}

        <View className="px-4 pb-10">
          {visibleSections.length > 0 ? (
            <MenuSectionList sections={visibleSections} />
          ) : (
            <EmptyState
              className="py-12"
              description="Escolha outra categoria para ver mais itens."
              muted
              title="Nenhum produto nesta categoria"
            />
          )}
        </View>
      </ScrollView>

      {cartCount > 0 ? (
        <SafeAreaView edges={['bottom']}>
          <CartBar
            itemCount={cartCount}
            onPress={() => router.push('/products')}
            subtotalInCents={cartSubtotalInCents}
          />
        </SafeAreaView>
      ) : null}

      <ReviewsSheet bar={bar} onClose={() => setReviewsVisible(false)} visible={reviewsVisible} />
    </View>
    </CatalogVenueProvider>
  );
}
