import { renderHook, waitFor } from '@testing-library/react-native';

import type { Order } from '@/domain/orders/orderTypes';
import { BARS, findVenueProduct } from '@/mocks/bars';
import { AppError } from '@/services/errors';
import { useCartStore } from '@/store/cartStore';
import type { Product } from '@/types/domain';

import { useOrderPayment } from '../hooks/useOrderPayment';

jest.mock('@/services/orders/orderService', () => ({
  createOrder: jest.fn(),
  startOrderPayment: jest.fn(),
  fetchOrder: jest.fn(),
  fetchPayment: jest.fn(),
}));

const { fetchOrder, fetchPayment } = require('@/services/orders/orderService') as {
  fetchOrder: jest.Mock;
  fetchPayment: jest.Mock;
};

const VENUE = { id: BARS[0].id, name: BARS[0].name };

function seedCart() {
  const product = findVenueProduct(VENUE.id, 'chopp-artesanal-500') as Product;
  useCartStore.getState().addProduct({ venue: VENUE, product });
}

function order(status: Order['status'], paymentId?: string): Order {
  return {
    id: 'ord_1',
    venueId: VENUE.id,
    venueName: VENUE.name,
    status,
    lines: [],
    totals: {
      subtotalInCents: 1600,
      discountInCents: 0,
      serviceFeeInCents: 500,
      totalInCents: 2100,
    },
    ...(paymentId ? { paymentId } : {}),
    createdAt: new Date().toISOString(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useCartStore.getState().clear();
});

/**
 * The cart-clearing rule (§6.2) from the other side.
 *
 * `useCheckout` proves a failure keeps the cart; these prove the cart is cleared
 * on confirmation and *only* on confirmation.
 */

it('keeps the cart while the order is awaiting payment', async () => {
  seedCart();
  fetchOrder.mockResolvedValue(order('pending_payment', 'pay_1'));
  fetchPayment.mockResolvedValue({
    id: 'pay_1',
    status: 'pending',
    method: 'pix',
    amountInCents: 2100,
    chargeId: 'chg_1',
    charge: {
      chargeId: 'chg_1',
      status: 'pending',
      amountInCents: 2100,
      qrCodePayload: 'payload',
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    },
  });

  const { result } = await renderHook(() => useOrderPayment('ord_1'));
  await waitFor(() => expect(result.current.status).toBe('ready'));

  // `pending` is not `paid`: the shopper keeps their items until it settles.
  expect(useCartStore.getState().items).toHaveLength(1);
});

it('clears the cart once the order is confirmed', async () => {
  seedCart();
  fetchOrder.mockResolvedValue(order('confirmed', 'pay_1'));
  fetchPayment.mockResolvedValue({
    id: 'pay_1',
    status: 'paid',
    method: 'pix',
    amountInCents: 2100,
  });

  const { result } = await renderHook(() => useOrderPayment('ord_1'));
  await waitFor(() => expect(result.current.status).toBe('ready'));

  expect(useCartStore.getState().items).toHaveLength(0);
  expect(useCartStore.getState().venue).toBeNull();
});

it('does not clear the cart when the charge expired', async () => {
  seedCart();
  fetchOrder.mockResolvedValue(order('pending_payment', 'pay_1'));
  fetchPayment.mockResolvedValue({
    id: 'pay_1',
    status: 'expired',
    method: 'pix',
    amountInCents: 2100,
    chargeId: 'chg_1',
  });

  const { result } = await renderHook(() => useOrderPayment('ord_1'));
  await waitFor(() => expect(result.current.status).toBe('ready'));

  // Otherwise the shopper would have neither an order nor their items.
  expect(useCartStore.getState().items).toHaveLength(1);
});

it('keeps the cart when the order cannot be read', async () => {
  seedCart();
  fetchOrder.mockRejectedValue(new AppError('network'));

  const { result } = await renderHook(() => useOrderPayment('ord_1'));
  await waitFor(() => expect(result.current.status).toBe('error'));

  expect(useCartStore.getState().items).toHaveLength(1);
  expect(result.current.error).toBeTruthy();
});

it('surfaces the server charge rather than reconstructing one', async () => {
  fetchOrder.mockResolvedValue(order('pending_payment', 'pay_1'));
  fetchPayment.mockResolvedValue({
    id: 'pay_1',
    status: 'pending',
    method: 'pix',
    amountInCents: 2100,
    chargeId: 'chg_1',
    charge: {
      chargeId: 'chg_1',
      status: 'pending',
      amountInCents: 2100,
      qrCodePayload: '00020126-REAL-PAYLOAD',
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    },
  });

  const { result } = await renderHook(() => useOrderPayment('ord_1'));
  await waitFor(() => expect(result.current.payment).not.toBeNull());

  // A synthesised payload would be unpayable, so it must come from the server.
  expect(result.current.payment?.charge?.qrCodePayload).toBe('00020126-REAL-PAYLOAD');
});
