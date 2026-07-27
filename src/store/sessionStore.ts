import { create } from 'zustand';

import * as accountService from '@/services/account/accountService';
import * as authService from '@/services/auth/authService';
import type { AuthenticatedUser, SignInCredentials, SignUpInput } from '@/services/auth/authTypes';
import { normalizeError, reportError } from '@/services/errors';
import { useReviewsStore } from '@/features/bars/store/reviewsStore';

import { useCartStore } from './cartStore';
import { useFavoritesStore } from './favoritesStore';
import { useWalletStore } from './walletStore';

/**
 * Authentication state.
 *
 * `status` is the single source of truth. The previous store kept a boolean that
 * started as `true`, which meant the app was authenticated before it had looked
 * for a session — and there was no way to express "still checking". Deriving
 * everything from one enum removes the possibility of contradictory combinations
 * such as authenticated-but-no-user.
 */
export type SessionStatus = 'checking' | 'authenticated' | 'unauthenticated';

interface SessionState {
  status: SessionStatus;
  accessToken: string | null;
  user: AuthenticatedUser | null;
  isSigningIn: boolean;
  isSigningOut: boolean;
  /** User-safe message for the login form. */
  authError: string | null;

  isDeletingAccount: boolean;

  restoreSession: () => Promise<void>;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  /** Creates an account and opens its session. Throws on failure. */
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  /** Deletes the account server-side, then clears this device. Throws on failure. */
  deleteAccount: () => Promise<void>;
  clearAuthError: () => void;
}

/** Wipes every account-scoped store. Device preferences are left alone. */
function clearAccountScopedData(): void {
  useCartStore.getState().clear();
  useWalletStore.getState().reset();
  useFavoritesStore.getState().reset();
  useReviewsStore.getState().reset();
}

/**
 * Guards against a second concurrent restore.
 *
 * Kept outside the store because it is a call-in-flight latch, not rendered
 * state — two mounts racing on boot must result in one validation request.
 */
let restoreInFlight: Promise<void> | null = null;

export const useSessionStore = create<SessionState>((set, get) => ({
  // Never `authenticated` before a session has actually been found.
  status: 'checking',
  accessToken: null,
  user: null,
  isSigningIn: false,
  isSigningOut: false,
  isDeletingAccount: false,
  authError: null,

  restoreSession: async () => {
    if (restoreInFlight) return restoreInFlight;

    restoreInFlight = (async () => {
      set({ status: 'checking' });

      try {
        const session = await authService.restoreSession();

        if (!session) {
          set({ status: 'unauthenticated', accessToken: null, user: null });
          return;
        }

        set({
          status: 'authenticated',
          accessToken: session.accessToken,
          user: session.user,
          authError: null,
        });
      } catch (error) {
        // Reaching here means the token could not be validated for a reason
        // other than rejection (offline, server down). Failing closed keeps
        // private screens shut; the stored token is left in place so a retry
        // once connectivity returns can still succeed.
        reportError(error, { scope: 'sessionStore.restoreSession' });
        set({ status: 'unauthenticated', accessToken: null, user: null });
      } finally {
        restoreInFlight = null;
      }
    })();

    return restoreInFlight;
  },

  signIn: async (credentials) => {
    // Second tap while the first request is open is dropped, so one submit is
    // one request. The button is also disabled, but that alone is not a guard.
    if (get().isSigningIn) return;

    set({ isSigningIn: true, authError: null });

    try {
      const session = await authService.signIn(credentials);

      set({
        status: 'authenticated',
        accessToken: session.accessToken,
        user: session.user,
        authError: null,
      });
    } catch (error) {
      const normalized = normalizeError(error);
      reportError(error, { scope: 'sessionStore.signIn', email: credentials.email });

      set({
        status: 'unauthenticated',
        accessToken: null,
        user: null,
        authError: normalized.userMessage,
      });

      // Rethrown so the screen does not navigate on a failed sign-in.
      throw normalized;
    } finally {
      set({ isSigningIn: false });
    }
  },

  signUp: async (input) => {
    // Shares the in-flight latch with signIn: both open a session, and two
    // overlapping attempts would race to set it.
    if (get().isSigningIn) return;

    set({ isSigningIn: true, authError: null });

    try {
      const session = await authService.signUp(input);

      set({
        status: 'authenticated',
        accessToken: session.accessToken,
        user: session.user,
        authError: null,
      });
    } catch (error) {
      const normalized = normalizeError(error);
      reportError(error, { scope: 'sessionStore.signUp', email: input.email });

      set({
        status: 'unauthenticated',
        accessToken: null,
        user: null,
        authError: normalized.userMessage,
      });

      // Rethrown so the screen does not navigate on a failed registration.
      throw normalized;
    } finally {
      set({ isSigningIn: false });
    }
  },

  signOut: async () => {
    if (get().isSigningOut) return;

    set({ isSigningOut: true });
    const { accessToken } = get();

    try {
      await authService.signOut(accessToken);
    } finally {
      // Local state is cleared regardless of what the server said.
      set({
        status: 'unauthenticated',
        accessToken: null,
        user: null,
        authError: null,
        isSigningOut: false,
      });

      // Account-scoped data must not survive into the next session: the cart is
      // venue- and price-scoped, the wallet balance is the account's, and
      // favourites are the account's saved venues.
      //
      // Device preferences (notifications, privacy switches, interests) are
      // deliberately left alone — they describe this device, not this account.
      clearAccountScopedData();
    }
  },

  deleteAccount: async () => {
    // A second confirm tap must not fire a second delete.
    if (get().isDeletingAccount) return;

    set({ isDeletingAccount: true });

    try {
      // Throws unless the server confirmed. Nothing below runs on failure, so a
      // refusal leaves the account and the session exactly as they were.
      await accountService.deleteAccount({ accessToken: get().accessToken });

      set({
        status: 'unauthenticated',
        accessToken: null,
        user: null,
        authError: null,
      });

      clearAccountScopedData();
    } finally {
      set({ isDeletingAccount: false });
    }
  },

  clearAuthError: () => set({ authError: null }),
}));

// --- Selectors ------------------------------------------------------------

export function selectIsAuthenticated(state: SessionState): boolean {
  return state.status === 'authenticated';
}

export function selectIsCheckingSession(state: SessionState): boolean {
  return state.status === 'checking';
}

/** Test seam: clears the concurrent-restore latch between cases. */
export function resetSessionLatchForTests(): void {
  restoreInFlight = null;
}
