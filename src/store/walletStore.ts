import { create } from 'zustand';

import type { WalletBalance, WalletTransaction } from '@/domain/wallet/walletTypes';
import { backend } from '@/services/backend';
import { normalizeError, reportError } from '@/services/errors';
import type { MoneyInCents } from '@/utils/money';

/**
 * Wallet state.
 *
 * The balance is whatever the server last reported and nothing else — there is
 * deliberately no action to add credit locally. The old store had `addCredit`,
 * which incremented an in-memory number and let the UI announce a successful
 * top-up that no payment had backed.
 *
 * `balanceInCents` stays `null` until a figure has actually been fetched, so the
 * UI can tell "unknown" apart from "zero".
 */
type WalletStatus = 'idle' | 'loading' | 'ready' | 'error';

interface WalletState {
  status: WalletStatus;
  balanceInCents: MoneyInCents | null;
  updatedAt: string | null;
  transactions: WalletTransaction[];
  error: string | null;

  refresh: () => Promise<void>;
  /** Applies a balance the server returned alongside a confirmed payment. */
  applyBalance: (balance: WalletBalance) => void;
  reset: () => void;
}

const INITIAL = {
  status: 'idle' as WalletStatus,
  balanceInCents: null,
  updatedAt: null,
  transactions: [] as WalletTransaction[],
  error: null,
};

let refreshInFlight: Promise<void> | null = null;

export const useWalletStore = create<WalletState>((set) => ({
  ...INITIAL,

  refresh: async () => {
    // Collapse concurrent refreshes (screen focus + pull-to-refresh) into one.
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
      set({ status: 'loading', error: null });

      try {
        const [balance, transactions] = await Promise.all([
          backend.fetchWalletBalance(),
          backend.fetchWalletTransactions(),
        ]);

        set({
          status: 'ready',
          balanceInCents: balance.balanceInCents,
          updatedAt: balance.updatedAt,
          transactions,
          error: null,
        });
      } catch (error) {
        const normalized = normalizeError(error);
        reportError(error, { scope: 'walletStore.refresh' });

        // The previous balance is left untouched: a failed read is not evidence
        // that the balance changed.
        set({ status: 'error', error: normalized.userMessage });
      } finally {
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  },

  applyBalance: (balance) =>
    set({
      status: 'ready',
      balanceInCents: balance.balanceInCents,
      updatedAt: balance.updatedAt,
      error: null,
    }),

  reset: () => set({ ...INITIAL }),
}));

export function selectBalanceInCents(state: WalletState): MoneyInCents | null {
  return state.balanceInCents;
}

/** Test seam: clears the in-flight latch between cases. */
export function resetWalletLatchForTests(): void {
  refreshInFlight = null;
}
