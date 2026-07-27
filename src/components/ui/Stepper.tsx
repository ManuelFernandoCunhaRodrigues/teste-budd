import { Text, View } from 'react-native';

import { colors } from '@/theme';
import { cn } from '@/utils/cn';

import { MinusIcon, PlusIcon } from './icons';
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
/** Glyph kept near 45% of the button so the stroke reads at every size. */
const GLYPH_SIZE = { sm: 13, md: 14, lg: 16 } as const;

/**
 * Quantity control.
 *
 * The visual buttons follow the design's compact sizes, but each carries a
 * `hitSlop` so the touch target still clears 44pt at the smallest size.
 *
 * Deliberately unbounded: the cart treats a decrement at 1 as "remove this
 * line", so clamping here would silently strand the last unit of an item.
 * Callers that need a floor stop calling, they do not ask this to stop asking.
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
  const glyph = GLYPH_SIZE[size];
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
        <MinusIcon color={colors.text} size={glyph} />
      </Touchable>

      <Text
        accessibilityLabel={`${quantity} ${itemLabel}`}
        // Announced on change, so a screen-reader user hears the result of the
        // tap instead of having to seek back to this label to discover it.
        accessibilityLiveRegion="polite"
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
        <PlusIcon color={colors.background} size={glyph} />
      </Touchable>
    </View>
  );
}
