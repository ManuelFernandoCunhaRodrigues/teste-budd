import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CartItem, VenueSummary } from '@/domain/cart/cartTypes';
import { createCartLineId } from '@/domain/cart/cartTypes';
import { STORAGE_KEYS } from '@/constants/storage';
import type { Product } from '@/types/domain';
import { multiplyCents, sumCents, type MoneyInCents } from '@/utils/money';

/**
 * The cart holds items from exactly one venue at a time.
 *
 * An order belongs to a venue: it has that venue's stock, prices, fees, opening
 * hours and payout. Mixing two venues in one cart cannot produce a valid order,
 * so instead of silently merging, an add from a different venue parks the request
 * in `pendingSwitch` and waits for the user to decide.
 */

/** What `addProduct` did, so the caller knows whether to show the dialog. */
export type AddProductResult = 'added' | 'needs_confirmation';

export interface AddProductInput {
  venue: VenueSummary;
  product: Product;
  quantity?: number;
  variantId?: string;
  selectedOptionIds?: string[];
  addOnIds?: string[];
  notes?: string;
}

/** An add held back because it belongs to another venue. */
interface PendingSwitch {
  venue: VenueSummary;
  input: AddProductInput;
}

interface CartState {
  venue: VenueSummary | null;
  items: CartItem[];
  pendingSwitch: PendingSwitch | null;
  /** False until persisted state has been read back. */
  hydrated: boolean;

  addProduct: (input: AddProductInput) => AddProductResult;
  incrementLine: (lineId: string) => void;
  decrementLine: (lineId: string) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;

  /** Replaces the cart with the parked item. */
  confirmVenueSwitch: () => void;
  /** Drops the parked item and keeps the current cart. */
  cancelVenueSwitch: () => void;
}

/** Builds a line from a product plus its selected options. */
function toCartItem(input: AddProductInput): CartItem {
  const { product, venue } = input;

  const lineId = createCartLineId({
    venueId: venue.id,
    productId: product.id,
    variantId: input.variantId,
    selectedOptionIds: input.selectedOptionIds,
    addOnIds: input.addOnIds,
  });

  return {
    lineId,
    venueId: venue.id,
    productId: product.id,
    name: product.name,
    imageToken: product.image,
    unitPriceInCents: product.priceInCents,
    quantity: Math.max(1, Math.trunc(input.quantity ?? 1)),
    ...(input.variantId ? { variantId: input.variantId } : {}),
    ...(input.selectedOptionIds?.length ? { selectedOptionIds: input.selectedOptionIds } : {}),
    ...(input.addOnIds?.length ? { addOnIds: input.addOnIds } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
  };
}

/** The persisted slice. Actions and transient flags stay out of storage. */
type PersistedCart = Pick<CartState, 'venue' | 'items'>;

const EMPTY_CART: PersistedCart = { venue: null, items: [] };

/**
 * Validates state read back from disk.
 *
 * A cart persisted before venues existed has no `venueId`, and there is no
 * evidence available to guess which bar those items came from — so it is
 * discarded rather than turned into an order against the wrong venue. Only the
 * cart is dropped; other stores keep their own keys.
 */
function migrateCart(persisted: unknown, version: number): PersistedCart {
  if (version >= CART_VERSION && isValidPersistedCart(persisted)) return persisted;
  return EMPTY_CART;
}

function isValidPersistedCart(value: unknown): value is PersistedCart {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<PersistedCart>;
  if (!Array.isArray(candidate.items)) return false;

  const itemsValid = candidate.items.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.lineId === 'string' &&
      typeof item.venueId === 'string' &&
      typeof item.productId === 'string' &&
      typeof item.name === 'string' &&
      Number.isFinite(item.unitPriceInCents) &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0,
  );
  if (!itemsValid) return false;

  // An empty cart must not keep a venue reference, and a filled one must have
  // every item belonging to the stored venue.
  if (candidate.items.length === 0) return candidate.venue == null;

  const venue = candidate.venue;
  if (typeof venue !== 'object' || venue === null || typeof venue.id !== 'string') return false;

  return candidate.items.every((item) => item.venueId === venue.id);
}

