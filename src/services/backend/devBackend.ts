import { RECHARGE } from '@/constants/app';
import type { CreateOrderInput, Order, OrderLine } from '@/domain/orders/orderTypes';
import type { PaymentStatus } from '@/domain/payments/paymentStatus';
import type { Payment, PixCharge, StartPaymentInput } from '@/domain/payments/paymentTypes';
import type { PublishedReview, SubmitReviewInput } from '@/domain/reviews/reviewTypes';
import { toReviewInitial, validateReviewFields } from '@/domain/reviews/reviewTypes';
import type {
  CreateReservationInput,
  Ticket,
  TicketAvailability,
  TicketReservation,
  TicketTier,
} from '@/domain/tickets/ticketTypes';
import type {
  CreateRechargeInput,
  RechargeCharge,
  RechargeStatus,
  WalletBalance,
  WalletTransaction,
} from '@/domain/wallet/walletTypes';
import { findBarById, findVenueProduct } from '@/mocks/bars';
import { EVENTS } from '@/mocks/events';
import type { AuthenticatedUser, SignInCredentials, SignInResponse } from '@/services/auth/authTypes';
import { AppError } from '@/services/errors';
import { multiplyCents, sumCents, type MoneyInCents } from '@/utils/money';

import type { BackendPort } from './backendTypes';

/**
 * In-memory stand-in for the server, used only in development.
 *
 * It exists so the real flows can be exercised end to end — idempotency,
 * server-side totals, `pending` distinct from `paid`, credit-once — while no
 * backend exists. It is not a fake success path: nothing here confirms a payment
 * on its own. A charge stays `pending` until something explicitly settles it,
 * which in a demo is the dev-only control below standing in for the PIX provider
 * webhook.
 *
 * Never reachable from a production build: selection is guarded by `__DEV__` in
 * `config/environment`.
 */

interface DevUser extends AuthenticatedUser {
  password: string;
}

/** Seeded credentials. Documented in `.env.example`. */
const USERS: DevUser[] = [
  {
    id: 'user-demo',
    name: 'Ana Souza',
    email: 'demo@budd.app',
    password: 'budd1234',
    },
];

const TOKEN_TTL_MS = 1000 * 60 * 60 * 8;
const CHARGE_TTL_MS = 1000 * 60 * 15;
const RESERVATION_TTL_MS = 1000 * 60 * 10;

/** What a charge is paying for, so settlement knows what to release. */
type ChargeTarget =
  | { kind: 'order'; orderId: string }
  | { kind: 'recharge'; rechargeId: string }
  | { kind: 'reservation'; reservationId: string };

interface DevCharge {
  chargeId: string;
  status: PaymentStatus;
  amountInCents: MoneyInCents;
  qrCodePayload: string;
  expiresAt: string;
  target: ChargeTarget;
}

interface DevRecharge {
  rechargeId: string;
  status: PaymentStatus;
  amountInCents: MoneyInCents;
  feeInCents: MoneyInCents;
  netInCents: MoneyInCents;
  chargeId: string;
}

/** Everything the fake server remembers. Reset only by a full app reload. */
const db = {
  tokens: new Map<string, { userId: string; expiresAt: number }>(),
  orders: new Map<string, Order>(),
  payments: new Map<string, Payment>(),
  charges: new Map<string, DevCharge>(),
  recharges: new Map<string, DevRecharge>(),
  reservations: new Map<string, TicketReservation>(),
  tickets: [] as Ticket[],
  reviews: [] as PublishedReview[],
  transactions: [] as WalletTransaction[],
  wallet: { balanceInCents: 0, updatedAt: new Date().toISOString() } as WalletBalance,

  /**
   * Idempotency indexes — the server-side half of the guarantee. A repeated key
   * returns the original record instead of creating a second one.
   */
  orderKeys: new Map<string, string>(),
  paymentKeys: new Map<string, string>(),
  rechargeKeys: new Map<string, string>(),
  reservationKeys: new Map<string, string>(),
  reviewKeys: new Map<string, string>(),

  /** Charges already applied to the wallet, so a replayed settlement is a no-op. */
  settledCharges: new Set<string>(),

  /** Accounts deleted in this session. Sign-in must not resurrect them. */
  deletedUserIds: new Set<string>(),

  /** Remaining ticket stock, decremented on reservation. */
  tierStock: new Map<string, number>(),
};

