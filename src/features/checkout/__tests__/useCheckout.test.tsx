import { act, renderHook } from '@testing-library/react-native';

import { AppError } from '@/services/errors';
import { BARS, findVenueProduct } from '@/mocks/bars';
import { useCartStore } from '@/store/cartStore';
import type { Product } from '@/types/domain';

import { useCheckout } from '../hooks/useCheckout';

jest.mock('@/services/orders/orderService', () => ({
  createOrder: jest.fn(),
  startOrderPayment: jest.fn(),
  fetchOrder: jest.fn(),
  fetchPayment: jest.fn(),
}));

const { createOrder } = require('@/services/orders/orderService') as {
  createOrder: jest.Mock;
};

const VENUE = { id: BARS[0].id, name: BARS[0].name };

function seedCart() {
  const product = findVenueProduct(VENUE.id, 'chopp-artesanal-500') as Product;
  useCartStore.getState().addProduct({ venue: VENUE, product });
}

function fakeOrder(id = 'ord_1') {
  return {
    id,
    venueId: VENUE.id,
    venueName: VENUE.name,
    status: 'pending_payment' as const,
    lines: [],
    totals: {
      subtotalInCents: 1600,
      discountInCents: 0,
      serviceFeeInCents: 500,
      totalInCents: 2100,
    },
    createdAt: new Date().toISOString(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useCartStore.getState().clear();
});

it('does not create an order from an empty cart', async () => {
  createOrder.mockRejectedValue(
    new AppError('validation', { userMessage: 'Seu carrinho está vazio.' }),
  );

  const { result } = await renderHook(() => useCheckout());
  await act(async () => {
    await result.current.submit();
  });

  expect(result.current.status).toBe('error');
  expect(result.current.order).toBeNull();
});

it('keeps the cart when the API fails', async () => {
  seedCart();
  createOrder.mockRejectedValue(new AppError('unavailable'));

  const { result } = await renderHook(() => useCheckout());
  await act(async () => {
    await result.current.submit();
  });

  // The whole point of C-02: a failure must not cost the shopper their cart.
  expect(useCartStore.getState().items).toHaveLength(1);
  expect(result.current.status).toBe('error');
  expect(result.current.error).toBeTruthy();
});

it('shows no success on timeout, and keeps the cart', async () => {
  seedCart();
  createOrder.mockRejectedValue(new AppError('timeout'));

  const { result } = await renderHook(() => useCheckout());
  await act(async () => {
    await result.current.submit();
  });

  expect(result.current.status).not.toBe('success');
  expect(useCartStore.getState().items).toHaveLength(1);
});

it('surfaces a user-safe message, never technical detail', async () => {
  seedCart();
  createOrder.mockRejectedValue(
    new AppError('network', { detail: 'TypeError: Network request failed at line 42' }),
  );

  const { result } = await renderHook(() => useCheckout());
  await act(async () => {
    await result.current.submit();
  });

  expect(result.current.error).not.toContain('TypeError');
  expect(result.current.error).not.toContain('line 42');
});

it('does not clear the cart when the order is created but unpaid', async () => {
  seedCart();
  createOrder.mockResolvedValue(fakeOrder());

  const { result } = await renderHook(() => useCheckout());
  await act(async () => {
    await result.current.submit();
  });

  expect(result.current.status).toBe('success');
  expect(result.current.order?.status).toBe('pending_payment');
  // An order awaiting payment can still expire — clearing now would strand the
  // shopper with neither an order nor their items.
  expect(useCartStore.getState().items).toHaveLength(1);
});

it('reuses one idempotency key across a failed attempt and its retry', async () => {
  seedCart();
  createOrder.mockRejectedValueOnce(new AppError('timeout'));
  createOrder.mockResolvedValueOnce(fakeOrder());

  const { result } = await renderHook(() => useCheckout());
  await act(async () => {
    await result.current.submit();
  });
  await act(async () => {
    await result.current.submit();
  });

  expect(createOrder).toHaveBeenCalledTimes(2);
  const firstKey = createOrder.mock.calls[0][0].idempotencyKey;
  const secondKey = createOrder.mock.calls[1][0].idempotencyKey;
  // Same key, so the server resolves the retry to the original order.
  expect(secondKey).toBe(firstKey);
});

it('collapses a double tap into a single request', async () => {
  seedCart();
  createOrder.mockImplementation(
    () => new Promise((resolve) => setTimeout(() => resolve(fakeOrder()), 50)),
  );

  const { result } = await renderHook(() => useCheckout());
  await act(async () => {
    // Two taps in the same frame; the second must be dropped synchronously,
    // before any state update could disable the button.
    await Promise.all([result.current.submit(), result.current.submit()]);
  });

  expect(createOrder).toHaveBeenCalledTimes(1);
});

it('issues a fresh key after reset, so a new checkout is a new order', async () => {
  seedCart();
  createOrder.mockResolvedValue(fakeOrder());

  const { result } = await renderHook(() => useCheckout());
  await act(async () => {
    await result.current.submit();
  });
  act(() => {
    result.current.reset();
  });
  await act(async () => {
    await result.current.submit();
  });

  const firstKey = createOrder.mock.calls[0][0].idempotencyKey;
  const secondKey = createOrder.mock.calls[1][0].idempotencyKey;
  expect(secondKey).not.toBe(firstKey);
});

// The wire shape — quantities but no prices — is asserted directly against
// `buildOrderItems` in `domain/orders/__tests__/orderValidation.test.ts`, which
// is the function that decides it. Duplicating that through a rendered hook added
// no coverage and was sensitive to unmount timing.
