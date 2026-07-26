import { View } from 'react-native';

import type { Product } from '@/types/domain';

import { ProductGridCard } from './ProductGridCard';

export interface FeaturedGridProps {
  products: Product[];
}

/**
 * Two-column highlights grid.
 *
 * Built from rows of flex children rather than a `FlatList` because the list is
 * short, fixed, and always rendered inside a parent `ScrollView` — nesting a
 * virtualised list there would break scrolling.
 */
export function FeaturedGrid({ products }: FeaturedGridProps) {
  const rows: Product[][] = [];
  for (let index = 0; index < products.length; index += 2) {
    rows.push(products.slice(index, index + 2));
  }

  return (
    <View className="gap-3.5">
      {rows.map((row) => (
        <View className="flex-row gap-3.5" key={row.map((product) => product.id).join('-')}>
          {row.map((product) => (
            <ProductGridCard key={product.id} product={product} />
          ))}
          {/* Keeps a lone trailing card at half width. */}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}
