import { Text, View } from 'react-native';

import { GradientImage, Stepper, Touchable } from '@/components/ui';
import { TrashIcon } from '@/components/ui/icons';
import type { CartItem } from '@/domain/cart/cartTypes';
import { colors } from '@/theme';
import { formatCents, multiplyCents } from '@/utils/money';

export interface CartItemRowProps {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

/** One order line: artwork, details, remove action and quantity stepper. */
export function CartItemRow({ item, onIncrement, onDecrement, onRemove }: CartItemRowProps) {
  const subtotalInCents = multiplyCents(item.unitPriceInCents, item.quantity);

  return (
    <View className="flex-row items-center gap-3.5 border-t border-surface-alt py-3.5">
      <GradientImage className="h-20 w-20 rounded-lg" token={item.imageToken ?? 'neutral'} />

      <View className="min-w-0 flex-1">
        <Text className="text-lg font-bold leading-tight text-text" numberOfLines={2}>
          {item.name}
        </Text>

        <Text className="mt-1 text-sm text-text-muted">Disponível em estoque</Text>

        <View className="mt-1.5 flex-row items-baseline gap-2">
          <Text className="text-md font-extrabold text-primary">
            {formatCents(item.unitPriceInCents)}
          </Text>
          {/* Only worth showing once the line covers more than one item. */}
          {item.quantity > 1 ? (
            <Text className="text-sm text-text-dim">· subtotal {formatCents(subtotalInCents)}</Text>
          ) : null}
        </View>

        <Touchable
          accessibilityLabel={`Remover ${item.name} do pedido`}
          accessibilityRole="button"
          className="flex-row items-center gap-1.5 pb-1 pt-2"
          hitSlop={6}
          onPress={onRemove}
        >
          <TrashIcon color={colors.dangerAlt} size={15} />
          <Text className="text-sm font-bold text-danger-alt">Remover</Text>
        </Touchable>
      </View>

      <Stepper
        itemLabel={item.name}
        onDecrement={onDecrement}
        onIncrement={onIncrement}
        quantity={item.quantity}
        size="lg"
      />
    </View>
  );
}
