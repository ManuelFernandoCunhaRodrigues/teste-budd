import type { ApiError } from '@/types/api';

/**
 * Stand-in for the network while the app runs on mock data.
 *
 * Feature services return promises through this helper so screens already
 * exercise their loading and error paths. Swapping a service over to the real
 * `api` client is then a one-line change with no component edits.
 */
export function resolveMock<T>(value: T, delay = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

/** Rejects with the same error shape the API client produces. */
export function rejectMock(message: string, status = 404): Promise<never> {
  const error: ApiError = { status, code: 'not_found', message };
  return Promise.reject(error);
}
