import { ScrollView } from 'react-native';

import { Chip } from '@/components/ui';
import type { MenuCategoryOption } from '@/domain/catalog/menuFilters';

export interface CategoryChipsProps {
  categories: readonly MenuCategoryOption[];
  /** Id of the active category, not its label. */
  selectedId: string;
  onSelect: (categoryId: string) => void;
  /** Horizontal padding applied inside the scroll area. */
  contentClassName?: string;
}

/**
 * Horizontally scrolling filter chips.
 *
 * Selection is by id: the label is presentation, and tying behaviour to it means
 * a copy change silently disables the filter.
 */
export function CategoryChips({
  categories,
  selectedId,
  onSelect,
  contentClassName = 'px-4 gap-2.5',
}: CategoryChipsProps) {
  return (
    <ScrollView
      contentContainerClassName={contentClassName}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {categories.map((category) => (
        <Chip
          key={category.id}
          label={category.label}
          onPress={() => onSelect(category.id)}
          selected={selectedId === category.id}
        />
      ))}
    </ScrollView>
  );
}
