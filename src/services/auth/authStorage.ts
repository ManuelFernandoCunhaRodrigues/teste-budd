import * as SecureStore from 'expo-secure-store';

import { STORAGE_KEYS } from '@/constants/storage';
import { reportError } from '@/services/errors';

import type { AuthSession } from './authTypes';

/**
 * Where the session lives on device.
 *
 * Declared as an interface so the environment can vary without the service or
 * the store knowing: native uses the OS keystore, and a platform without one
 * gets an explicit in-memory implementation rather than a silent downgrade to
 * unencrypted disk storage.
 */
export interface AuthStorage {
  getSession(): Promise<AuthSession | null>;
  setSession(session: AuthSession): Promise<void>;
  clear(): Promise<void>;
}

/** Shape-checks whatever came back off the device before trusting it. */
function parseSession(raw: string | null): AuthSession | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    const user = parsed.user;

    if (
      typeof parsed.accessToken !== 'string' ||
      !parsed.accessToken ||
      typeof parsed.expiresAt !== 'string' ||
      typeof user !== 'object' ||
      user === null ||
      typeof user.id !== 'string'
    ) {
      return null;
    }

    return parsed as AuthSession;
  } catch {
    // Corrupt or half-written entry — treat as "no session" and let the caller
    // clear it, rather than crashing on boot.
    return null;
  }
}

/**
 * Backed by `expo-secure-store`, which uses the Android Keystore and the iOS
 * keychain. Requires the native module, so it is present in Expo Go and in any
 * development build, but not on web.
 */
const secureAuthStorage: AuthStorage = {
  async getSession() {
    const raw = await SecureStore.getItemAsync(STORAGE_KEYS.session);
    return parseSession(raw);
  },

  async setSession(session) {
    await SecureStore.setItemAsync(STORAGE_KEYS.session, JSON.stringify(session), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async clear() {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.session);
  },
};

/**
 * Used only where no OS keystore exists (web).
 *
 * The session is lost when the page reloads. That is a deliberate loss of
 * convenience, not of secrecy: writing a bearer token to `localStorage` to keep
 * it across reloads would be the silent security downgrade §3.3 rules out.
 */
function createMemoryAuthStorage(): AuthStorage {
  let session: AuthSession | null = null;

  return {
    async getSession() {
      return session;
    },
    async setSession(next) {
      session = next;
    },
    async clear() {
      session = null;
    },
  };
}

let resolved: AuthStorage | null = null;

/**
 * Picks an implementation once, on first use.
 *
 * `isAvailableAsync` is the documented way to detect the native module, so an
 * unsupported platform degrades to the in-memory store with a dev-only warning
 * instead of throwing during boot.
 */
export async function getAuthStorage(): Promise<AuthStorage> {
  if (resolved) return resolved;

  let available = false;
  try {
    available = await SecureStore.isAvailableAsync();
  } catch (error) {
    reportError(error, { scope: 'authStorage.isAvailableAsync' });
  }

  if (!available && __DEV__) {
    console.warn(
      '[auth] expo-secure-store is unavailable on this platform. ' +
        'The session will be kept in memory only and lost on reload.',
    );
  }

  resolved = available ? secureAuthStorage : createMemoryAuthStorage();
  return resolved;
}

/** Test seam: forces the next `getAuthStorage()` call to re-resolve. */
export function resetAuthStorageForTests(next: AuthStorage | null = null): void {
  resolved = next;
}
