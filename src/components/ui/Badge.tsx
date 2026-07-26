import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

export type BadgeTone = 'primary' | 'bar' | 'tint' | 'dark' | 'neutral';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  className?: string;
}

const TONE: Record<BadgeTone, { container: string; label: string }> = {
  /** Green pill on event artwork. */
  primary: { container: 'bg-primary', label: 'text-bg font-extrabold' },
  /** Orange pill marking a venue. */
  bar: { container: 'bg-badge-bar', label: 'text-text font-bold' },
  /** Green-on-dark pill for discounts and counters. */
  tint: { container: 'bg-primary-tint', label: 'text-primary font-extrabold' },
  /** Translucent dark pill on product artwork. */
  dark: { container: 'bg-black/70', label: 'text-text font-bold' },
  neutral: { container: 'bg-surface-raised', label: 'text-text-soft font-bold' },
};

export function Badge({ label, tone = 'primary', className }: BadgeProps) {
  const styles = TONE[tone];

  return (
    <View className={cn('self-start rounded-2xl px-2.5 py-[3px]', styles.container, className)}>
      <Text className={cn('text-2xs', styles.label)}>{label}</Text>
    </View>
  );
}
