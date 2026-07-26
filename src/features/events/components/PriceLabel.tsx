import { Text, View } from 'react-native';

import { splitPriceLabel } from '@/utils/text';

export interface PriceLabelProps {
  price: string;
  className?: string;
}

/**
 * Renders an event's entry price.
 *
 * "A partir de R$ 50" splits into a muted qualifier above a white amount, while
 * a plain price such as "Entrada gratuita" renders as one green line — the
 * distinction the design draws between ranged and fixed pricing.
 */
export function PriceLabel({ price, className }: PriceLabelProps) {
  const { prefix, value } = splitPriceLabel(price);

  if (!prefix) {
    return <Text className="text-base font-extrabold text-primary">{value}</Text>;
  }

  return (
    <View className={className}>
      <Text className="text-2xs font-semibold text-[#8A8A8A]">{prefix}</Text>
      <Text className="text-md font-extrabold text-text">{value}</Text>
    </View>
  );
}
