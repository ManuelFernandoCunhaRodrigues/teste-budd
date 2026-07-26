import type { MenuSection } from '@/types/domain';

/**
 * Menu category filtering.
 *
 * Keyed by section id rather than by the visible title: `selected === 'Bebidas'`
 * breaks as soon as the copy is retouched or translated. The chips previously
 * changed colour and nothing else — `MenuSectionList` always rendered every
 * section (A-04).
 */

/** `'featured'` is the highlights view; every other id is a section id. */
export type MenuCategoryId = string;

export interface MenuCategoryOption {
  id: MenuCategoryId;
  label: string;
}

/** The highlights tab, which shows the featured grid plus the whole menu. */
export const FEATURED_CATEGORY_ID = 'featured';

/**
 * Sections to render for a category.
 *
 * Returns a new array — the caller's data is never mutated. Sections that end up
 * with no items are dropped rather than rendered as an empty heading.
 */
export function filterMenuSections(
  sections: readonly MenuSection[],
  categoryId: MenuCategoryId,
): MenuSection[] {
  if (categoryId === FEATURED_CATEGORY_ID) {
    return sections.filter((section) => section.items.length > 0);
  }

  return sections
    .filter((section) => section.id === categoryId)
    .filter((section) => section.items.length > 0);
}

/** Total products on show, for an empty-state check. */
export function countMenuItems(sections: readonly MenuSection[]): number {
  return sections.reduce((total, section) => total + section.items.length, 0);
}

/** Builds the chip options from the venue's own sections. */
export function buildMenuCategories(sections: readonly MenuSection[]): MenuCategoryOption[] {
  return [
    { id: FEATURED_CATEGORY_ID, label: 'Destaques' },
    ...sections.map((section) => ({ id: section.id, label: section.title })),
  ];
}
