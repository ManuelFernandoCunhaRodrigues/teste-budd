import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { EmptyState } from '@/components/feedback';
import { Screen } from '@/components/layout';
import { TAB_BAR_CONTENT_INSET } from '@/components/navigation';
import { BackButton } from '@/components/navigation/BackButton';
import { Button } from '@/components/ui';
import { EmptyBoxIcon } from '@/components/ui/icons';
import { ROUTES } from '@/constants/routes';
import { useCheckout } from '@/features/checkout/hooks/useCheckout';
import {
  selectCartCount,
  selectCartItems,
  selectCartSubtotalInCents,
  selectCartVenue,
  useCartStore,
} from '@/store/cartStore';

import { CartItemRow } from '../components/CartItemRow';
import { CartSummary } from '../components/CartSummary';

/** The order the user has assembled, ready for pickup checkout. */
export function CartScreen() {
  const router = useRouter();

  const items = useCartStore(selectCartItems);
  const venue = useCartStore(selectCartVenue);
  const itemCount = useCartStore(selectCartCount);
  const subtotalInCents = useCartStore(selectCartSubtotalInCents);
  const incrementLine = useCartStore((state) => state.incrementLine);
  const decrementLine = useCartStore((state) => state.decrementLine);
  const removeLine = useCartStore((state) => state.removeLine);
  const clear = useCartStore((state) => state.clear);

  const checkout = useCheckout();

  const isEmpty = itemCount === 0;

  const handleCheckout = async () => {
    const order = await checkout.submit();

    // Navigation happens only once the server returned an order. A failure keeps
    // the user here with their cart and an explanation.
    if (order) {
      router.push(ROUTES.order(order.id));
    }
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-4.5 pb-1.5 pt-3.5">
        <BackButton onPress={() => router.push('/role')} />

        <Text accessibilityRole="header" className="text-3xl font-extrabold text-text">
          Seu pedido
        </Text>

        {isEmpty ? (
          <View className="w-11" />
        ) : (
          <Button label="Limpar" onPress={clear} size="sm" variant="ghost" />
        )}
      </View>

      {isEmpty ? (
        <EmptyState
          description="Seus pedidos para retirada aparecerão aqui"
          icon={<EmptyBoxIcon color="#333333" size={120} />}
          muted
          title="Nenhum pedido para retirada"
        />
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Which venue this order belongs to — a cart holds one at a time. */}
            {venue ? (
              <Text className="px-4 pt-1 text-md font-bold text-text-soft">{venue.name}</Text>
            ) : null}

            <Text className="px-4 pb-2.5 pt-1 text-xs text-text-dim">
              Toque em Remover para tirar um item do pedido
            </Text>

            <View className="px-4">
              {items.map((item) => (
                <CartItemRow
                  item={item}
                  key={item.lineId}
                  onDecrement={() => decrementLine(item.lineId)}
                  onIncrement={() => incrementLine(item.lineId)}
                  onRemove={() => removeLine(item.lineId)}
                />
              ))}
            </View>

            {checkout.error ? (
              <Text
                accessibilityLiveRegion="polite"
                className="px-4 pt-3 text-sm text-danger-alt"
              >
                {checkout.error}
              </Text>
            ) : null}
          </ScrollView>

          <View style={{ paddingBottom: TAB_BAR_CONTENT_INSET - 40 }}>
            <CartSummary
              isSubmitting={checkout.status === 'submitting'}
              itemCount={itemCount}
              onCheckout={handleCheckout}
              subtotalInCents={subtotalInCents}
            />
          </View>
        </>
      )}
    </Screen>
  );
}