let sequence = 0;
function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}_${Date.now().toString(36)}${sequence.toString(36)}`;
}

function requireToken(accessToken: string): DevUser {
  const entry = db.tokens.get(accessToken);
  if (!entry || entry.expiresAt <= Date.now()) {
    db.tokens.delete(accessToken);
    throw new AppError('unauthenticated', { detail: 'devBackend: invalid or expired token' });
  }

  const user = USERS.find((candidate) => candidate.id === entry.userId);
  if (!user) throw new AppError('unauthenticated', { detail: 'devBackend: unknown user' });
  return user;
}

// --- Ticketing configuration ----------------------------------------------

type TicketConfig =
  | { kind: 'tiers'; tiers: Omit<TicketTier, 'eventId' | 'available'>[]; stock: number[] }
  | { kind: 'sold_out' }
  | { kind: 'event_ended' }
  | { kind: 'unavailable'; reason: string };

/**
 * Mock ticketing setup, chosen to exercise every availability state rather than
 * to describe real inventory.
 */
const TICKET_CONFIG: Record<string, TicketConfig> = {
  'kommander-of-kaos-iv': {
    kind: 'tiers',
    tiers: [
      { id: 'pista', name: 'Pista — 2º lote', priceInCents: 5_000, maxPerUser: 4 },
      { id: 'vip', name: 'VIP', priceInCents: 12_000, maxPerUser: 2 },
    ],
    stock: [12, 3],
  },
  'samba-de-raiz-ao-vivo': {
    kind: 'tiers',
    tiers: [{ id: 'unico', name: 'Lote único', priceInCents: 2_000, maxPerUser: 6 }],
    stock: [40],
  },
  'noite-do-sertanejo': {
    kind: 'tiers',
    tiers: [{ id: 'unico', name: 'Lote único', priceInCents: 1_500, maxPerUser: 6 }],
    stock: [25],
  },
  'sunset-underground': { kind: 'sold_out' },
  'noite-samba-de-raiz': { kind: 'event_ended' },
  'karaoke-fernanda-silva': {
    kind: 'unavailable',
    reason: 'Entrada gratuita — não é necessário ingresso.',
  },
};

function stockKey(eventId: string, tierId: string): string {
  return `${eventId}:${tierId}`;
}

function tiersFor(eventId: string, config: Extract<TicketConfig, { kind: 'tiers' }>): TicketTier[] {
  return config.tiers.map((tier, index) => {
    const key = stockKey(eventId, tier.id);
    if (!db.tierStock.has(key)) db.tierStock.set(key, config.stock[index] ?? 0);

    return { ...tier, eventId, available: db.tierStock.get(key) ?? 0 };
  });
}

// --- Charge helpers --------------------------------------------------------

function createCharge(amountInCents: MoneyInCents, target: ChargeTarget): DevCharge {
  const chargeId = nextId('chg');

  const charge: DevCharge = {
    chargeId,
    // A freshly created charge is awaiting payment. It is never `paid` here —
    // that is the whole point.
    status: 'pending',
    amountInCents,
    qrCodePayload: `00020126BUDD-DEV-${chargeId}5204000053039865802BR6009SAO LUIS62070503***6304DEV`,
    expiresAt: new Date(Date.now() + CHARGE_TTL_MS).toISOString(),
    target,
  };

  db.charges.set(chargeId, charge);
  return charge;
}

/** Applies expiry lazily, so a charge left open reports the right state. */
function refreshCharge(charge: DevCharge): DevCharge {
  if (charge.status === 'pending' && Date.parse(charge.expiresAt) <= Date.now()) {
    charge.status = 'expired';
    if (charge.target.kind === 'recharge') {
      const recharge = db.recharges.get(charge.target.rechargeId);
      if (recharge) recharge.status = 'expired';
    }
  }
  return charge;
}

function creditWallet(amountInCents: MoneyInCents, description: string): void {
  db.wallet = {
    balanceInCents: db.wallet.balanceInCents + amountInCents,
    updatedAt: new Date().toISOString(),
  };

  db.transactions.unshift({
    id: nextId('txn'),
    kind: 'credit',
    amountInCents,
    status: 'paid',
    description,
    createdAt: db.wallet.updatedAt,
  });
}

/**
 * Settles a charge exactly once.
 *
 * The `settledCharges` guard is the server-side idempotency §8.5 asks for: a
 * replayed confirmation for the same charge must not credit twice.
 */
function settleCharge(chargeId: string): void {
  const charge = db.charges.get(chargeId);
  if (!charge) throw new AppError('not_found', { detail: `devBackend: charge ${chargeId}` });

  refreshCharge(charge);
  if (charge.status === 'expired') {
    throw new AppError('charge_expired', { detail: `devBackend: charge ${chargeId} expired` });
  }
  if (db.settledCharges.has(chargeId)) return;

  db.settledCharges.add(chargeId);
  charge.status = 'paid';

  if (charge.target.kind === 'recharge') {
    const recharge = db.recharges.get(charge.target.rechargeId);
    if (recharge) {
      recharge.status = 'paid';
      creditWallet(recharge.netInCents, 'Recarga via PIX');
    }
    return;
  }

  if (charge.target.kind === 'order') {
    const order = db.orders.get(charge.target.orderId);
    if (order) db.orders.set(order.id, { ...order, status: 'confirmed' });
  }

  if (charge.target.kind === 'reservation') {
    const reservation = db.reservations.get(charge.target.reservationId);
    if (!reservation) return;

    db.reservations.set(reservation.id, { ...reservation, status: 'issued' });

    const event = EVENTS.find((candidate) => candidate.id === reservation.eventId);
    const config = TICKET_CONFIG[reservation.eventId];
    const tierName =
      config?.kind === 'tiers'
        ? (config.tiers.find((tier) => tier.id === reservation.tierId)?.name ?? 'Ingresso')
        : 'Ingresso';

    // One ticket per unit reserved, each with its own entry code.
    for (let index = 0; index < reservation.quantity; index += 1) {
      db.tickets.unshift({
        id: nextId('tkt'),
        eventId: reservation.eventId,
        eventName: event?.name ?? reservation.eventId,
        tierName,
        code: `BUDD-${nextId('c').toUpperCase()}`,
        status: 'issued',
        issuedAt: new Date().toISOString(),
      });
    }
  }

  // Mark any payment pointing at this charge as paid.
  for (const [id, payment] of db.payments) {
    if (payment.chargeId === chargeId) db.payments.set(id, { ...payment, status: 'paid' });
  }
}

// --- Dev-only controls ----------------------------------------------------

/**
 * Stands in for the PIX provider's webhook.
 *
 * Exposed so a demo can move a charge to `paid` deliberately. There is no timer
 * that does this on its own — the app must go through the same polling path it
 * would use against a real provider.
 */
export const devBackendControls = {
  /**
   * Test seam: wipes the in-memory database.
   *
   * The store is module-level and therefore shared across cases in a file — a
   * deleted account or a settled charge would otherwise leak into the next test.
   */
  resetForTests(): void {
    db.tokens.clear();
    db.orders.clear();
    db.payments.clear();
    db.charges.clear();
    db.recharges.clear();
    db.reservations.clear();
    db.tickets.length = 0;
    db.reviews.length = 0;
    db.transactions.length = 0;
    db.wallet = { balanceInCents: 0, updatedAt: new Date().toISOString() };
    db.orderKeys.clear();
    db.paymentKeys.clear();
    db.rechargeKeys.clear();
    db.reservationKeys.clear();
    db.reviewKeys.clear();
    db.settledCharges.clear();
    db.deletedUserIds.clear();
    db.tierStock.clear();
  },

  listOpenCharges(): DevCharge[] {
    return [...db.charges.values()].map(refreshCharge).filter((charge) => charge.status === 'pending');
  },
  confirmPixPayment(chargeId: string): void {
    settleCharge(chargeId);
  },
  expirePixPayment(chargeId: string): void {
    const charge = db.charges.get(chargeId);
    if (!charge || db.settledCharges.has(chargeId)) return;

    charge.status = 'expired';
    charge.expiresAt = new Date(Date.now() - 1000).toISOString();
    if (charge.target.kind === 'recharge') {
      const recharge = db.recharges.get(charge.target.rechargeId);
      if (recharge) recharge.status = 'expired';
    }
  },
};

// --- The port -------------------------------------------------------------

export const devBackend: BackendPort = {
  async signIn(credentials: SignInCredentials): Promise<SignInResponse> {
    await latency();

    const email = credentials.email.trim().toLowerCase();
    const user = USERS.find((candidate) => candidate.email === email);

    // Same error whether the address is unknown, deleted, or the password is
    // wrong, so the response cannot be used to enumerate accounts.
    if (!user || db.deletedUserIds.has(user.id) || user.password !== credentials.password) {
      throw new AppError('unauthenticated', {
        userMessage: 'E-mail ou senha incorretos.',
        detail: 'devBackend: credential mismatch',
      });
    }

    const accessToken = nextId('tok');
    const expiresAtMs = Date.now() + TOKEN_TTL_MS;
    db.tokens.set(accessToken, { userId: user.id, expiresAt: expiresAtMs });

    return {
      accessToken,
      expiresAt: new Date(expiresAtMs).toISOString(),
      user: { id: user.id, name: user.name, email: user.email },
    };
  },

  async fetchCurrentUser(accessToken: string): Promise<AuthenticatedUser> {
    await latency();
    const user = requireToken(accessToken);
    return { id: user.id, name: user.name, email: user.email };
  },

  async signOut(accessToken: string): Promise<void> {
    await latency();
    db.tokens.delete(accessToken);
  },

  async deleteAccount(accessToken: string): Promise<void> {
    await latency();

    // Requires a live session: an expired token must not be able to delete.
    const user = requireToken(accessToken);

    db.deletedUserIds.add(user.id);

    // Revoke every session for this user, not just the calling one.
    for (const [token, entry] of db.tokens) {
      if (entry.userId === user.id) db.tokens.delete(token);
    }

    // Server-side data goes with the account.
    db.orders.clear();
    db.orderKeys.clear();
    db.payments.clear();
    db.paymentKeys.clear();
    db.charges.clear();
    db.recharges.clear();
    db.rechargeKeys.clear();
    db.reservations.clear();
    db.reservationKeys.clear();
    db.reviews.length = 0;
    db.reviewKeys.clear();
    db.settledCharges.clear();
    db.tickets.length = 0;
    db.transactions.length = 0;
    db.wallet = { balanceInCents: 0, updatedAt: new Date().toISOString() };
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    await latency();

    const existingId = db.orderKeys.get(input.idempotencyKey);
    if (existingId) {
      const existing = db.orders.get(existingId);
      // A repeat of the same attempt returns the original order.
      if (existing) return existing;
    }

    const venue = findBarById(input.venueId);
    if (!venue) {
      throw new AppError('not_found', {
        userMessage: 'Estabelecimento não encontrado.',
        detail: `devBackend: venue ${input.venueId}`,
      });
    }

    if (input.items.length === 0) {
      throw new AppError('validation', {
        userMessage: 'Seu carrinho está vazio.',
        detail: 'devBackend: no items',
      });
    }

    // Prices come from the catalogue, never from the request — a client-supplied
    // amount must not be able to set what gets charged.
    const lines: OrderLine[] = input.items.map((item) => {
      const product = findVenueProduct(input.venueId, item.productId);
      if (!product) {
        throw new AppError('out_of_stock', {
          userMessage: 'Um dos itens não está mais disponível neste estabelecimento.',
          detail: `devBackend: product ${item.productId} not sold at ${input.venueId}`,
        });
      }

      return {
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPriceInCents: product.priceInCents,
        totalInCents: multiplyCents(product.priceInCents, item.quantity),
      };
    });

    const subtotalInCents = sumCents(lines.map((line) => line.totalInCents));
    const order: Order = {
      id: nextId('ord'),
      venueId: venue.id,
      venueName: venue.name,
      // Created, not confirmed: payment has not happened yet.
      status: 'pending_payment',
      lines,
      totals: {
        subtotalInCents,
        discountInCents: 0,
        serviceFeeInCents: venue.serviceFeeInCents,
        totalInCents: subtotalInCents + venue.serviceFeeInCents,
      },
      createdAt: new Date().toISOString(),
    };

    db.orders.set(order.id, order);
    db.orderKeys.set(input.idempotencyKey, order.id);
    return order;
  },

  async fetchOrder(orderId: string): Promise<Order> {
    await latency();
    const order = db.orders.get(orderId);
    if (!order) throw new AppError('not_found', { detail: `devBackend: order ${orderId}` });
    return order;
  },

  async startPayment(input: StartPaymentInput): Promise<Payment> {
    await latency();

    const existingId = db.paymentKeys.get(input.idempotencyKey);
    if (existingId) {
      const existing = db.payments.get(existingId);
      if (existing) return existing;
    }

    const order = db.orders.get(input.orderId);
    if (!order) throw new AppError('not_found', { detail: `devBackend: order ${input.orderId}` });

    const amountInCents = order.totals.totalInCents;

    if (input.method === 'wallet') {
      if (db.wallet.balanceInCents < amountInCents) {
        throw new AppError('payment_declined', {
          userMessage: 'Saldo insuficiente na carteira.',
          detail: 'devBackend: insufficient balance',
        });
      }

      db.wallet = {
        balanceInCents: db.wallet.balanceInCents - amountInCents,
        updatedAt: new Date().toISOString(),
      };
      db.transactions.unshift({
        id: nextId('txn'),
        kind: 'debit',
        amountInCents,
        status: 'paid',
        description: `Pedido em ${order.venueName}`,
        createdAt: db.wallet.updatedAt,
      });

      const payment: Payment = {
        id: nextId('pay'),
        status: 'paid',
        method: 'wallet',
        amountInCents,
        orderId: order.id,
      };
      db.payments.set(payment.id, payment);
      db.paymentKeys.set(input.idempotencyKey, payment.id);
      db.orders.set(order.id, { ...order, status: 'confirmed', paymentId: payment.id });
      return payment;
    }

    const charge = createCharge(amountInCents, { kind: 'order', orderId: order.id });
    const payment: Payment = {
      id: nextId('pay'),
      status: charge.status,
      method: 'pix',
      amountInCents,
      orderId: order.id,
      chargeId: charge.chargeId,
      charge: toPixCharge(charge),
    };

    db.payments.set(payment.id, payment);
    db.paymentKeys.set(input.idempotencyKey, payment.id);
    db.orders.set(order.id, { ...order, paymentId: payment.id });
    return payment;
  },

  async fetchPayment(paymentId: string): Promise<Payment> {
    await latency();

    const payment = db.payments.get(paymentId);
    if (!payment) throw new AppError('not_found', { detail: `devBackend: payment ${paymentId}` });

    if (payment.chargeId) {
      const charge = db.charges.get(payment.chargeId);
      if (charge) {
        refreshCharge(charge);
        const updated: Payment = {
          ...payment,
          status: charge.status,
          charge: toPixCharge(charge),
        };
        db.payments.set(paymentId, updated);
        return updated;
      }
    }

    return payment;
  },

  async fetchTicketAvailability(eventId: string): Promise<TicketAvailability> {
    await latency();

    const config = TICKET_CONFIG[eventId];
    if (!config) {
      return { kind: 'unavailable', reason: 'Este evento não vende ingressos pelo app.' };
    }

    if (config.kind === 'sold_out') return { kind: 'sold_out' };
    if (config.kind === 'event_ended') return { kind: 'event_ended' };
    if (config.kind === 'unavailable') return { kind: 'unavailable', reason: config.reason };

    const tiers = tiersFor(eventId, config);
    return tiers.every((tier) => tier.available <= 0) ? { kind: 'sold_out' } : { kind: 'available', tiers };
  },

  async createReservation(input: CreateReservationInput): Promise<TicketReservation> {
    await latency();

    const existingId = db.reservationKeys.get(input.idempotencyKey);
    if (existingId) {
      const existing = db.reservations.get(existingId);
      // Prevents a double tap from holding twice the stock.
      if (existing) return existing;
    }

    const config = TICKET_CONFIG[input.eventId];
    if (!config || config.kind !== 'tiers') {
      throw new AppError('unavailable', {
        userMessage: 'Este evento não está vendendo ingressos.',
        detail: `devBackend: event ${input.eventId} not selling`,
      });
    }

    const tier = config.tiers.find((candidate) => candidate.id === input.tierId);
    if (!tier) throw new AppError('not_found', { detail: `devBackend: tier ${input.tierId}` });

    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      throw new AppError('validation', {
        userMessage: 'Escolha uma quantidade válida.',
        detail: `devBackend: quantity ${input.quantity}`,
      });
    }

    if (input.quantity > tier.maxPerUser) {
      throw new AppError('validation', {
        userMessage: `O limite é ${tier.maxPerUser} ingressos por pessoa neste lote.`,
        detail: `devBackend: quantity ${input.quantity} over maxPerUser`,
      });
    }

    const key = stockKey(input.eventId, tier.id);
    // Ensure stock is seeded before reading it.
    tiersFor(input.eventId, config);
    const available = db.tierStock.get(key) ?? 0;

    if (available <= 0) {
      throw new AppError('out_of_stock', {
        userMessage: 'Este lote está esgotado.',
        detail: `devBackend: tier ${tier.id} sold out`,
      });
    }
    if (available < input.quantity) {
      throw new AppError('out_of_stock', {
        userMessage: `Restam apenas ${available} ingressos neste lote.`,
        detail: `devBackend: only ${available} left`,
      });
    }

    // Hold the stock now, so it cannot be sold twice while payment is open.
    db.tierStock.set(key, available - input.quantity);

    const reservation: TicketReservation = {
      id: nextId('res'),
      eventId: input.eventId,
      tierId: tier.id,
      quantity: input.quantity,
      totalInCents: multiplyCents(tier.priceInCents, input.quantity),
      expiresAt: new Date(Date.now() + RESERVATION_TTL_MS).toISOString(),
      status: 'reserved',
    };

    db.reservations.set(reservation.id, reservation);
    db.reservationKeys.set(input.idempotencyKey, reservation.id);

    // Opening the charge here keeps reservation and payment in one round trip.
    const charge = createCharge(reservation.totalInCents, {
      kind: 'reservation',
      reservationId: reservation.id,
    });
    const payment: Payment = {
      id: nextId('pay'),
      status: charge.status,
      method: 'pix',
      amountInCents: reservation.totalInCents,
      chargeId: charge.chargeId,
    };
    db.payments.set(payment.id, payment);

    return reservation;
  },

  async fetchTickets(): Promise<Ticket[]> {
    await latency();
    return [...db.tickets];
  },

  async fetchWalletBalance(): Promise<WalletBalance> {
    await latency();
    return { ...db.wallet };
  },

  async createRecharge(input: CreateRechargeInput): Promise<RechargeCharge> {
    await latency();

    const existingId = db.rechargeKeys.get(input.idempotencyKey);
    if (existingId) {
      const existing = db.recharges.get(existingId);
      const existingCharge = existing && db.charges.get(existing.chargeId);
      if (existing && existingCharge) {
        return toRechargeCharge(existing, refreshCharge(existingCharge));
      }
    }

    // Server-side revalidation: the client's bounds are not trusted.
    if (
      !Number.isInteger(input.amountInCents) ||
      input.amountInCents < RECHARGE.minInCents ||
      input.amountInCents > RECHARGE.maxInCents
    ) {
      throw new AppError('validation', {
        userMessage: 'Valor de recarga inválido.',
        detail: `devBackend: amount ${input.amountInCents} out of range`,
      });
    }

    const feeInCents = Math.round(input.amountInCents * RECHARGE.feeRate);
    const rechargeId = nextId('rch');
    const charge = createCharge(input.amountInCents, { kind: 'recharge', rechargeId });

    const recharge: DevRecharge = {
      rechargeId,
      status: charge.status,
      amountInCents: input.amountInCents,
      feeInCents,
      netInCents: input.amountInCents - feeInCents,
      chargeId: charge.chargeId,
    };

    db.recharges.set(rechargeId, recharge);
    db.rechargeKeys.set(input.idempotencyKey, rechargeId);
    return toRechargeCharge(recharge, charge);
  },

  async fetchRechargeStatus(rechargeId: string): Promise<RechargeStatus> {
    await latency();

    const recharge = db.recharges.get(rechargeId);
    if (!recharge) throw new AppError('not_found', { detail: `devBackend: recharge ${rechargeId}` });

    const charge = db.charges.get(recharge.chargeId);
    if (charge) {
      refreshCharge(charge);
      recharge.status = db.settledCharges.has(charge.chargeId) ? 'paid' : charge.status;
    }

    return {
      rechargeId,
      status: recharge.status,
      // The balance is only ever reported once the money actually arrived.
      ...(recharge.status === 'paid' ? { balance: { ...db.wallet } } : {}),
    };
  },

  async fetchWalletTransactions(): Promise<WalletTransaction[]> {
    await latency();
    return [...db.transactions];
  },

  async submitReview(input: SubmitReviewInput): Promise<PublishedReview> {
    await latency();

    const existingId = db.reviewKeys.get(input.idempotencyKey);
    if (existingId) {
      const existing = db.reviews.find((review) => review.id === existingId);
      if (existing) return existing;
    }

    const user = USERS.find((candidate) => candidate.id === input.userId);
    if (!user || db.deletedUserIds.has(user.id)) {
      throw new AppError('unauthenticated', {
        userMessage: 'Entre novamente para publicar sua avaliacao.',
        detail: 'devBackend: review user is not active',
      });
    }

    const venue = findBarById(input.venueId);
    if (!venue) {
      throw new AppError('not_found', {
        userMessage: 'Nao encontramos este bar para publicar a avaliacao.',
        detail: `devBackend: venue ${input.venueId} not found`,
      });
    }

    const validation = validateReviewFields(input.stars, input.text);
    if (validation) {
      throw new AppError('validation', {
        userMessage: validation,
        detail: `devBackend: invalid review for ${input.venueId}`,
      });
    }

    const publishedAt = new Date().toISOString();
    const review: PublishedReview = {
      id: nextId('rev'),
      venueId: venue.id,
      userId: user.id,
      author: user.name,
      initial: toReviewInitial(user.name),
      date: 'agora',
      stars: input.stars,
      text: input.text.trim(),
      publishedAt,
    };

    db.reviews.unshift(review);
    db.reviewKeys.set(input.idempotencyKey, review.id);
    return review;
  },
};

/** Projects the internal charge onto the wire shape, dropping the target. */
function toPixCharge(charge: DevCharge): PixCharge {
  return {
    chargeId: charge.chargeId,
    status: charge.status,
    amountInCents: charge.amountInCents,
    qrCodePayload: charge.qrCodePayload,
    expiresAt: charge.expiresAt,
  };
}

function toRechargeCharge(recharge: DevRecharge, charge: DevCharge): RechargeCharge {
  return {
    rechargeId: recharge.rechargeId,
    feeInCents: recharge.feeInCents,
    netInCents: recharge.netInCents,
    charge: toPixCharge(charge),
  };
}

/**
 * Small delay so screens exercise their loading states.
 *
 * This models network latency only. It never resolves a payment or produces a
 * success that did not happen.
 */
function latency(ms = 260): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
