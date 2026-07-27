/**
 * Route paths in one place so navigation calls never hard-code strings.
 * Values mirror the Expo Router file tree under `app/`.
 *
 * Account screens live in the `(account)` route group: the group organises the
 * files without appearing in the URL, and keeping those paths flat avoids an
 * ambiguous `profile` segment shared with the `/profile` tab.
 *
 * Dynamic routes return the `{ pathname, params }` form rather than an
 * interpolated string — that is what Expo Router's typed routes can verify.
 */
export const ROUTES = {
  boot: '/',
  login: '/login',
  signup: '/signup',

  lineup: '/lineup',
  map: '/map',
  role: '/role',
  products: '/products',
  profile: '/profile',

  artist: (id: string) => ({ pathname: '/artist/[id]' as const, params: { id } }),
  bar: (id: string) => ({ pathname: '/bar/[id]' as const, params: { id } }),
  event: (id: string) => ({ pathname: '/event/[id]' as const, params: { id } }),
  order: (id: string) => ({ pathname: '/order/[id]' as const, params: { id } }),

  recharge: '/recharge',
  orderHistory: '/order-history',
  favorites: '/favorites',
  recommendations: '/recommendations',
  preferences: '/preferences',
  settings: '/settings',
  notifications: '/notifications',
  privacy: '/privacy',
} as const;
