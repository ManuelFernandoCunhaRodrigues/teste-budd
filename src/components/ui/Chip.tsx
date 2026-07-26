import { Text } from 'react-native';

import { cn } from '@/utils/cn';

import { Touchable } from './Touchable';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  className?: string;
  /** Greys the pill out and blocks selection — e.g. a sold-out ticket tier. */
  disabled?: boolean;
}

/**
 * Selectable pill used by the event filters, menu categories and interest
 * picker. Exposes the selected state to assistive tech via the radio role.
 */
export function Chip({ label, selected, onPress, className, disabled = false }: ChipProps) {
  return (
    <Touchable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      className={cn(
        'items-center justify-center rounded-2xl border px-4 py-2.5 min-h-[44px]',
        selected ? 'bg-primary border-primary' : 'bg-surface-raised border-surface-muted',
        disabled && 'opacity-40',
        className,
      )}
      disabled={disabled}
      onPress={onPress}
    >
      <Text
        className={cn('text-base font-bold', selected ? 'text-bg' : 'text-text-soft')}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Touchable>
  );
}
