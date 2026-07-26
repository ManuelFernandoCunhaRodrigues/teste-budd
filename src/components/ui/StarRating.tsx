import { Text, View } from 'react-native';

import { colors } from '@/theme';
import { cn } from '@/utils/cn';

import { Touchable } from './Touchable';

export interface StarRatingProps {
  /** Currently selected star count, 0–5. */
  value: number;
  /** Omit to render a read-only rating. */
  onChange?: (value: number) => void;
  className?: string;
}

const STARS = [1, 2, 3, 4, 5];

/** Five-star picker used by the review composer. */
export function StarRating({ value, onChange, className }: StarRatingProps) {
  const readOnly = !onChange;

  return (
    <View
      accessibilityRole={readOnly ? 'text' : 'radiogroup'}
      accessibilityLabel={`${value} de 5 estrelas`}
      className={cn('flex-row gap-2', className)}
    >
      {STARS.map((star) => {
        const filled = star <= value;

        if (readOnly) {
          return (
            <Text key={star} className="text-3xl leading-none" style={{ color: filled ? colors.primary : colors.surfaceMuted }}>
              ★
            </Text>
          );
        }

        return (
          <Touchable
            accessibilityLabel={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: filled }}
            hitSlop={8}
            key={star}
            onPress={() => onChange(star)}
          >
            <Text
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

/** Compact `★ 4.9` label used on cards. */
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
