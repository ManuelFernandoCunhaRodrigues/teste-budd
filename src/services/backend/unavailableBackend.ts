import type { TicketAvailability } from '@/domain/tickets/ticketTypes';
import { AppError } from '@/services/errors';

import type { BackendPort } from './backendTypes';

/**
 * The implementation used when no backend is configured.
 *
 * Every call that would move money or unlock value rejects. This is the honest
 * default: letting the screens fall back to a local result is precisely the
 * "false success" class of bug this refactor exists to remove. Screens surface
 * `userMessage` and leave the user's data intact.
 */
function unavailableError(operation: string, userMessage?: string): AppError {
  return new AppError('unavailable', {
    userMessage:
      userMessage ?? 'Este recurso precisa de conexão com o servidor, que ainda não está disponível.',
    detail: `no backend configured: ${operation}`,
  });
}

/**
 * Ticket availability resolves instead of rejecting, so the event screen can
 * render a disabled button with an explanation. §7 asks for unavailability to be
 * a product state, not a crash.
 */
const unavailableTickets: TicketAvailability = {
  kind: 'unavailable',
  reason: 'A venda de ingressos ainda não está disponível.',
};

export const unavailableBackend: BackendPort = {
  signIn: () =>
    Promise.reject(
      unavailableError(
        'signIn',
        'A autenticação está indisponível: o servidor ainda não foi configurado.',
      ),
    ),
  signUp: () =>
    Promise.reject(
      unavailableError(
        'signUp',
        'O cadastro está indisponível: o servidor ainda não foi configurado.',
      ),
    ),
  fetchCurrentUser: () => Promise.reject(unavailableError('fetchCurrentUser')),
  /** Local sign-out must always succeed — the device can always forget a token. */
  signOut: () => Promise.resolve(),

  // Unlike sign-out, this cannot be done locally: only a server can delete an
  // account. Wiping the device and reporting success would be a lie the user
  // could not detect until they signed in again.
  deleteAccount: () =>
    Promise.reject(
      unavailableError(
        'deleteAccount',
        'Não foi possível excluir sua conta agora. Tente novamente mais tarde.',
      ),
    ),

  createOrder: () =>
    Promise.reject(
      unavailableError('createOrder', 'Não é possível fechar o pedido: servidor indisponível.'),
    ),
  fetchOrder: () => Promise.reject(unavailableError('fetchOrder')),
  // Rejects rather than resolving to `[]`: an empty list would read as "you have
  // no orders", which is a claim about the user's history we cannot make.
  fetchOrders: () =>
    Promise.reject(
      unavailableError('fetchOrders', 'Não foi possível carregar seu histórico agora.'),
    ),

  startPayment: () => Promise.reject(unavailableError('startPayment')),
  fetchPayment: () => Promise.reject(unavailableError('fetchPayment')),

  fetchTicketAvailability: () => Promise.resolve(unavailableTickets),
  createReservation: () => Promise.reject(unavailableError('createReservation')),
  fetchTickets: () => Promise.reject(unavailableError('fetchTickets')),

  fetchWalletBalance: () => Promise.reject(unavailableError('fetchWalletBalance')),
  createRecharge: () =>
    Promise.reject(
      unavailableError('createRecharge', 'A recarga está indisponível: servidor não configurado.'),
    ),
  fetchRechargeStatus: () => Promise.reject(unavailableError('fetchRechargeStatus')),
  fetchWalletTransactions: () => Promise.reject(unavailableError('fetchWalletTransactions')),

  submitReview: () =>
    Promise.reject(
      unavailableError(
        'submitReview',
        'Não foi possível publicar sua avaliação agora. O rascunho ficou salvo para tentar novamente.',
      ),
    ),
};
