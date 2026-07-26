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
import type { AuthenticatedUser, SignInCredentials, SignInResponse } from '@/services/auth/authTypes';

/**
 * Everything the critical flows need from a server, in one interface.
 *
 * Feature services depend on this port rather than on `fetch`, which is what
 * lets the app be honest about not having a backend: the "unavailable"
 * implementation refuses every call instead of the screens inventing a result.
 * All implementations reject with `AppError`.
 */
export interface BackendPort {
  // --- Auth ---------------------------------------------------------------
  signIn(credentials: SignInCredentials): Promise<SignInResponse>;
  /** Validates a stored token and returns who it belongs to. */
  fetchCurrentUser(accessToken: string): Promise<AuthenticatedUser>;
  signOut(accessToken: string): Promise<void>;
  /**
   * Permanently deletes the signed-in account.
   *
   * Resolves only when the server confirms. Every caller treats a rejection as
   * "the account still exists" — the device must never clear local data and call
   * that a deletion.
   */
  deleteAccount(accessToken: string): Promise<void>;

  // --- Orders -------------------------------------------------------------
  createOrder(input: CreateOrderInput): Promise<Order>;
  fetchOrder(orderId: string): Promise<Order>;
  /**
   * The signed-in user's orders, newest first.
   *
   * Added for the history screen, which previously had no source at all and so
   * showed an empty month whatever the user selected (M-04).
   */
  fetchOrders(): Promise<Order[]>;

  // --- Payments -----------------------------------------------------------
  startPayment(input: StartPaymentInput): Promise<Payment>;
  fetchPayment(paymentId: string): Promise<Payment>;

  // --- Tickets ------------------------------------------------------------
  fetchTicketAvailability(eventId: string): Promise<TicketAvailability>;
  createReservation(input: CreateReservationInput): Promise<TicketReservation>;
  fetchTickets(): Promise<Ticket[]>;

  // --- Wallet -------------------------------------------------------------
  fetchWalletBalance(): Promise<WalletBalance>;
  createRecharge(input: CreateRechargeInput): Promise<RechargeCharge>;
  fetchRechargeStatus(rechargeId: string): Promise<RechargeStatus>;
  fetchWalletTransactions(): Promise<WalletTransaction[]>;

  // --- Reviews ------------------------------------------------------------
  submitReview(input: SubmitReviewInput): Promise<PublishedReview>;
}

/** Which implementation is serving the critical flows. */
export type BackendMode = 'http' | 'dev' | 'unavailable';
