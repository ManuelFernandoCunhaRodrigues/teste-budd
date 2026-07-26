import { Text, type TextProps } from 'react-native';

import { cn } from '@/utils/cn';

export type TypographyVariant =
  | 'display'
  | 'title'
  | 'sectionTitle'
  | 'cardTitle'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label'
  | 'price'
  | 'overline';

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  className?: string;
}

/**
 * Centralises the type ramp so screens don't re-derive font size + weight +
 * colour combinations. Pass `className` to adjust colour or alignment for a
 * one-off without inventing a new variant.
 */
const VARIANTS: Record<TypographyVariant, string> = {
  display: 'text-7xl font-black text-text',
  title: 'text-5xl font-extrabold text-text',
  sectionTitle: 'text-3xl font-extrabold text-text',
  cardTitle: 'text-lg font-extrabold text-text',
  body: 'text-base text-text-soft',
  bodyStrong: 'text-md font-bold text-text',
  caption: 'text-sm text-text-muted',
  label: 'text-xs text-text-muted',
  price: 'text-md font-extrabold text-text',
  overline: 'text-sm font-bold text-text-dim uppercase tracking-wide',
};

export function Typography({ variant = 'body', className, ...props }: TypographyProps) {
  return <Text className={cn(VARIANTS[variant], className)} {...props} />;
}
