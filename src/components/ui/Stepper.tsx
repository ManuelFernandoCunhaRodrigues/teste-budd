import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

import { Touchable } from './Touchable';

export interface StepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** Name of the item being adjusted, for screen-reader announcements. */
  itemLabel: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BUTTON_SIZE = { sm: 28, md: 30, lg: 36 } as const;

/**
 * Quantity control.
 *
 * The visual buttons follow the design's compact sizes, but each carries a
 * `hitSlop` so the touch target still clears 44pt at the smallest size.
 */
export function Stepper({
  quantity,
  onIncrement,
  onDecrement,
  itemLabel,
  size = 'md',
  className,
}: StepperProps) {
  const dimension = BUTTON_SIZE[size];
  const slop = Math.max(0, (44 - dimension) / 2);

  return (
    <View className={cn('flex-row items-center gap-2.5', className)}>
      <Touchable
        accessibilityLabel={`Diminuir ${itemLabel}`}
        accessibilityRole="button"
        className="items-center justify-center rounded-full bg-surface-muted"
        hitSlop={slop}
        onPress={onDecrement}
        style={{ width: dimension, height: dimension }}
      >
        <Text className="text-lg leading-none text-text">−</Text>
      </Touchable>

      <Text
        accessibilityLabel={`${quantity} ${itemLabel}`}
        className="min-w-[16px] text-center text-md font-bold text-text"
      >
        {quantity}
      </Text>

      <Touchable
        accessibilityLabel={`Aumentar ${itemLabel}`}
        accessibilityRole="button"
        className="items-center justify-center rounded-full bg-primary"
        hitSlop={slop}
        onPress={onIncrement}
        style={{ width: dimension, height: dimension }}
      >
        <Text className="text-lg leading-none text-bg">+</Text>
      </Touchable>
    </View>
  );
}
