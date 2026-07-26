import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/constants/storage';

/** Notification categories, keyed by the ids in `mocks/profile`. */
export type NotificationKey = 'app' | 'eventos' | 'compras' | 'geral';

/** Privacy switches on the settings screen. */
export type PermissionKey = 'location' | 'personalized' | 'share';

/**
 * Device-level preferences.
 *
 * Deliberately **not** cleared on sign-out: these describe how this device
 * should behave, and wiping someone's notification and privacy choices because
 * they signed out would be a hostile surprise (§7.8). Account-scoped data lives
 * in `favoritesStore` and the session stores.
 */
interface PreferencesState {
  /** Interest chips, keyed by label. */
  interests: Record<string, boolean>;
  notifications: Record<NotificationKey, boolean>;
  permissions: Record<PermissionKey, boolean>;
  /** False until persisted state has been read back. */
  hasHydrated: boolean;

  toggleInterest: (label: string) => void;
  toggleNotification: (key: NotificationKey) => void;
  togglePermission: (key: PermissionKey) => void;
}

const PREFERENCES_VERSION = 1;

const DEFAULTS = {
  interests: {} as Record<string, boolean>,
  notifications: { app: true, eventos: true, compras: true, geral: true },
  permissions: { location: true, personalized: true, share: false },
};

type PersistedPreferences = Pick<
  PreferencesState,
  'interests' | 'notifications' | 'permissions'
>;

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === 'boolean')
  );
}

function isValidPersisted(value: unknown): value is PersistedPreferences {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<PersistedPreferences>;
  return (
    isBooleanRecord(candidate.interests) &&
    isBooleanRecord(candidate.notifications) &&
    isBooleanRecord(candidate.permissions)
  );
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      hasHydrated: false,

      toggleInterest: (label) =>
        set((state) => ({
          interests: { ...state.interests, [label]: !state.interests[label] },
        })),

      toggleNotification: (key) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: !state.notifications[key] },
        })),

      togglePermission: (key) =>
        set((state) => ({
          permissions: { ...state.permissions, [key]: !state.permissions[key] },
        })),
    }),
    {
      name: STORAGE_KEYS.preferences,
      version: PREFERENCES_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedPreferences => ({
        interests: state.interests,
        notifications: state.notifications,
        permissions: state.permissions,
      }),
      migrate: (persisted, version) => {
        if (version >= PREFERENCES_VERSION && isValidPersisted(persisted)) return persisted;
        // Unknown shape: fall back to defaults rather than half-applying it. Only
        // this store is affected; the cart and favourites keep their own keys.
        return { ...DEFAULTS };
      },
      onRehydrateStorage: () => (state, error) => {
        usePreferencesStore.setState({ hasHydrated: true });
        if (error && __DEV__) console.warn('[preferences] failed to restore', error);

        if (
          state &&
          !isValidPersisted({
            interests: state.interests,
            notifications: state.notifications,
            permissions: state.permissions,
          })
        ) {
          usePreferencesStore.setState({ ...DEFAULTS });
        }
      },
    },
  ),
);

/** True once the user picked at least one interest. */
export function selectHasInterests(state: PreferencesState): boolean {
  return Object.values(state.interests).some(Boolean);
}
