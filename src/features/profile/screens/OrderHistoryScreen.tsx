import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { EmptyState, ErrorState } from '@/components/feedback';
import { Screen, ScreenHeader } from '@/components/layout';
import { IconButton, Skeleton } from '@/components/ui';
import { CalendarHeaderIcon, EmptyBagIcon } from '@/components/ui/icons';
import type { Order } from '@/domain/orders/orderTypes';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchOrders } from '@/services/orders/orderService';
import { colors } from '@/theme';
import {
  canGoToNextMonth,
  canGoToPreviousMonth,
  clampMonthOffset,
  formatMonthLabel,
  isWithinMonth,
} from '@/utils/formatDate';
import { formatCents } from '@/utils/money';

/**
 * Past orders, browsable one month at a time.
 *
 * Two things were wrong (M-04). The stepper let you walk forward forever into
 * months that cannot contain orders, and there was no data source at all, so
 * every month rendered the same empty state — indistinguishable from "we could
 * not load your history".
 */
export function OrderHistoryScreen() {
  const [monthOffset, setMonthOffset] = useState(0);
  const { data: orders, status, error, reload } = useAsyncData<Order[]>(fetchOrders, 'orders');

  const monthOrders = useMemo(
    () => (orders ?? []).filter((order) => isWithinMonth(order.createdAt, monthOffset)),
    [orders, monthOffset],
  );

  const canGoBack = canGoToPreviousMonth(monthOffset);
  const canGoForward = canGoToNextMonth(monthOffset);

  const step = (delta: number) => setMonthOffset((value) => clampMonthOffset(value + delta));

  return (
    <Screen>
      <ScreenHeader backFallbackHref="/profile" title="Histórico de Compras" />

      <View className="flex-1 px-4.5">
        <View className="flex-row items-center justify-between rounded-lg border border-border-green px-3.5 py-3">
          <IconButton
            accessibilityLabel="Mês anterior"
            accessibilityState={{ disabled: !canGoBack }}
            disabled={!canGoBack}
            onPress={() => step(-1)}
            size={40}
            variant="neutral"
          >
            <Text className={canGoBack ? 'text-2xl text-primary' : 'text-2xl text-text-dim'}>‹</Text>
          </IconButton>

          <View className="flex-row items-center gap-2">
            <CalendarHeaderIcon size={18} />
            <Text className="text-lg font-extrabold text-text">
              {formatMonthLabel(monthOffset)}
            </Text>
          </View>

          {/* Disabled at the current month: there is no future to browse. */}
          <IconButton
            accessibilityLabel="Próximo mês"
            accessibilityState={{ disabled: !canGoForward }}
            disabled={!canGoForward}
            onPress={() => step(1)}
            size={40}
            variant="neutral"
          >
            <Text className={canGoForward ? 'text-2xl text-primary' : 'text-2xl text-text-dim'}>
              ›
            </Text>
          </IconButton>
        </View>

        {status === 'loading' ? (
          <View className="gap-3 pt-4">
            <Skeleton className="h-[76px] rounded-xl" />
            <Skeleton className="h-[76px] rounded-xl" />
          </View>
        ) : null}

        {/* A load failure is not the same as an empty month, and no longer looks
            like one. */}
        {status === 'error' ? (
          <ErrorState className="py-16" description={error?.message} onRetry={reload} />
        ) : null}

        {status === 'success' ? (
          <FlatList
            ListEmptyComponent={
              <EmptyState
                description="Suas compras aparecerão aqui"
                icon={<EmptyBagIcon color="#333333" size={90} />}
                muted
                title="Nenhuma compra neste mês"
              />
            }
            contentContainerClassName="gap-3 pt-4 pb-8"
            data={monthOrders}
            keyExtractor={(order) => order.id}
            renderItem={({ item }) => <OrderRow order={item} />}
            showsVerticalScrollIndicator={false}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const STATUS_LABELS: Record<Order['status'], string> = {
  pending_payment: 'Aguardando pagamento',
  confirmed: 'Confirmado',
  preparing: 'Em preparo',
  ready: 'Pronto para retirada',
  cancelled: 'Cancelado',
  failed: 'Não concluído',
};

function OrderRow({ order }: { order: Order }) {
  const itemCount = order.lines.reduce((total, line) => total + line.quantity, 0);

  return (
    <View
      accessibilityLabel={`Pedido em ${order.venueName}, ${STATUS_LABELS[order.status]}, ${formatCents(
        order.totals.totalInCents,
      )}`}
      className="rounded-xl border border-border bg-surface p-4"
    >
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-lg font-bold text-text" numberOfLines={1}>
          {order.venueName}
        </Text>
        <Text className="text-lg font-black text-primary">
          {formatCents(order.totals.totalInCents)}
        </Text>
      </View>

      <Text className="mt-1 text-sm text-text-muted">
        {itemCount} {itemCount === 1 ? 'item' : 'itens'} • {STATUS_LABELS[order.status]}
      </Text>

      <Text className="mt-0.5 text-xs" style={{ color: colors.textDim }}>
        nº {order.id}
      </Text>
    </View>
  );
}
