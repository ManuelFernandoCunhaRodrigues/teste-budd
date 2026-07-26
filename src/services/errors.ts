/**
 * One error shape for the whole app.
 *
 * Transport-level failures (`ApiError`) and domain refusals both arrive at the
 * UI as an `AppError`, which carries two separate messages: `userMessage` is
 * safe to render, `detail` is technical and must never reach the screen. That
 * split is what keeps "AxiosError: Network request failed" out of the interface
 * without throwing away the information needed to debug it.
 */

import type { ApiError } from '@/types/api';

export type AppErrorCode =
  | 'validation'
  | 'unauthenticated'
  | 'forbidden'
  | 'network'
  | 'timeout'
  | 'conflict'
  | 'unavailable'
  | 'out_of_stock'
  | 'not_found'
  | 'payment_declined'
  | 'charge_expired'
  | 'unknown';

const USER_MESSAGES: Record<AppErrorCode, string> = {
  validation: 'Confira os dados informados e tente novamente.',
  unauthenticated: 'Sua sessão expirou. Entre novamente para continuar.',
  forbidden: 'Você não tem permissão para esta ação.',
  network: 'Sem conexão com a internet. Verifique sua rede e tente novamente.',
  timeout: 'A conexão demorou demais. Tente novamente.',
  conflict: 'Esta operação já foi registrada.',
  unavailable: 'Serviço indisponível no momento. Tente novamente mais tarde.',
  out_of_stock: 'Este item não está mais disponível.',
  not_found: 'Não encontramos o que você procura.',
  payment_declined: 'O pagamento não foi aprovado. Tente outra forma de pagamento.',
  charge_expired: 'A cobrança expirou. Gere uma nova para continuar.',
  unknown: 'Algo deu errado. Tente novamente.',
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  /** Safe to render. */
  readonly userMessage: string;
  /** Technical context for logs only — never rendered. */
  readonly detail?: string;
  readonly status?: number;

  constructor(
    code: AppErrorCode,
    options: { userMessage?: string; detail?: string; status?: number } = {},
  ) {
    // `message` mirrors the technical detail so a stack trace stays useful.
    super(options.detail ?? code);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = options.userMessage ?? USER_MESSAGES[code];
    this.detail = options.detail;
    this.status = options.status;
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'code' in value &&
    'message' in value
  );
}

/** Maps an HTTP status onto the closest domain code. */
function codeForStatus(status: number): AppErrorCode {
  if (status === 0) return 'network';
  if (status === 408) return 'timeout';
  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 422 || status === 400) return 'validation';
  if (status === 503 || status === 502 || status === 504) return 'unavailable';
  return 'unknown';
}

/**
 * Codes a backend may return verbatim. Anything outside this map falls back to
 * the status-derived code, so an unrecognised server code can never be shown
 * to the user as-is.
 */
const SERVER_CODES: Record<string, AppErrorCode> = {
  validation: 'validation',
  invalid_credentials: 'unauthenticated',
  unauthenticated: 'unauthenticated',
  forbidden: 'forbidden',
  not_found: 'not_found',
  conflict: 'conflict',
  unavailable: 'unavailable',
  out_of_stock: 'out_of_stock',
  sold_out: 'out_of_stock',
  payment_declined: 'payment_declined',
  charge_expired: 'charge_expired',
  network: 'network',
  timeout: 'timeout',
};

/** Normalises anything thrown into an `AppError`. */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (isApiError(error)) {
    const code = SERVER_CODES[error.code] ?? codeForStatus(error.status);
    return new AppError(code, {
      // Server copy is only trusted for validation problems, where it carries
      // the field-level reason. Everything else uses our own wording.
      userMessage: code === 'validation' ? error.message : undefined,
      detail: `api ${error.status} ${error.code}: ${error.message}`,
      status: error.status,
    });
  }

  if (error instanceof Error) {
    return new AppError('unknown', { detail: `${error.name}: ${error.message}` });
  }

  return new AppError('unknown', { detail: String(error) });
}

const REDACTED_KEYS = /token|password|senha|authorization|secret|cpf|email|pix|qr/i;

/**
 * Observability sink.
 *
 * Redacts anything that looks like a credential or personal data before it can
 * reach a log. Currently console-only; point this at a real collector when one
 * exists, keeping the redaction in place.
 */
export function reportError(error: unknown, context: Record<string, unknown> = {}): void {
  const normalized = normalizeError(error);

  const safeContext = Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      REDACTED_KEYS.test(key) ? '[redacted]' : value,
    ]),
  );

  if (__DEV__) {
    console.warn(`[${normalized.code}]`, normalized.detail ?? normalized.userMessage, safeContext);
  }
}
