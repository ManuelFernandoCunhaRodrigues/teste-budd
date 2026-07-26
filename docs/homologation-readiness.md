# Budd readiness for homologation

Last local audit: 2026-07-26.

## Initial state

- Branch: `master`.
- Baseline commit before this pass: `e0189a9`.
- Working tree before edits: clean.
- Platform target: Android and iOS only.
- Expo SDK: 57, with React Native 0.86 and React 19.2.3.
- Validation baseline before edits: `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`, and `npm run doctor` passed.

## Backend availability

| Domain | Endpoint declared | Integrated in app | Remaining dependency |
| --- | --- | --- | --- |
| Auth | `/auth/sign-in`, `/auth/sign-out`, `/me` | Yes through `BackendPort` | Real API contract, refresh-token semantics if supported |
| Account deletion | `/me` DELETE | Yes through `BackendPort` | Real irreversible backend operation |
| Orders | `/me/orders`, `/me/orders/:id` | Yes through `BackendPort` | Backend price calculation, stock validation, order lifecycle |
| Payments | `/payments`, `/payments/:id` | Yes through `BackendPort` | PSP integration and webhook-confirmed status |
| Wallet | `/me/wallet`, `/me/wallet/recharge`, `/me/wallet/transactions` | Yes through `BackendPort` | PSP charge creation and server-side balance mutation |
| Tickets | `/events/:id/tickets`, `/me/ticket-reservations`, `/me/tickets` | Yes through `BackendPort` | Real ticket inventory, reservation expiry, issuance after paid order |
| Reviews | `/bars/:id/reviews` | Submit integrated through `BackendPort` | List/read endpoint and moderation contract |
| Bars | `/bars`, `/bars/:id` | Partially integrated | Real DTO shape and pagination/filter contract |
| Events | `/events`, `/events/:id` | Partially integrated | Real DTO shape and pagination/filter contract |
| Places/map | `/places` | Not integrated | Production map content endpoint and native build validation |
| Artists | `/artists` | Not integrated | Lineup endpoint and media metadata |
| Favorites | `/me/favorites` | Local persistence only | Server sync contract |
| Preferences | `/me/preferences` | Local persistence only | Server sync contract |
| Notifications | Not declared | Local preferences only | `expo-notifications`, push token registration, category preferences, deep links |

## Mock inventory

| Domain | Current mock source | Current access | Production protection |
| --- | --- | --- | --- |
| Critical auth/orders/payments/wallet/tickets/reviews submit | `src/services/backend/devBackend.ts` | `BackendPort` factory | Protected by `environment.enableMocks` and `__DEV__` |
| Bars | `src/mocks/bars.ts` | `barService` | Protected in this pass by `contentSourceMode` |
| Events | `src/mocks/events.ts` | `eventService` | Protected in this pass by `contentSourceMode` |
| Reviews list | `src/mocks/reviews.ts` | Direct in `ReviewsSheet` | Pending |
| Map places | `src/mocks/places.ts` | Direct in `MapScreen` | Pending |
| Artists | `src/mocks/artists.ts` | Direct in lineup screens/components | Pending |
| Profile static data | `src/mocks/profile.ts` | Direct in profile/settings/privacy/notifications/recommendations | Pending |
| Favorites initial seed | `INITIAL_FAVORITE_IDS` | Direct in `favoritesStore` | Pending migration decision |
| Domain tests | `src/mocks/*` | Test fixtures | Acceptable when explicitly test-only |

## P0 status

| Feature | Status | Evidence | Remaining work |
| --- | --- | --- | --- |
| Auth | Partially implemented | SecureStore-backed session store and `BackendPort` auth methods exist | Refresh-token contract and real backend validation |
| Checkout/orders | Partially implemented | Idempotency keys, server order creation, pending order state, cart not cleared on failure | Real backend order lifecycle and runtime payment QA |
| PIX/recharge | Partially implemented | Frontend does not locally credit balance; backend port creates recharge and fetches status | Real PSP and webhook-confirmed wallet balance |
| Tickets | Partially implemented | Availability/reservation/ticket types and backend port exist | Real inventory and paid-order issuance |
| Persistence | Partially implemented | Zustand persistence, corruption handling, SecureStore for session | User-scoped cleanup audit for every persisted slice |

## P1 status

| Feature | Status | Evidence | Remaining work |
| --- | --- | --- | --- |
| History | Partially implemented | `fetchOrders` through `BackendPort`, month bounds, error state | Pagination/cursors and pending-payment resume UI |
| Profile editing | Not implemented | Settings still static/read-only | Form validation, API, upload/media contract |
| Notifications | Not implemented | Toggles are local preferences | `expo-notifications`, permission flow, push token registration |
| Production map | Partially implemented | Native IDs, permissions, Android Maps key gate in `app.config.ts` | EAS/dev-client build with real key, device GPS, deep link QA |

## Runtime checklist

- `[ ]` Development build Android: blocked. EAS CLI is authenticated, but the EAS project is not configured (`eas init` required), `GOOGLE_MAPS_ANDROID_API_KEY` is not present locally, and local Android toolchain variables (`ANDROID_HOME`, `ANDROID_SDK_ROOT`, `JAVA_HOME`) are absent.
- `[ ]` Physical Android device or emulator: not executed in this local audit.
- `[ ]` Offline runtime: not executed in native binary.
- `[ ]` Splash visual QA: not executed in native binary.
- `[ ]` Mocks on/off in runtime: structurally covered for backend/content selection, not device-validated.
- `[ ]` Map outside Expo Go: not executed in native binary.
- `[ ]` Android hardware back button: component tests cover fallback navigation; device QA pending.
- `[ ]` Real deep links: route guards covered structurally; device QA pending.

## Next implementation phases

1. Move reviews list, map places, artists, profile static data, recommendations, privacy, and notifications behind service contracts/factories.
2. Add DTO mapping for `/bars` and `/events` before trusting real backend payloads as UI types.
3. Implement notification domain only after adding `expo-notifications` and backend registration endpoints.
4. Add E2E tooling after one native development build is installable; do not install Maestro/Detox until that decision is made.
5. Run development build and device QA with real Google Maps key and backend environment.
