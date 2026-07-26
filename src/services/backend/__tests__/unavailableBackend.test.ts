import { AppError, isAppError } from '@/services/errors';

import { unavailableBackend } from '../unavailableBackend';

/** Awaits a rejection and narrows it to `AppError`. */
async function rejection(run: () => Promise<unknown>): Promise<AppError> {
  try {
    await run();
  } catch (caught) {
    if (isAppError(caught)) return caught;
    throw new Error(`expected an AppError, got ${String(caught)}`);
  }
  throw new Error('expected the call to reject');
}

/**
 * Behaviour when no backend is configured (§3.7, §7).
 *
 * The requirement is honesty: every operation that would move money or unlock
 * value must refuse, and the refusal must be legible to the user. Nothing may
 * fall back to a locally produced result.
 */

it('refuses to sign in, naming authentication as unavailable', async () => {
  await expect(unavailableBackend.signIn({ email: 'a@b.com', password: 'x' })).rejects.toMatchObject(
    { code: 'unavailable' },
  );

  const error = await rejection(() =>
    unavailableBackend.signIn({ email: 'a@b.com', password: 'x' }),
  );

  expect(error.userMessage).toMatch(/indisponível/i);
});

it('refuses to create an order', async () => {
  await expect(
    unavailableBackend.createOrder({ venueId: 'v', items: [], idempotencyKey: 'k' }),
  ).rejects.toMatchObject({ code: 'unavailable' });
});

it('refuses to open a payment', async () => {
  await expect(
    unavailableBackend.startPayment({ orderId: 'o', method: 'pix', idempotencyKey: 'k' }),
  ).rejects.toMatchObject({ code: 'unavailable' });
});

it('refuses to create a top-up charge', async () => {
  await expect(
    unavailableBackend.createRecharge({ amountInCents: 10_000, idempotencyKey: 'k' }),
  ).rejects.toMatchObject({ code: 'unavailable' });
});

it('refuses to publish a review instead of faking success', async () => {
  const error = await rejection(() =>
    unavailableBackend.submitReview({
      venueId: 'v',
      userId: 'u',
      authorName: 'Ana',
      stars: 5,
      text: 'Gostei do lugar.',
      idempotencyKey: 'review-unavailable-1',
    }),
  );

  expect(error.code).toBe('unavailable');
  expect(error.userMessage).toMatch(/rascunho/i);
});

it('refuses to report a balance rather than answering zero', async () => {
  // Answering "R$ 0,00" would be a fabricated fact about the user's money.
  await expect(unavailableBackend.fetchWalletBalance()).rejects.toMatchObject({
    code: 'unavailable',
  });
});

it('refuses to reserve tickets', async () => {
  await expect(
    unavailableBackend.createReservation({
      eventId: 'e',
      tierId: 't',
      quantity: 1,
      idempotencyKey: 'k',
    }),
  ).rejects.toMatchObject({ code: 'unavailable' });
});

it('reports ticket unavailability as a product state, not a crash', async () => {
  // §7: the event screen must render a disabled button with an explanation.
  const availability = await unavailableBackend.fetchTicketAvailability('any-event');

  expect(availability.kind).toBe('unavailable');
  if (availability.kind === 'unavailable') {
    expect(availability.reason).toBeTruthy();
  }
});

it('always allows local sign-out', async () => {
  // The device can always forget a token; blocking that would trap the user in a
  // session they asked to end.
  await expect(unavailableBackend.signOut('token')).resolves.toBeUndefined();
});

it('keeps technical detail out of the user-facing message', async () => {
  const error = await rejection(() =>
    unavailableBackend.createOrder({ venueId: 'v', items: [], idempotencyKey: 'k' }),
  );

  expect(error.detail).toContain('createOrder');
  expect(error.userMessage).not.toContain('createOrder');
});
