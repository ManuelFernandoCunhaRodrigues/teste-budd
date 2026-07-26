import { Text, View } from 'react-native';

import { Badge, Button, GradientImage, Stepper } from '@/components/ui';
import type { Product } from '@/types/domain';
import { formatCents } from '@/utils/money';

import { useProductQuantity } from '../hooks/useProductQuantity';
import { PromoTag } from './PromoTag';

export interface ProductListRowProps {
  product: Product;
}

/** A full-width menu row: details on the left, artwork on the right. */
export function ProductListRow({ product }: ProductListRowProps) {
  const { quantity, showAddButton, increment, decrement } = useProductQuantity(product);

  return (
    <View className="flex-row items-center gap-3.5 border-t border-border-subtle py-3.5">
      <View className="min-w-0 flex-1">
        <Text className="text-lg font-bold leading-tight text-text" numberOfLines={2}>
          {product.name}
        </Text>

        {product.description ? (
          <Text className="mt-1.5 text-sm leading-[18px] text-text-muted" numberOfLines={2}>
            {product.description}
          </Text>
        ) : null}

        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          <Text className="text-md font-extrabold text-text">
            {formatCents(product.priceInCents)}
          </Text>
          {product.oldPriceInCents !== undefined ? (
            <Text className="text-sm text-[#6A6A6A] line-through">
              {formatCents(product.oldPriceInCents)}
            </Text>
          ) : null}
          {product.discount ? <Badge label={product.discount} tone="tint" /> : null}
        </View>

        {product.promoNote ? <PromoTag label={product.promoNote} /> : null}

        <View className="mt-2.5 flex-row items-center justify-between gap-2">
          {showAddButton ? (
            <Button className="px-4 py-2" label="Adicionar" onPress={increment} size="sm" />
          ) : (
            <Stepper
              itemLabel={product.name}
              onDecrement={decrement}
              onIncrement={increment}
              quantity={quantity}
            />
          )}
        </View>
      </View>

      <GradientImage className="h-[104px] w-[104px] rounded-lg" token={product.image} />
    </View>
  );
}
