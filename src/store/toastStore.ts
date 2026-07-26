import { create } from 'zustand';

import { TOAST_DURATION } from '@/theme/animation';

interface ToastState {
  message: string | null;
  /** Shows a transient confirmation; replaces any message already on screen. */
  show: (message: string) => void;
  hide: () => void;
}

// Held outside the store: a pending timer is not rendered state, and keeping it
// out avoids re-rendering every subscriber when it changes.
let timer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,

  show: (message) => {
    if (timer) clearTimeout(timer);
    set({ message });
    timer = setTimeout(() => {
      timer = null;
      set({ message: null });
    }, TOAST_DURATION);
  },

  hide: () => {
    if (timer) clearTimeout(timer);
    timer = null;
    set({ message: null });
  },
}));

/**
 * Imperative helper for non-component code (services, handlers) that needs to
 * raise a toast without subscribing to the store.
 */
export function showToast(message: string): void {
  useToastStore.getState().show(message);
}
