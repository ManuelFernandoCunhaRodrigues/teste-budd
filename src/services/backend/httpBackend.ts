import type { CreateOrderInput, Order } from '@/domain/orders/orderTypes';
import type { Payment, StartPaymentInput } from '@/domain/payments/paymentTypes';
import type { PublishedReview, SubmitReviewInput } from '@/domain/reviews/reviewTypes';
import type {
  CreateReservationInput,
  Ticket,
  TicketAvailability,
  TicketReservation,
} from '@/domain/tickets/ticketTypes';
import type {
  CreateRechargeInput,
  RechargeCharge,
  RechargeStatus,
  WalletBalance,
  WalletTransaction,
} from '@/domain/wallet/walletTypes';
import { api } from '@/services/api/client';
import { ENDPOINTS } from '@/services/api/endpoints';
import type { AuthenticatedUser, SignInCredentials, SignInResponse } from '@/services/auth/authTypes';
import { isValidSignInResponse } from '@/services/auth/authTypes';
import { AppError, normalizeError } from '@/services/errors';

import type { BackendPort } from './backendTypes';

/**
 * The real backend, over HTTP.
 *
 * Every method normalises failures to `AppError` so callers never branch on
 * transport specifics, and money-moving POSTs carry the caller's idempotency key
 * as a header.
 */

/** Runs a request, converting any thrown transport error into an `AppError`. */
async function guard<T>(operation: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const normalized = normalizeError(error);
    throw new AppError(normalized.code, {
      userMessage: normalized.userMessage,
      detail: `${operation}: ${normalized.detail ?? 'no detail'}`,
      status: normalized.status,
    });
  }
}

function idempotent(key: string): { headers: Record<string, string> } {
  return { headers: { 'Idempotency-Key': key } };
}

export const httpBackend: BackendPort = {
  async signIn(credentials: SignInCredentials) {
    const response = await guard('signIn', () =>
      api.post<unknown>(ENDPOINTS.signIn, {
        email: credentials.email,
        password: credentials.password,
      }),
    );

    // A malformed 200 must not be trusted as a session.
    if (!isValidSignInResponse(response)) {
      throw new AppError('unknown', { detail: 'signIn: unexpected response shape' });
    }

    return response satisfies SignInResponse;
  },

  fetchCurrentUser(accessToken: string) {
    return guard('fetchCurrentUser', () =>
      api.get<AuthenticatedUser>(ENDPOINTS.me, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
  },

  async signOut(accessToken: string) {
    await guard('signOut', () =>
      api.post<void>(ENDPOINTS.signOut, undefined, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
  },

  async deleteAccount(accessToken: string) {
    await guard('deleteAccount', () =>
      api.delete<void>(ENDPOINTS.me, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
  },

  createOrder(input: CreateOrderInput) {
    return guard('createOrder', () =>
      api.post<Order>(
        ENDPOINTS.orders,
        { venueId: input.venueId, items: input.items },
        idempotent(input.idempotencyKey),
      ),
    );
  },

  fetchOrder(orderId: string) {
    return guard('fetchOrder', () => api.get<Order>(ENDPOINTS.order(orderId)));
  },

  fetchOrders() {
    return guard('fetchOrders', () => api.get<Order[]>(ENDPOINTS.orders));
  },

  startPayment(input: StartPaymentInput) {
    return guard('startPayment', () =>
      api.post<Payment>(
        ENDPOINTS.payments,
        { orderId: input.orderId, method: input.method },
        idempotent(input.idempotencyKey),
      ),
    );
  },

  fetchPayment(paymentId: string) {
    return guard('fetchPayment', () => api.get<Payment>(ENDPOINTS.payment(paymentId)));
  },

  fetchTicketAvailability(eventId: string) {
    return guard('fetchTicketAvailability', () =>
      api.get<TicketAvailability>(ENDPOINTS.eventTickets(eventId)),
    );
  },

  createReservation(input: CreateReservationInput) {
    return guard('createReservation', () =>
      api.post<TicketReservation>(
        ENDPOINTS.ticketReservations,
        { eventId: input.eventId, tierId: input.tierId, quantity: input.quantity },
        idempotent(input.idempotencyKey),
      ),
    );
  },

  fetchTickets() {
    return guard('fetchTickets', () => api.get<Ticket[]>(ENDPOINTS.tickets));
  },

  fetchWalletBalance() {
    return guard('fetchWalletBalance', () => api.get<WalletBalance>(ENDPOINTS.wallet));
  },

  createRecharge(input: CreateRechargeInput) {
    return guard('createRecharge', () =>
      api.post<RechargeCharge>(
        ENDPOINTS.recharge,
        { amountInCents: input.amountInCents },
        idempotent(input.idempotencyKey),
      ),
    );
  },

  fetchRechargeStatus(rechargeId: string) {
    return guard('fetchRechargeStatus', () =>
      api.get<RechargeStatus>(ENDPOINTS.rechargeStatus(rechargeId)),
    );
  },

  fetchWalletTransactions() {
    return guard('fetchWalletTransactions', () =>
      api.get<WalletTransaction[]>(ENDPOINTS.walletTransactions),
    );
  },

  submitReview(input: SubmitReviewInput) {
    return guard('submitReview', () =>
      api.post<PublishedReview>(
        ENDPOINTS.barReviews(input.venueId),
        { stars: input.stars, text: input.text.trim() },
        idempotent(input.idempotencyKey),
      ),
    );
  },
};
