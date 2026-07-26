/**
 * Keys for on-device persistence. Centralised so a rename cannot silently
 * orphan previously stored data.
 */
export const STORAGE_KEYS = {
  cart: 'budd:cart',
  favorites: 'budd:favorites',
  preferences: 'budd:preferences',
  reviews: 'budd:reviews',
  session: 'budd:session',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
