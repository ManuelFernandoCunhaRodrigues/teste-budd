import { BARS } from '@/mocks/bars';

import { backend, backendMode, devBackendControls } from '..';

/**
 * The guarantees the critical flows depend on (§17.2–17.4), asserted against the
 * in-memory dev backend.
 *
 * These are server-side properties. The device cannot provide them, and the point
 * of testing them here is that the contract the app relies on is real rather than
 * assumed: an idempotent create, a payment that stays pending until settled, and a
 * credit that happens exactly once.
 */

const VENUE = BARS[0];
const CHOPP = 'chopp-artesanal-500';

it('runs against the dev backend', () => {
  expect(backendMode).toBe('dev');
});

describe('order creation', () => {
  it('prices the order from the catalogue, not from the request', async () => {
    const order = await backend.createOrder({
      venueId: VENUE.id,
      items: [{ productId: CHOPP, quantity: 2 }],
      idempotencyKey: 'order-pricing-1',
    });

    const catalogue = VENUE.featured.find((product) => product.id === CHOPP);
    expect(catalogue).toBeDefined();
    expect(order.lines[0].unitPriceInCents).toBe(catalogue?.priceInCents);
    expect(order.totals.subtotalInCents).toBe((catalogue?.priceInCents ?? 0) * 2);
    // Fees come from the venue record, server-side.
    expect(order.totals.serviceFeeInCents).toBe(VENUE.serviceFeeInCents);
    expect(order.totals.totalInCents).toBe(
      order.totals.subtotalInCents + order.totals.serviceFeeInCents,
    );
  });

  it('is created pending payment, never confirmed', async () => {
    const order = await backend.createOrder({
      venueId: VENUE.id,
      items: [{ productId: CHOPP, quantity: 1 }],
      idempotencyKey: 'order-pending-1',
    });

    expect(order.status).toBe('pending_payment');
  });

  it('returns the same order for a repeated idempotency key', async () => {
    const key = 'order-idem-1';

    const first = await backend.createOrder({
      venueId: VENUE.id,
      items: [{ productId: CHOPP, quantity: 1 }],
      idempotencyKey: key,
    });
    const second = await backend.createOrder({
      venueId: VENUE.id,
      items: [{ productId: CHOPP, quantity: 1 }],
      idempotencyKey: key,
    });

    // A timeout-then-retry must not produce two orders.
    expect(second.id).toBe(first.id);
  });

  it('creates distinct orders for distinct keys', async () => {
    const first = await backend.createOrder({
      venueId: VENUE.id,
      items: [{ productId: CHOPP, quantity: 1 }],
      idempotencyKey: 'order-distinct-a',
    });
    const second = await backend.createOrder({
      venueId: VENUE.id,
      items: [{ productId: CHOPP, quantity: 1 }],
      idempotencyKey: 'order-distinct-b',
    });

    expect(second.id).not.toBe(first.id);
  });

  it('rejects a product the venue does not sell', async () => {
    await expect(
      backend.createOrder({
        venueId: VENUE.id,
        items: [{ productId: 'nao-existe', quantity: 1 }],
        idempotencyKey: 'order-unknown-product',
      }),
    ).rejects.toMatchObject({ code: 'out_of_stock' });
  });

  it('rejects an unknown venue', async () => {
    await expect(
      backend.createOrder({
        venueId: 'bar-inexistente',
        items: [{ productId: CHOPP, quantity: 1 }],
        idempotencyKey: 'order-unknown-venue',
      }),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('reviews', () => {
  it('publishes a valid review through the dev backend', async () => {
    const review = await backend.submitReview({
      venueId: VENUE.id,
      userId: 'user-demo',
      authorName: 'Ana Souza',
      stars: 5,
      text: 'Atendimento excelente e pedido rapido.',
      idempotencyKey: 'review-publish-1',
    });

    expect(review.venueId).toBe(VENUE.id);
    expect(review.userId).toBe('user-demo');
    expect(review.text).toBe('Atendimento excelente e pedido rapido.');
  });

  it('returns the same review for a repeated idempotency key', async () => {
    const input = {
      venueId: VENUE.id,
      userId: 'user-demo',
      authorName: 'Ana Souza',
      stars: 4,
      text: 'Boa musica e fila curta.',
      idempotencyKey: 'review-idem-1',
    };

    const first = await backend.submitReview(input);
    const second = await backend.submitReview(input);

    expect(second.id).toBe(first.id);
  });
});

describe('order payment', () => {
  it('opens a pending PIX charge, not a paid one', async () => {
    const order = await backend.createOrder({
      venueId: VENUE.id,
      items: [{ productId: CHOPP, quantity: 1 }],
      idempotencyKey: 'pay-open-order',
    });

    const payment = await backend.startPayment({
      orderId: order.id,
      method: 'pix',
      idempotencyKey: 'pay-open-1',
    });

    expect(payment.status).toBe('pending');
    // The charge must carry a real payload — the UI must never synthesise one.
    expect(payment.charge?.qrCodePayload).toBeTruthy();
    expect(payment.charge?.expiresAt).toBeTruthy();
    expect(payment.amountInCents).toBe(order.totals.totalInCents);
  });

  it('leaves the order pending while the charge is unpaid', async () => {
    const order = await backend.createOrder({
      venueId: VENUE.id,
      items: [{ productId: CHOPP, quantity: 1 }],
      idempotencyKey: 'pay-unpaid-order',
    });
    await backend.startPayment({
      orderId: order.id,
      method: 'pix',
      idempotencyKey: 'pay-unpaid-1',
    });

    const reread = await backend.fetchOrder(order.id);
    expect(reread.status).toBe('pending_payment');
  });

  it('reuses the charge for a repeated payment key', async () => {
    const order = await backend.createOrder({
      venueId: VENUE.id,
      items: [{ productId: CHOPP, quantity: 1 }],
      idempotencyKey: 'pay-idem-order',
    });

    const first = await backend.startPayment({
      orderId: order.id,
      method: 'pix',
      idempotencyKey: 'pay-idem-1',
    });
    const second = await backend.startPayment({
      orderId: order.id,
      method: 'pix',
      idempotencyKey: 'pay-idem-1',
    });

    expect(second.id).toBe(first.id);
    expect(second.chargeId).toBe(first.chargeId);
  });

  it('confirms the order only once the charge settles', async () => {
    const order = await backend.createOrder({
      venueId: VENUE.id,
      items: [{ productId: CHOPP, quantity: 1 }],
      idempotencyKey: 'pay-settle-order',
    });
    const payment = await backend.startPayment({
      orderId: order.id,
      method: 'pix',
      idempotencyKey: 'pay-settle-1',
    });

    devBackendControls.confirmPixPayment(payment.chargeId as string);

    await expect(backend.fetchPayment(payment.id)).resolves.toMatchObject({ status: 'paid' });
    await expect(backend.fetchOrder(order.id)).resolves.toMatchObject({ status: 'confirmed' });
  });

  it('reports an expired charge instead of settling it', async () => {
    const order = await backend.createOrder({
      venueId: VENUE.id,
      items: [{ productId: CHOPP, quantity: 1 }],
      idempotencyKey: 'pay-expire-order',
    });
    const payment = await backend.startPayment({
      orderId: order.id,
      method: 'pix',
      idempotencyKey: 'pay-expire-1',
    });

    devBackendControls.expirePixPayment(payment.chargeId as string);

    await expect(backend.fetchPayment(payment.id)).resolves.toMatchObject({ status: 'expired' });
    await expect(backend.fetchOrder(order.id)).resolves.toMatchObject({
      status: 'pending_payment',
    });
  });
});

describe('wallet top-up', () => {
  it('creating a charge does not move the balance', async () => {
    const before = await backend.fetchWalletBalance();

    const created = await backend.createRecharge({
      amountInCents: 10_000,
      idempotencyKey: 'rch-nochange-1',
    });

    expect(created.charge.status).toBe('pending');
    const after = await backend.fetchWalletBalance();
    expect(after.balanceInCents).toBe(before.balanceInCents);
  });

  it('a pending charge reports no balance', async () => {
    const created = await backend.createRecharge({
      amountInCents: 10_000,
      idempotencyKey: 'rch-pending-1',
    });

    const status = await backend.fetchRechargeStatus(created.rechargeId);

    expect(status.status).toBe('pending');
    // §8.2: a balance is only ever returned once the money arrived.
    expect(status.balance).toBeUndefined();
  });

  it('credits the net amount once the payment is confirmed', async () => {
    const before = await backend.fetchWalletBalance();
    const created = await backend.createRecharge({
      amountInCents: 10_000,
      idempotencyKey: 'rch-credit-1',
    });

    devBackendControls.confirmPixPayment(created.charge.chargeId);
    const status = await backend.fetchRechargeStatus(created.rechargeId);

    expect(status.status).toBe('paid');
    expect(status.balance?.balanceInCents).toBe(before.balanceInCents + created.netInCents);
  });

  it('does not credit twice for a replayed confirmation', async () => {
    const before = await backend.fetchWalletBalance();
    const created = await backend.createRecharge({
      amountInCents: 20_000,
      idempotencyKey: 'rch-once-1',
    });

    // The same provider callback arriving three times.
    devBackendControls.confirmPixPayment(created.charge.chargeId);
    devBackendControls.confirmPixPayment(created.charge.chargeId);
    devBackendControls.confirmPixPayment(created.charge.chargeId);

    const balance = await backend.fetchWalletBalance();
    expect(balance.balanceInCents).toBe(before.balanceInCents + created.netInCents);
  });

  it('reuses the charge for a repeated top-up key', async () => {
    const first = await backend.createRecharge({
      amountInCents: 5_000,
      idempotencyKey: 'rch-idem-1',
    });
    const second = await backend.createRecharge({
      amountInCents: 5_000,
      idempotencyKey: 'rch-idem-1',
    });

    expect(second.rechargeId).toBe(first.rechargeId);
    expect(second.charge.chargeId).toBe(first.charge.chargeId);
  });

  it('revalidates the amount server-side', async () => {
    await expect(
      backend.createRecharge({ amountInCents: 1, idempotencyKey: 'rch-invalid-1' }),
    ).rejects.toMatchObject({ code: 'validation' });

    await expect(
      backend.createRecharge({ amountInCents: 999_999, idempotencyKey: 'rch-invalid-2' }),
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('reports an expired top-up charge', async () => {
    const created = await backend.createRecharge({
      amountInCents: 5_000,
      idempotencyKey: 'rch-expired-1',
    });

    devBackendControls.expirePixPayment(created.charge.chargeId);
    const status = await backend.fetchRechargeStatus(created.rechargeId);

    expect(status.status).toBe('expired');
    expect(status.balance).toBeUndefined();
  });

  it('refuses to settle an expired charge', async () => {
    const created = await backend.createRecharge({
      amountInCents: 5_000,
      idempotencyKey: 'rch-expired-2',
    });
    const before = await backend.fetchWalletBalance();

    devBackendControls.expirePixPayment(created.charge.chargeId);
    expect(() => devBackendControls.confirmPixPayment(created.charge.chargeId)).toThrow();

    const after = await backend.fetchWalletBalance();
    expect(after.balanceInCents).toBe(before.balanceInCents);
  });
});

describe('tickets', () => {
  it('reports a sold-out event', async () => {
    await expect(backend.fetchTicketAvailability('sunset-underground')).resolves.toMatchObject({
      kind: 'sold_out',
    });
  });

  it('reports an ended event', async () => {
    await expect(backend.fetchTicketAvailability('noite-samba-de-raiz')).resolves.toMatchObject({
      kind: 'event_ended',
    });
  });

  it('reports an event that does not sell tickets', async () => {
    const availability = await backend.fetchTicketAvailability('karaoke-fernanda-silva');
    expect(availability.kind).toBe('unavailable');
  });

  it('blocks a reservation for a sold-out event', async () => {
    await expect(
      backend.createReservation({
        eventId: 'sunset-underground',
        tierId: 'pista',
        quantity: 1,
        idempotencyKey: 'res-soldout-1',
      }),
    ).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('holds stock without issuing a ticket', async () => {
    const reservation = await backend.createReservation({
      eventId: 'kommander-of-kaos-iv',
      tierId: 'pista',
      quantity: 2,
      idempotencyKey: 'res-hold-1',
    });

    expect(reservation.status).toBe('reserved');
    // Nothing is issued before payment clears.
    const tickets = await backend.fetchTickets();
    expect(tickets.filter((ticket) => ticket.eventId === 'kommander-of-kaos-iv')).toHaveLength(0);
  });

  it('decrements available stock when held', async () => {
    const before = await backend.fetchTicketAvailability('noite-do-sertanejo');
    const availableBefore =
      before.kind === 'available' ? (before.tiers[0]?.available ?? 0) : 0;

    await backend.createReservation({
      eventId: 'noite-do-sertanejo',
      tierId: 'unico',
      quantity: 2,
      idempotencyKey: 'res-stock-1',
    });

    const after = await backend.fetchTicketAvailability('noite-do-sertanejo');
    const availableAfter = after.kind === 'available' ? (after.tiers[0]?.available ?? 0) : 0;

    expect(availableAfter).toBe(availableBefore - 2);
  });

  it('a repeated reservation key holds stock only once', async () => {
    const key = 'res-idem-1';

    const first = await backend.createReservation({
      eventId: 'samba-de-raiz-ao-vivo',
      tierId: 'unico',
      quantity: 1,
      idempotencyKey: key,
    });
    const availabilityAfterFirst = await backend.fetchTicketAvailability('samba-de-raiz-ao-vivo');

    const second = await backend.createReservation({
      eventId: 'samba-de-raiz-ao-vivo',
      tierId: 'unico',
      quantity: 1,
      idempotencyKey: key,
    });
    const availabilityAfterSecond = await backend.fetchTicketAvailability('samba-de-raiz-ao-vivo');

    expect(second.id).toBe(first.id);
    const stockAfterFirst =
      availabilityAfterFirst.kind === 'available' ? availabilityAfterFirst.tiers[0].available : -1;
    const stockAfterSecond =
      availabilityAfterSecond.kind === 'available' ? availabilityAfterSecond.tiers[0].available : -2;
    expect(stockAfterSecond).toBe(stockAfterFirst);
  });

  it('enforces the per-user limit', async () => {
    await expect(
      backend.createReservation({
        eventId: 'kommander-of-kaos-iv',
        tierId: 'vip',
        quantity: 99,
        idempotencyKey: 'res-limit-1',
      }),
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('issues one ticket per unit only after payment is confirmed', async () => {
    const reservation = await backend.createReservation({
      eventId: 'noite-do-sertanejo',
      tierId: 'unico',
      quantity: 2,
      idempotencyKey: 'res-issue-1',
    });

    const beforeIssue = await backend.fetchTickets();
    const countBefore = beforeIssue.filter((t) => t.eventId === 'noite-do-sertanejo').length;

    // Settle the charge opened alongside the reservation.
    const open = devBackendControls
      .listOpenCharges()
      .find((charge) => charge.amountInCents === reservation.totalInCents);
    expect(open).toBeDefined();
    devBackendControls.confirmPixPayment((open as { chargeId: string }).chargeId);

    const afterIssue = await backend.fetchTickets();
    const issued = afterIssue.filter((t) => t.eventId === 'noite-do-sertanejo');

    expect(issued.length).toBe(countBefore + 2);
    // Each ticket needs its own entry code.
    expect(new Set(issued.map((ticket) => ticket.code)).size).toBe(issued.length);
    expect(issued.every((ticket) => ticket.status === 'issued')).toBe(true);
  });
});
