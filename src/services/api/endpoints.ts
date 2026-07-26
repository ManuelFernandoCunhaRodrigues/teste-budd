/**
 * Every API path in one place, so a backend rename is a single-file change.
 * Feature services compose these — they never inline path strings.
 */
export const ENDPOINTS = {
  bars: '/bars',
  bar: (id: string) => `/bars/${id}`,
  barReviews: (id: string) => `/bars/${id}/reviews`,

  events: '/events',
  event: (id: string) => `/events/${id}`,

  places: '/places',
  artists: '/artists',

  favorites: '/me/favorites',
  preferences: '/me/preferences',

  // --- Auth ---------------------------------------------------------------
  signIn: '/auth/sign-in',
  signOut: '/auth/sign-out',
  me: '/me',

  // --- Orders -------------------------------------------------------------
  orders: '/me/orders',
  order: (id: string) => `/me/orders/${id}`,

  // --- Payments -----------------------------------------------------------
  payments: '/payments',
  payment: (id: string) => `/payments/${id}`,

  // --- Tickets ------------------------------------------------------------
  eventTickets: (eventId: string) => `/events/${eventId}/tickets`,
  ticketReservations: '/me/ticket-reservations',
  tickets: '/me/tickets',

  // --- Wallet -------------------------------------------------------------
  wallet: '/me/wallet',
  recharge: '/me/wallet/recharge',
  rechargeStatus: (id: string) => `/me/wallet/recharge/${id}`,
  walletTransactions: '/me/wallet/transactions',
} as const;
