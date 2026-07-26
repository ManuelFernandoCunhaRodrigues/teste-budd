import { Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { formatCents, type MoneyInCents } from '@/utils/money';

export interface CartBarProps {
  itemCount: number;
  subtotalInCents: MoneyInCents;
  onPress: () => void;
}

/** Sticky footer that appears once the order has at least one item. */
export function CartBar({ itemCount, subtotalInCents, onPress }: CartBarProps) {
  const formatted = formatCents(subtotalInCents);

  return (
    <View className="border-t border-surface-raised bg-[#0A0A0A] px-4 pb-5 pt-3">
      <Button
        accessibilityLabel={`Ver carrinho, ${itemCount} itens, subtotal ${formatted}`}
        fullWidth
        label="Ver carrinho"
        leading={
          <View className="h-6 min-w-[24px] items-center justify-center rounded-full bg-[#0A0A0A] px-1.5">
            <Text className="text-sm text-primary">{itemCount}</Text>
          </View>
        }
        onPress={onPress}
        size="lg"
        trailing={<Text className="text-lg font-extrabold text-bg">{formatted}</Text>}
      />
    </View>
  );
}
