import { environment } from '@/config/environment';
import type { ApiError, ApiResponse } from '@/types/api';

/**
 * Minimal HTTP client built on `fetch`.
 *
 * Centralises base URL, headers, timeout and error normalisation so feature
 * services never deal with transport concerns and components never call
 * `fetch` directly.
 */

type Query = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  signal?: AbortSignal;
  query?: Query;
  /**
   * Extra headers, used for `Idempotency-Key` on money-moving requests so a
   * retried POST cannot create a second order or charge.
   */
  headers?: Record<string, string>;
}

/** Auth token holder. Swap for secure storage when real auth lands. */
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(path.replace(/^\//, ''), `${environment.apiUrl.replace(/\/$/, '')}/`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  return url.toString();
}

function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 'status' in value && 'code' in value;
}

async function toApiError(response: Response): Promise<ApiError> {
  let message = response.statusText || 'Erro inesperado';
  let code = `http_${response.status}`;

  try {
    const body = (await response.json()) as { message?: string; code?: string };
    if (body.message) message = body.message;
    if (body.code) code = body.code;
  } catch {
    // Body was empty or not JSON — the status-derived defaults stand.
  }

  return { status: response.status, code, message };
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), environment.apiTimeout);

  // Honour a caller-supplied signal alongside the timeout.
  options.signal?.addEventListener('abort', () => controller.abort());

  try {
    const response = await fetch(buildUrl(path, options.query), {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return undefined as T;

    const payload = (await response.json()) as ApiResponse<T> | T;
    return payload && typeof payload === 'object' && 'data' in payload
      ? (payload as ApiResponse<T>).data
      : (payload as T);
  } catch (error) {
    if (isApiError(error)) throw error;

    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError: ApiError = {
        status: 408,
        code: 'timeout',
        message: 'A conexão demorou demais. Tente novamente.',
      };
      throw timeoutError;
    }

    const networkError: ApiError = {
      status: 0,
      code: 'network',
      message: 'Sem conexão com a internet.',
    };
    throw networkError;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};
