import { Text, View, type AccessibilityActionEvent } from 'react-native';

import { colors } from '@/theme';
import { cn } from '@/utils/cn';

import { Touchable } from './Touchable';

export interface StarRatingProps {
  /** Currently selected star count, 0-5. */
  value: number;
  /** Omit to render a read-only rating. */
  onChange?: (value: number) => void;
  className?: string;
}

const STARS = [1, 2, 3, 4, 5];

/** Five-star picker used by the review composer. */
export function StarRating({ value, onChange, className }: StarRatingProps) {
  const rating = clampRating(value);
  const readOnly = !onChange;
  const accessibilityLabel = `Avaliação: ${rating} de 5 estrelas.`;

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (!onChange) return;

    if (event.nativeEvent.actionName === 'increment') {
      onChange(clampRating(rating + 1));
    }

    if (event.nativeEvent.actionName === 'decrement') {
      onChange(clampRating(rating - 1));
    }
  };

  return (
    <View
      accessibilityActions={
        readOnly
          ? undefined
          : [
              { name: 'increment', label: 'Aumentar avaliação' },
              { name: 'decrement', label: 'Diminuir avaliação' },
            ]
      }
      accessibilityHint={
        readOnly ? undefined : 'Ajuste a nota com as ações de aumentar ou diminuir.'
      }
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={readOnly ? 'text' : 'adjustable'}
      accessibilityValue={{ min: 0, max: 5, now: rating, text: `${rating} de 5 estrelas` }}
      accessible
      className={cn('flex-row gap-2', className)}
      onAccessibilityAction={readOnly ? undefined : handleAccessibilityAction}
    >
      {STARS.map((star) => {
        const filled = star <= rating;

        if (readOnly) {
          return (
            <Text
              accessibilityElementsHidden
              importantForAccessibility="no"
              key={star}
              className="text-3xl leading-none"
              style={{ color: filled ? colors.primary : colors.surfaceMuted }}
            >
              ★
            </Text>
          );
        }

        return (
          <Touchable
            accessible={false}
            hitSlop={8}
            importantForAccessibility="no"
            key={star}
            onPress={() => onChange(star)}
          >
            <Text
              accessibilityElementsHidden
              importantForAccessibility="no"
              className="text-[30px] leading-none"
              style={{ color: filled ? colors.primary : colors.surfaceMuted }}
            >
              ★
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}

export interface RatingLabelProps {
  rating: string | number;
  className?: string;
}

/** Compact star label used on cards. */
export function RatingLabel({ rating, className }: RatingLabelProps) {
  return (
    <Text
      accessibilityLabel={`Avaliação ${rating} de 5`}
      className={cn('text-sm font-bold text-primary', className)}
    >
      ★ {rating}
    </Text>
  );
}

function clampRating(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(5, Math.max(0, Math.round(value)));
}
