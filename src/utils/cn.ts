type ClassValue = string | false | null | undefined;

/**
 * Joins Tailwind class strings, dropping falsy entries.
 *
 * Deliberately tiny — the project has no conditional-class edge cases that
 * would justify pulling in `clsx`/`tailwind-merge`. Later classes do not
 * override earlier ones, so avoid passing two classes for the same property.
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
