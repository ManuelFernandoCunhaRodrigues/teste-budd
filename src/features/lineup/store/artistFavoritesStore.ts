import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ArtistFavoritesState {
  artistIds: string[];
  hasHydrated: boolean;
  toggle: (artistId: string) => void;
  isFavorite: (artistId: string) => boolean;
}

const STORAGE_KEY = 'budd:artist-favorites';
const VERSION = 1;

type PersistedArtistFavorites = Pick<ArtistFavoritesState, 'artistIds'>;

function isValidPersisted(value: unknown): value is PersistedArtistFavorites {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PersistedArtistFavorites>;
  return (
    Array.isArray(candidate.artistIds) &&
    candidate.artistIds.every((id) => typeof id === 'string')
  );
}

export const useArtistFavoritesStore = create<ArtistFavoritesState>()(
  persist(
    (set, get) => ({
      artistIds: [],
      hasHydrated: false,
      toggle: (artistId) =>
        set((state) => ({
          artistIds: state.artistIds.includes(artistId)
            ? state.artistIds.filter((id) => id !== artistId)
            : [...state.artistIds, artistId],
        })),
      isFavorite: (artistId) => get().artistIds.includes(artistId),
    }),
    {
      name: STORAGE_KEY,
      version: VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedArtistFavorites => ({ artistIds: state.artistIds }),
      migrate: (persisted, version) =>
        version >= VERSION && isValidPersisted(persisted) ? persisted : { artistIds: [] },
      onRehydrateStorage: () => (state, error) => {
        useArtistFavoritesStore.setState({ hasHydrated: true });
        if (error && __DEV__) console.warn('[artist-favorites] failed to restore', error);
        if (state && !isValidPersisted({ artistIds: state.artistIds })) {
          useArtistFavoritesStore.setState({ artistIds: [] });
        }
      },
    },
  ),
);
