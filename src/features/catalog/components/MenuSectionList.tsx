import { Text, View } from 'react-native';

import type { MenuSection } from '@/types/domain';

import { ProductListRow } from './ProductListRow';

export interface MenuSectionListProps {
  sections: MenuSection[];
}

/** The full menu, rendered as titled groups of product rows. */
export function MenuSectionList({ sections }: MenuSectionListProps) {
  return (
    <View>
      {sections.map((section) => (
        <View className="pt-3" key={section.id}>
          <Text accessibilityRole="header" className="mb-1.5 text-3xl font-extrabold text-text">
            {section.title}
          </Text>
          {section.items.map((product) => (
            <ProductListRow key={product.id} product={product} />
          ))}
        </View>
      ))}
    </View>
  );
}
