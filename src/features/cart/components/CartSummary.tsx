import { Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { formatCents, type MoneyInCents } from '@/utils/money';

export interface CartSummaryProps {
  itemCount: number;
  /** Running subtotal for display. The server sets what is actually charged. */
  subtotalInCents: MoneyInCents;
  onCheckout: () => void;
  /** True while the order request is open, so the button cannot fire twice. */
  isSubmitting?: boolean;
  disabled?: boolean;
}

/** Sticky order total and checkout action. */
export function CartSummary({
  itemCount,
  subtotalInCents,
  onCheckout,
  isSubmitting = false,
  disabled = false,
}: CartSummaryProps) {
  return (
    <View className="border-t border-border-muted px-4.5 pb-6 pt-4">
      <View className="flex-row justify-between">
        <Text className="text-base text-text-muted">
          {itemCount} {itemCount === 1 ? 'item' : 'itens'}
        </Text>
        <Text className="text-base text-text-muted">Subtotal</Text>
      </View>

      <View className="mt-1.5 flex-row justify-between">
        <Text className="text-2xl font-extrabold text-text">Total</Text>
        <Text className="text-2xl font-extrabold text-primary">{formatCents(subtotalInCents)}</Text>
      </View>

      {/* Taxes and fees are resolved server-side, so the figure above is a
          subtotal until the order comes back priced. */}
      <Text className="mt-1 text-xs text-text-dim">
        Taxas e descontos são calculados na confirmação do pedido
      </Text>

      <Button
        className="mt-4"
        disabled={disabled}
        fullWidth
        label="Finalizar pedido"
        loading={isSubmitting}
        onPress={onCheckout}
        size="lg"
      />
    </View>
  );
}
