import { BARS } from '@/mocks/bars';
import type { MenuSection } from '@/types/domain';

import {
  buildMenuCategories,
  countMenuItems,
  FEATURED_CATEGORY_ID,
  filterMenuSections,
} from '../menuFilters';

const sections: MenuSection[] = BARS[0].sections;

describe('filterMenuSections', () => {
  it('"Destaques" keeps the whole menu', () => {
    expect(filterMenuSections(sections, FEATURED_CATEGORY_ID)).toHaveLength(sections.length);
  });

  it('a category returns only its own section', () => {
    // The A-04 defect: the chip changed colour and every section stayed on screen.
    const result = filterMenuSections(sections, 'drinks');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('drinks');
  });

  it('returns only items belonging to the selected category', () => {
    const drinks = filterMenuSections(sections, 'drinks');
    const expected = sections.find((section) => section.id === 'drinks');

    expect(countMenuItems(drinks)).toBe(expected?.items.length);
  });

  it('drops sections that have no items', () => {
    const withEmpty: MenuSection[] = [
      ...sections,
      { id: 'vazia', title: 'Vazia', items: [] },
    ];

    const result = filterMenuSections(withEmpty, FEATURED_CATEGORY_ID);
    expect(result.some((section) => section.id === 'vazia')).toBe(false);
  });

  it('returns nothing for an unknown category, so the screen can show an empty state', () => {
    expect(filterMenuSections(sections, 'categoria-inexistente')).toHaveLength(0);
  });

  it('does not mutate the input', () => {
    const before = sections.length;
    filterMenuSections(sections, 'drinks');
    expect(sections).toHaveLength(before);
  });
});

describe('buildMenuCategories', () => {
  it('starts with the highlights tab', () => {
    const categories = buildMenuCategories(sections);
    expect(categories[0].id).toBe(FEATURED_CATEGORY_ID);
  });

  it('derives one chip per section, keyed by section id', () => {
    const categories = buildMenuCategories(sections);

    // Ids, not labels: renaming a section title must not disable its filter.
    expect(categories.slice(1).map((category) => category.id)).toEqual(
      sections.map((section) => section.id),
    );
  });

  it('every chip selects a non-empty result', () => {
    // Guards against a chip that filters to nothing — a control that looks
    // active and shows an empty menu.
    for (const category of buildMenuCategories(sections)) {
      expect(filterMenuSections(sections, category.id).length).toBeGreaterThan(0);
    }
  });

  it('takes labels from the venue own sections', () => {
    const categories = buildMenuCategories(sections);
    expect(categories.slice(1).map((category) => category.label)).toEqual(
      sections.map((section) => section.title),
    );
  });
});
