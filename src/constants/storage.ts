/**
 * Keys for on-device persistence. Centralised so a rename cannot silently
 * orphan previously stored data.
 *
 * `session` is the one key that goes to `expo-secure-store`, which only accepts
 * alphanumerics, `.`, `-` and `_` — hence the dot separator instead of the colon
 * used by the AsyncStorage-backed keys.
 */
export const STORAGE_KEYS = {
  cart: 'budd:cart',
  favorites: 'budd:favorites',
  preferences: 'budd:preferences',
  reviews: 'budd:reviews',
  session: 'budd.session',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
