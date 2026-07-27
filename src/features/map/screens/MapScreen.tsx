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

import { PlaceCard } from '../components/PlaceCard';
import { UserLocationMarker } from '../components/UserLocationMarker';
import { VenueMarker } from '../components/VenueMarker';
import { coordinateOrFallback, useUserLocation } from '../hooks/useUserLocation';

/** Zoom applied when centring on the user — tighter than the city-wide default. */
const USER_REGION_DELTA = {
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const CENTER_ANIMATION_MS = 600;

/** Full-bleed map with venue pins and a snap carousel of place cards. */
export function MapScreen() {
  const router = useRouter();
  const tabBarInset = useTabBarContentInset();
  const { width } = useWindowDimensions();
  const ready = useDelayedFlag(loadingDelay.map);
  const location = useUserLocation();
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState(0);

  const mapRef = useRef<MapView>(null);
  /**
   * Automatic centring happens once.
   *
   * Without this the map would snap back to the user on every GPS refinement,
   * fighting anyone who panned away — §4.2.
   */
  const hasCenteredOnUser = useRef(false);
  const isFocusedRef = useRef(true);

  const cardWidth = width * 0.78;
  const gap = 12;
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
      { ...coordinate, ...USER_REGION_DELTA },
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

  const handleCarouselScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + gap));
      setSelectedPlaceIndex(Math.max(0, Math.min(PLACES.length - 1, nextIndex)));
    },
    [cardWidth, gap],
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
        {PLACES.map((place) => (
          <Marker
            anchor={{ x: 0.5, y: 1 }}
            coordinate={place.coordinate}
            key={place.id}
            onPress={() => openPlace(place)}
            title={place.name}
            tracksViewChanges={false}
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

      {/* Sits above the carousel and clear of the tab bar. */}
      <View className="absolute right-4" style={{ bottom: carouselBottom + 252 }}>
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

      <View className="absolute left-0 right-0" style={{ bottom: carouselBottom }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: sidePadding, gap }}
          decelerationRate="fast"
          horizontal
          onMomentumScrollEnd={handleCarouselScrollEnd}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={cardWidth + gap}
        >
          {PLACES.map((place, index) => (
            <PlaceCard
              key={place.id}
              onPress={() => openPlace(place)}
              place={place}
              selected={index === selectedPlaceIndex}
              width={cardWidth}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
