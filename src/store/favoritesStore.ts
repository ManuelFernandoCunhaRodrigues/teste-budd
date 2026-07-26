import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/constants/storage';
import { INITIAL_FAVORITE_IDS } from '@/mocks/bars';

/**
 * Saved venues.
 *
 * Persisted to AsyncStorage rather than SecureStore: a list of bar ids is not a
 * credential, and mixing it into the keystore entry that holds the session token
 * would widen what a token read exposes.
 *
 * Favourites belong to the signed-in account, so `reset` is called on sign-out
 * and on account deletion — the next person to use the device must not inherit
 * them. When a backend arrives this becomes an optimistic cache to reconcile
 * after sign-in.
 */
interface FavoritesState {
  /** Ids of the bars the user saved. */
  barIds: string[];
  /** False until persisted state has been read back. */
  hasHydrated: boolean;

  toggle: (barId: string) => void;
  remove: (barId: string) => void;
  isFavorite: (barId: string) => boolean;
  /** Clears user-scoped data. Not persisted seeding — an empty list is a choice. */
  reset: () => void;
}

const FAVORITES_VERSION = 1;

type PersistedFavorites = Pick<FavoritesState, 'barIds'>;

function isValidPersisted(value: unknown): value is PersistedFavorites {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<PersistedFavorites>;
  return (
    Array.isArray(candidate.barIds) && candidate.barIds.every((id) => typeof id === 'string')
  );
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      // Seeds the design's initial state on a first run; a hydrated value wins.
      barIds: [...INITIAL_FAVORITE_IDS],
      hasHydrated: false,

      toggle: (barId) =>
        set((state) => ({
          barIds: state.barIds.includes(barId)
            ? state.barIds.filter((id) => id !== barId)
            : [...state.barIds, barId],
        })),

      remove: (barId) => set((state) => ({ barIds: state.barIds.filter((id) => id !== barId) })),

      isFavorite: (barId) => get().barIds.includes(barId),

      reset: () => set({ barIds: [] }),
    }),
    {
      name: STORAGE_KEYS.favorites,
      version: FAVORITES_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      // `hasHydrated` describes storage itself and must never be stored.
      partialize: (state): PersistedFavorites => ({ barIds: state.barIds }),
      migrate: (persisted, version) =>
        version >= FAVORITES_VERSION && isValidPersisted(persisted)
          ? persisted
          : { barIds: [...INITIAL_FAVORITE_IDS] },
      onRehydrateStorage: () => (state, error) => {
        // Marked hydrated either way: a read failure must not leave the UI stuck
        // behind a skeleton forever.
        useFavoritesStore.setState({ hasHydrated: true });
        if (error && __DEV__) console.warn('[favorites] failed to restore', error);
        if (state && !isValidPersisted({ barIds: state.barIds })) {
          useFavoritesStore.setState({ barIds: [] });
        }
      },
    },
  ),
);
