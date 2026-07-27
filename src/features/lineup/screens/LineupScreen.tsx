import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { EmptyState } from '@/components/feedback';
import { Screen } from '@/components/layout';
import { useTabBarContentInset } from '@/components/navigation';
import { Chip, Skeleton } from '@/components/ui';
import { EmptyBoxIcon } from '@/components/ui/icons';
import { ROUTES } from '@/constants/routes';
import type { Coordinate } from '@/types/domain';

import { ArtistResultCard } from '../components/ArtistResultCard';
import { CityPickerSheet } from '../components/CityPickerSheet';
import { LineUpSearch } from '../components/LineUpSearch';
import { LocationPermissionState } from '../components/LocationPermissionState';
import { SearchModeTabs } from '../components/SearchModeTabs';
import { ShowCard } from '../components/ShowCard';
import { useLineUpSearch } from '../hooks/useLineUpSearch';
import { useLocationPermission } from '../hooks/useLocationPermission';
import { useNearbyShows } from '../hooks/useNearbyShows';
import { LINEUP_GENRES } from '../services/lineupData';
import {
  DEFAULT_LINEUP_FILTERS,
  cityLabel,
  fetchLineUpArtists,
  fetchLineUpShows,
} from '../services/lineupService';
import type { CityOption, DistanceRadiusKm, LineUpArtist, LineUpShow } from '../types';

const RADIUS_OPTIONS: DistanceRadiusKm[] = [5, 10, 25, 50];

/** How many filters differ from the defaults, for the header's badge. */
function countActiveFilters(filters: typeof DEFAULT_LINEUP_FILTERS): number {
  return (Object.keys(filters) as (keyof typeof filters)[]).filter(
    (key) => filters[key] !== DEFAULT_LINEUP_FILTERS[key],
  ).length;
}

/**
 * Show discovery: search by artist or by proximity.
 *
 * The origin used for distances is the device fix when there is one and the
 * chosen city otherwise — which is what makes a refused permission an
 * inconvenience rather than a wall.
 */
export function LineupScreen() {
  const router = useRouter();
  const tabBarInset = useTabBarContentInset();

  const [artists, setArtists] = useState<LineUpArtist[]>([]);
  const [shows, setShows] = useState<LineUpShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [city, setCity] = useState<CityOption | null>(null);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  // Not auto-requested: §13 asks for the reason to be shown before the system
  // dialog, so the first prompt is a deliberate tap rather than a surprise.
  const location = useLocationPermission(false);

  useEffect(() => {
    let active = true;

    Promise.all([fetchLineUpArtists(), fetchLineUpShows()])
      .then(([nextArtists, nextShows]) => {
        if (!active) return;
        setArtists(nextArtists);
        setShows(nextShows);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const origin: Coordinate | null = location.coordinate ?? city?.coordinate ?? null;

  const search = useLineUpSearch(artists, shows, origin);
  const nearby = useNearbyShows(shows, origin, search.filters, search.debouncedQuery);

  const locationLabel = location.coordinate
    ? 'Perto de você'
    : city
      ? cityLabel(city)
      : 'Escolher localização';

  const handleSelectCity = useCallback((next: CityOption) => {
    setCity(next);
    setCityPickerOpen(false);
  }, []);

  const handleGenre = useCallback(
    (genre: string) => search.setFilters({ ...search.filters, genre }),
    [search],
  );

  const handleRadius = useCallback(
    (radiusKm: DistanceRadiusKm) => search.setFilters({ ...search.filters, radiusKm }),
    [search],
  );

  const header = useMemo(
    () => (
      <View>
        <LineUpSearch
          activeFilterCount={countActiveFilters(search.filters)}
          locationLabel={locationLabel}
          onChangeQuery={search.setQuery}
          onChooseCity={() => setCityPickerOpen(true)}
          onClearQuery={search.clearQuery}
          onOpenFilters={() => setCityPickerOpen(true)}
          query={search.query}
        />

        <SearchModeTabs mode={search.mode} onChange={search.setMode} />

        {search.mode === 'nearby' ? (
          <>
            <LocationPermissionState
              location={location}
              onChooseCity={() => setCityPickerOpen(true)}
            />

            <View accessibilityRole="radiogroup" className="flex-row gap-2 px-4.5 pt-3">
              {RADIUS_OPTIONS.map((radius) => (
                <Chip
                  className="flex-1"
                  key={radius}
                  label={`${radius} km`}
                  onPress={() => handleRadius(radius)}
                  selected={search.filters.radiusKm === radius}
                />
              ))}
            </View>
          </>
        ) : null}

        <FlatList
          className="mt-3"
          contentContainerClassName="gap-2 px-4.5"
          data={LINEUP_GENRES}
          horizontal
          keyExtractor={(genre) => genre}
          renderItem={({ item }) => (
            <Chip
              label={item}
              onPress={() => handleGenre(item)}
              selected={search.filters.genre === item}
            />
          )}
          showsHorizontalScrollIndicator={false}
        />

        {search.isSearching ? (
          <Text accessibilityLiveRegion="polite" className="px-4.5 pt-3 text-sm text-text-dim">
            Buscando…
          </Text>
        ) : null}
      </View>
    ),
    [handleGenre, handleRadius, location, locationLabel, search],
  );

  if (isLoading) {
    return (
      <Screen>
        <View className="gap-3.5 px-4.5 pt-6">
          <Skeleton className="h-[92px] rounded-xl" />
          <Skeleton className="h-[132px] rounded-xl" />
          <Skeleton className="h-[132px] rounded-xl" />
        </View>
      </Screen>
    );
  }

  const empty = (
    <EmptyState
      className="py-16"
      description="Tente buscar outro artista, aumentar a distância ou alterar os filtros."
      icon={<EmptyBoxIcon color="#3A3A3A" size={96} />}
      title="Nenhum show encontrado"
    />
  );

  return (
    <Screen>
      {search.mode === 'artists' ? (
        <FlatList
          ListEmptyComponent={empty}
          ListHeaderComponent={header}
          contentContainerClassName="gap-3.5"
          contentContainerStyle={{ paddingBottom: tabBarInset }}
          data={search.filteredArtists}
          keyExtractor={(artist) => artist.id}
          renderItem={({ item }) => (
            <View className="px-4.5">
              <ArtistResultCard
                artist={item}
                onPress={() => router.push(ROUTES.artist(item.id))}
              />
            </View>
          )}
        />
      ) : (
        <FlatList
          ListEmptyComponent={empty}
          ListHeaderComponent={header}
          contentContainerClassName="gap-3.5"
          contentContainerStyle={{ paddingBottom: tabBarInset }}
          data={nearby}
          keyExtractor={(entry) => entry.show.id}
          renderItem={({ item }) => (
            <View className="px-4.5">
              <ShowCard entry={item} onPress={() => router.push(ROUTES.artist(item.show.artistId))} />
            </View>
          )}
        />
      )}

      <CityPickerSheet
        onClose={() => setCityPickerOpen(false)}
        onSelect={handleSelectCity}
        selectedCityId={city?.id ?? null}
        visible={cityPickerOpen}
      />
    </Screen>
  );
}
