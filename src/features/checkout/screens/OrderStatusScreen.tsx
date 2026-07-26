import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/feedback';
import { Screen, ScreenHeader } from '@/components/layout';
import { Button, Divider } from '@/components/ui';
import { isOrderSettled } from '@/domain/orders/orderTypes';
import { isSettling } from '@/domain/payments/paymentStatus';
import { formatCents } from '@/utils/money';

import { PixChargePanel } from '../components/PixChargePanel';
import { useOrderPayment } from '../hooks/useOrderPayment';

export interface OrderStatusScreenProps {
  orderId: string;
}

/**
 * What happened to one order.
 *
 * This screen exists because the old checkout had nowhere to show "created but
 * not paid" — so it showed success instead. Every figure here comes from the
 * server's own pricing, never from the cart.
 */
export function OrderStatusScreen({ orderId }: OrderStatusScreenProps) {
  const router = useRouter();
  const { status, order, payment, error, isWorking, refresh, startPix, retry } =
    useOrderPayment(orderId);

  if (status === 'loading' && !order) {
    return (
      <Screen>
        <ScreenHeader backFallbackHref="/role" title="Seu pedido" />
        <LoadingState description="Buscando seu pedido…" title="Carregando" />
      </Screen>
    );
  }

  if (status === 'error' && !order) {
    return (
      <Screen>
        <ScreenHeader backFallbackHref="/role" title="Seu pedido" />
        <ErrorState description={error ?? undefined} onRetry={refresh} />
      </Screen>
    );
  }

  if (!order) return null;

  const settled = isOrderSettled(order.status);
  const awaiting = payment !== null && isSettling(payment.status);

  return (
    <Screen contentClassName="pb-10" scroll>
      <ScreenHeader backFallbackHref="/role" title="Seu pedido" />

      <View className="px-4.5">
        <Text accessibilityRole="header" className="text-3xl font-extrabold text-text">
          {settled ? 'Pedido confirmado' : 'Pedido aguardando pagamento'}
        </Text>

        <Text className="mt-1 text-md text-text-muted">
          {order.venueName} • nº {order.id}
        </Text>

        {/* Server-priced lines. The cart's running subtotal is not used here. */}
        <View className="mt-5 rounded-xl border border-border bg-surface p-4">
          {order.lines.map((line) => (
            <View className="flex-row justify-between py-1.5" key={line.productId}>
              <Text className="flex-1 text-md text-text-soft">
                {line.quantity}× {line.name}
              </Text>
              <Text className="text-md font-bold text-text">{formatCents(line.totalInCents)}</Text>
            </View>
          ))}

          <Divider className="my-2.5" />

          <Row label="Subtotal" value={formatCents(order.totals.subtotalInCents)} />
          {order.totals.discountInCents > 0 ? (
            <Row label="Desconto" value={`- ${formatCents(order.totals.discountInCents)}`} />
          ) : null}
          <Row label="Taxa de serviço" value={formatCents(order.totals.serviceFeeInCents)} />

          <Divider className="my-2.5" />

          <View className="flex-row justify-between">
            <Text className="text-lg font-extrabold text-text">Total</Text>
            <Text className="text-lg font-black text-primary">
              {formatCents(order.totals.totalInCents)}
            </Text>
          </View>
        </View>

        {error ? (
          <Text accessibilityLiveRegion="polite" className="mt-3.5 text-sm text-danger-alt">
            {error}
          </Text>
        ) : null}

        {settled ? (
          <>
            <Text className="mt-5 text-md text-text-soft">
              Pagamento confirmado. Retire seu pedido no balcão apresentando o número acima.
            </Text>
            <Button
              className="mt-5"
              fullWidth
              label="Voltar ao início"
              onPress={() => router.replace('/role')}
              size="lg"
            />
          </>
        ) : null}

        {/* Rendered only when the server actually sent a charge — the payload and
            expiry are never reconstructed on the device. */}
        {!settled && awaiting && payment?.charge ? (
          <View className="mt-5">
            <PixChargePanel
              charge={payment.charge}
              isRefreshing={isWorking}
              onRefresh={refresh}
              onRetry={retry}
              status={payment.status}
            />
          </View>
        ) : null}

        {!settled && !awaiting ? (
          <Button
            className="mt-5"
            fullWidth
            label={payment ? 'Gerar nova cobrança PIX' : 'Pagar com PIX'}
            loading={isWorking}
            onPress={payment ? retry : startPix}
            size="lg"
          />
        ) : null}

        {!settled ? (
          <Text className="mt-3.5 text-center text-xs text-text-dim">
            Seu carrinho fica guardado até o pagamento ser confirmado.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-md text-text-muted">{label}</Text>
      <Text className="text-md text-text-softer">{value}</Text>
    </View>
  );
}