const CART_VERSION = 2;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ...EMPTY_CART,
      pendingSwitch: null,
      hydrated: false,

      addProduct: (input) => {
        const { venue, items } = get();

        // Adding from another venue never merges silently.
        if (venue && items.length > 0 && venue.id !== input.venue.id) {
          set({ pendingSwitch: { venue: input.venue, input } });
          return 'needs_confirmation';
        }

        const incoming = toCartItem(input);
        const existing = items.find((item) => item.lineId === incoming.lineId);

        set({
          venue: input.venue,
          items: existing
            ? items.map((item) =>
                item.lineId === incoming.lineId
                  ? {
                      ...item,
                      // Refresh the price snapshot so a change is reflected.
                      unitPriceInCents: incoming.unitPriceInCents,
                      quantity: item.quantity + incoming.quantity,
                    }
                  : item,
              )
            : [...items, incoming],
        });

        return 'added';
      },

      incrementLine: (lineId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.lineId === lineId ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        })),

      decrementLine: (lineId) =>
        set((state) => {
          const target = state.items.find((item) => item.lineId === lineId);
          if (!target) return state;

          const items =
            target.quantity <= 1
              ? state.items.filter((item) => item.lineId !== lineId)
              : state.items.map((item) =>
                  item.lineId === lineId ? { ...item, quantity: item.quantity - 1 } : item,
                );

          // Dropping the last item releases the venue, so the next add is free
          // to pick any bar without asking for confirmation.
          return { items, venue: items.length === 0 ? null : state.venue };
        }),

      removeLine: (lineId) =>
        set((state) => {
          const items = state.items.filter((item) => item.lineId !== lineId);
          return { items, venue: items.length === 0 ? null : state.venue };
        }),

      clear: () => set({ ...EMPTY_CART, pendingSwitch: null }),

      confirmVenueSwitch: () => {
        const pending = get().pendingSwitch;
        if (!pending) return;

        set({
          venue: pending.input.venue,
          items: [toCartItem(pending.input)],
          pendingSwitch: null,
        });
      },

      cancelVenueSwitch: () => set({ pendingSwitch: null }),
    }),
    {
      name: STORAGE_KEYS.cart,
      version: CART_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      // `pendingSwitch` is a UI decision in flight and must not survive a
      // restart; `hydrated` describes storage itself.
      partialize: (state): PersistedCart => ({ venue: state.venue, items: state.items }),
      migrate: migrateCart,
      onRehydrateStorage: () => (state, error) => {
        // Mark hydrated either way: a read failure must not leave the cart
        // permanently disabled behind a loading state.
        useCartStore.setState({ hydrated: true });
        if (error && __DEV__) console.warn('[cart] failed to restore persisted cart', error);
        if (state && !isValidPersistedCart({ venue: state.venue, items: state.items })) {
          useCartStore.setState({ ...EMPTY_CART });
        }
      },
    },
  ),
);

// --- Selectors ------------------------------------------------------------
// Kept outside the store so components subscribe only to what they render.

export function selectCartItems(state: CartState): CartItem[] {
  return state.items;
}

export function selectCartVenue(state: CartState): VenueSummary | null {
  return state.venue;
}

export function selectCartCount(state: CartState): number {
  return state.items.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Estimated total, for display only.
 *
 * The server recalculates prices, discounts and fees when the order is created;
 * this figure exists so the cart can show a running subtotal, never to decide
 * what gets charged.
 */
export function selectCartSubtotalInCents(state: CartState): MoneyInCents {
  return sumCents(state.items.map((item) => multiplyCents(item.unitPriceInCents, item.quantity)));
}

/**
 * Quantity of one product at one venue, for the stepper controls.
 *
 * Scoped by venue so the stepper on Bar A's menu never reflects an item added at
 * Bar B.
 */
export function selectQuantityOfProduct(venueId: string, productId: string) {
  return (state: CartState): number =>
    state.items
      .filter((item) => item.venueId === venueId && item.productId === productId)
      .reduce((total, item) => total + item.quantity, 0);
}

export function selectPendingSwitch(state: CartState): PendingSwitch | null {
  return state.pendingSwitch;
}
