import { Text, View } from 'react-native';

import { Badge, Button, GradientImage, Stepper } from '@/components/ui';
import type { Product } from '@/types/domain';
import { formatCents } from '@/utils/money';

import { useProductQuantity } from '../hooks/useProductQuantity';
import { PromoTag } from './PromoTag';

export interface ProductGridCardProps {
  product: Product;
}

/** A tile in the two-column "Destaques" grid. */
export function ProductGridCard({ product }: ProductGridCardProps) {
  const { quantity, showAddButton, increment, decrement } = useProductQuantity(product);

  return (
    <View className="flex-1">
      <GradientImage className="h-[130px] overflow-hidden rounded-lg" token={product.image}>
        {product.tag ? <Badge className="absolute left-2 top-2" label={product.tag} tone="dark" /> : null}
      </GradientImage>

      <View className="mt-2 flex-row items-center gap-2">
        <Text className="text-md font-extrabold text-text">
          {formatCents(product.priceInCents)}
        </Text>
        {product.discount ? <Badge label={product.discount} tone="tint" /> : null}
      </View>

      {product.promo ? <PromoTag label={product.promo} withIcon /> : null}

      <Text className="mt-1 text-base text-text-soft" numberOfLines={2}>
        {product.name}
      </Text>

      <View className="mt-2.5 flex-row items-center justify-between gap-2">
        {showAddButton ? (
          <Button
            className="px-3.5 py-[7px]"
            label="Adicionar"
            onPress={increment}
            size="sm"
          />
        ) : (
          <Stepper
            itemLabel={product.name}
            onDecrement={decrement}
            onIncrement={increment}
            quantity={quantity}
            size="sm"
          />
        )}
      </View>
    </View>
  );
}
