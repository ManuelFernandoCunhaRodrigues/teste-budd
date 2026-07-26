import { environment } from '@/config/environment';
import { AppError } from '@/services/errors';

/**
 * Shared source selection for catalogue-like content.
 *
 * Critical flows already use `BackendPort`. These read-only feeds are being
 * migrated in smaller slices, but they still need the same rule: no mock data
 * unless the development backend was explicitly enabled.
 */
export type ContentSourceMode = 'http' | 'mock' | 'unavailable';

export function resolveContentSourceMode(): ContentSourceMode {
  if (environment.apiBaseUrl) return 'http';
  if (environment.enableMocks) return 'mock';
  return 'unavailable';
}

export const contentSourceMode = resolveContentSourceMode();

export function contentUnavailable(domain: string): AppError {
  return new AppError('unavailable', {
    userMessage: 'Conteúdo indisponível: o servidor não está configurado.',
    detail: `${domain}: no API URL and development mocks are disabled`,
    status: 503,
  });
}
