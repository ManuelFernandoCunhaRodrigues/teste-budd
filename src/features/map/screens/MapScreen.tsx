import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Linking,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

import { LoadingState } from '@/components/feedback';
import { Screen } from '@/components/layout';
import { useTabBarContentInset } from '@/components/navigation';
import { Button, IconButton } from '@/components/ui';
import { MapPinIcon } from '@/components/ui/icons';
import { DEFAULT_REGION } from '@/constants/app';
import { ROUTES } from '@/constants/routes';
import { useDelayedFlag } from '@/hooks/useDelayedFlag';
import { PLACES } from '@/mocks/places';
import { colors, loadingDelay } from '@/theme';
import type { Coordinate, Place } from '@/types/domain';

import { carouselIndexAt, carouselOffsetFor } from '../carouselGeometry';
import { PlaceCard } from '../components/PlaceCard';
import { UserLocationMarker } from '../components/UserLocationMarker';
import { VenueMarker } from '../components/VenueMarker';
import { coordinateOrFallback, useUserLocation } from '../hooks/useUserLocation';

/**
 * Zoom applied when centring on a single point — the user or a selected venue.
 * Tighter than the city-wide default so the target is actually legible.
 */
const FOCUS_REGION_DELTA = {
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const CENTER_ANIMATION_MS = 600;

/**
 * Stands in for the carousel's height only until it reports its own.
 *
 * The recenter button sits above the cards, so it needs a height one frame
 * before `onLayout` delivers one. Every frame after the first uses the measured
 * value — this number must never be the thing keeping them from overlapping.
 */
const ESTIMATED_CAROUSEL_HEIGHT = 324;

/** Breathing room between the recenter button and the top card edge. */
const RECENTER_GAP = 12;

/** Full-bleed map with venue pins and a snap carousel of place cards. */
export function MapScreen() {
  const router = useRouter();
  const tabBarInset = useTabBarContentInset();
  const { width } = useWindowDimensions();
  const ready = useDelayedFlag(loadingDelay.map);
  const location = useUserLocation();
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState(0);

  const [carouselHeight, setCarouselHeight] = useState(0);

  const mapRef = useRef<MapView>(null);
  const carouselRef = useRef<ScrollView>(null);
  /**
   * Automatic centring happens once.
   *
   * Without this the map would snap back to the user on every GPS refinement,
   * fighting anyone who panned away — §4.2.
   */
  const hasCenteredOnUser = useRef(false);
  const isFocusedRef = useRef(true);

  const cardWidth = Math.min(width * 0.6, 236);
  const gap = 14;
  const sidePadding = (width - cardWidth) / 2;
  const carouselBottom = tabBarInset + 10;

  // Animating a map that is off-screen is wasted work and can land mid-transition.
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      return () => {
        isFocusedRef.current = false;
      };
    }, []),
  );

  const centerOn = useCallback((coordinate: Coordinate) => {
    if (!isFocusedRef.current) return;

    mapRef.current?.animateToRegion(
      { ...coordinate, ...FOCUS_REGION_DELTA },
      CENTER_ANIMATION_MS,
    );
  }, []);

  // `initialRegion` alone was the A-02 bug: it is read once at mount, so a fix
  // arriving afterwards never moved the camera.
  useEffect(() => {
    if (hasCenteredOnUser.current) return;
    if (location.status !== 'available' || !location.coordinate) return;

    hasCenteredOnUser.current = true;
    centerOn(location.coordinate);
  }, [location.status, location.coordinate, centerOn]);

  const handleRecenter = useCallback(() => {
    if (location.coordinate) {
      centerOn(location.coordinate);
      return;
    }

    // No fix yet — ask again rather than doing nothing.
    location.retry();
  }, [location, centerOn]);

  /**
   * Selects a place from the map side: highlights its card, brings it into view
   * and moves the camera onto it.
   *
   * Tapping a pin deliberately previews rather than navigates. Opening the venue
   * straight from the map gave the pin a different meaning from the card it
   * belongs to, and left no way to look at a pin without leaving the map.
   */
  const focusPlace = useCallback(
    (index: number) => {
      const place = PLACES[index];
      if (!place) return;

      setSelectedPlaceIndex(index);
      carouselRef.current?.scrollTo({
        x: carouselOffsetFor(index, cardWidth, gap),
        animated: true,
      });
      centerOn(place.coordinate);
    },
    [cardWidth, gap, centerOn],
  );

  /**
   * Selects a place from the carousel side.
   *
   * Does not scroll the carousel: the gesture that triggered this already put
   * the card where it belongs, and issuing a second scroll would fight it.
   */
  const handleCarouselScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = carouselIndexAt(
        event.nativeEvent.contentOffset.x,
        cardWidth,
        gap,
        PLACES.length,
      );

      setSelectedPlaceIndex(index);

      const place = PLACES[index];
      if (place) centerOn(place.coordinate);
    },
    [cardWidth, gap, centerOn],
  );

  if (!ready) {
    return (
      <Screen>
        <LoadingState
          description="Localizando bares perto de você…"
          title="Abrindo o mapa"
          variant="map"
        />
      </Screen>
    );
  }

  const openPlace = (place: Place) => {
    if (place.target.type === 'bar') {
      router.push(ROUTES.bar(place.target.id));
    } else {
      router.push(ROUTES.event(place.target.id));
    }
  };

  const isResolving = location.status === 'loading' || location.status === 'requesting-permission';
  const canOpenSettings = location.status === 'blocked' || location.status === 'unavailable';

  return (
    <View className="flex-1 bg-map-backdrop">
      <MapView
        // Safe starting frame; the camera moves once a real fix lands.
        initialRegion={DEFAULT_REGION}
        provider={PROVIDER_DEFAULT}
        ref={mapRef}
        showsMyLocationButton={false}
        style={{ flex: 1 }}
        toolbarEnabled={false}
      >
        {PLACES.map((place, index) => (
          <Marker
            accessibilityLabel={`${place.name}. Mostrar no carrossel`}
            anchor={{ x: 0.5, y: 1 }}
            coordinate={place.coordinate}
            key={place.id}
            onPress={() => focusPlace(index)}
            // No `title`: it opens the platform's own info window, which would
            // preview the same venue as the card in a second, conflicting style.
            tracksViewChanges={false}
            // Selection is shown by raising the pin, not by restyling it:
            // `tracksViewChanges={false}` freezes each marker's bitmap after the
            // first render, so a new look would never reach the map. `zIndex` is
            // a native prop and applies without redrawing the view.
            zIndex={index === selectedPlaceIndex ? 5 : 1}
          >
            <VenueMarker />
          </Marker>
        ))}

        {/* Only drawn once a real fix exists — otherwise the dot would claim
            city-centre accuracy the app does not have. */}
        {location.isPrecise && location.coordinate ? (
          <Marker
            anchor={{ x: 0.5, y: 0.5 }}
            coordinate={coordinateOrFallback(location.coordinate)}
            tracksViewChanges={false}
            zIndex={10}
          >
            <UserLocationMarker />
          </Marker>
        ) : null}
      </MapView>

      {/* Status banner. Never an empty screen: the map keeps working on the
          default region while this explains what is missing. */}
      {location.message || location.isSlow ? (
        <View
          accessibilityLiveRegion="polite"
          className="absolute left-4 right-4 rounded-xl border border-border bg-surface/95 p-3.5"
          style={{ top: 12 }}
        >
          <Text className="text-sm leading-5 text-text-soft">
            {location.isSlow && isResolving
              ? 'Sua localização está demorando mais que o esperado.'
              : location.message}
          </Text>

          <View className="mt-2.5 flex-row gap-2">
            <Button
              label="Tentar novamente"
              onPress={location.retry}
              size="sm"
              variant="outline"
            />
            {canOpenSettings ? (
              <Button
                label="Abrir configurações"
                onPress={() => {
                  void Linking.openSettings();
                }}
                size="sm"
                variant="ghost"
              />
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Sits above the carousel and clear of the tab bar, on the carousel's
          measured height rather than a guess at how tall a card turns out. */}
      <View
        className="absolute right-4"
        style={{
          bottom:
            carouselBottom +
            (carouselHeight || ESTIMATED_CAROUSEL_HEIGHT) +
            RECENTER_GAP,
        }}
      >
        <IconButton
          accessibilityHint="Centraliza o mapa na sua posição atual"
          accessibilityLabel="Minha localização"
          accessibilityState={{ disabled: isResolving, busy: isResolving }}
          disabled={isResolving}
          onPress={handleRecenter}
          variant="tint"
        >
          <MapPinIcon color={isResolving ? colors.textDim : colors.primary} size={20} />
        </IconButton>
      </View>

      <View
        className="absolute left-0 right-0"
        onLayout={(event) => setCarouselHeight(event.nativeEvent.layout.height)}
        style={{ bottom: carouselBottom }}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: sidePadding }}
          decelerationRate="fast"
          horizontal
          onMomentumScrollEnd={handleCarouselScrollEnd}
          ref={carouselRef}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={cardWidth + gap}
        >
          {PLACES.map((place, index) => (
            <View
              key={place.id}
              style={{
                width: cardWidth,
                marginRight: index === PLACES.length - 1 ? 0 : gap,
              }}
            >
              <PlaceCard
                onPress={() => openPlace(place)}
                place={place}
                selected={index === selectedPlaceIndex}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
