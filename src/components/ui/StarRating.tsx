import { Text, View, type AccessibilityActionEvent } from 'react-native';

import { colors } from '@/theme';
import { cn } from '@/utils/cn';
import { formatRating, MAX_RATING, parseRating } from '@/utils/rating';

import { StarIcon } from './icons';
import { Touchable } from './Touchable';

/** Keeps every star's tap target at or above the 44pt minimum. */
const MIN_TOUCH_TARGET = 44;
const DEFAULT_SPACING = 4;

export interface StarRatingProps {
  /** Currently selected star count, 0-5. */
  value: number | string;
  /** Omit to render a read-only rating. */
  onChange?: (value: number) => void;
  /** Maximum score. Defaults to the product-wide five-star scale. */
  max?: number;
  /** Edge length of one star. */
  size?: number;
  /** Space between stars, in points. */
  spacing?: number;
  /** Forces display mode even when an `onChange` callback was provided. */
  readonly?: boolean;
  /** React-style alias kept for callers that prefer camel case. */
  readOnly?: boolean;
  /** Keeps the picker layout visible while preventing changes. */
  disabled?: boolean;
  className?: string;
}

/**
 * Five-star display and picker.
 *
 * Stars are SVG, never a text glyph — see `StarIcon` for why that distinction
 * is load-bearing rather than stylistic.
 *
 * Accessibility is exposed twice over, because the two modes want different
 * things. Read-only, the group is a single `text` node announcing the score, so
 * a screen reader says it once instead of five times. Interactive, the group is
 * `adjustable` for swipe-to-change, *and* each star stays individually
 * focusable with its own label, so someone who navigates element by element can
 * still set an exact score.
 */
export function StarRating({
  value,
  onChange,
  max = MAX_RATING,
  size = 28,
  spacing = DEFAULT_SPACING,
  readonly: readonlyProp,
  readOnly: readOnlyProp,
  disabled = false,
  className,
}: StarRatingProps) {
  const normalizedMax = normalizeMax(max);
  const normalizedSpacing = normalizeSpacing(spacing);
  const displayRating = clampDisplayRating(value, normalizedMax);
  const selectedRating = Math.round(displayRating);
  const readOnly = readonlyProp ?? readOnlyProp ?? !onChange;
  const interactive = !readOnly && typeof onChange === 'function';
  const stars = Array.from({ length: normalizedMax }, (_, index) => index + 1);

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (!interactive || disabled || !onChange) return;

    if (event.nativeEvent.actionName === 'increment') {
      onChange(clampInteractiveRating(selectedRating + 1, normalizedMax));
    }

    if (event.nativeEvent.actionName === 'decrement') {
      if (selectedRating === 0) return;
      onChange(clampInteractiveRating(selectedRating - 1, normalizedMax));
    }
  };

  if (!interactive) {
    return (
      <View
        accessibilityLabel={`${formatRating(displayRating)} de ${normalizedMax} estrelas`}
        accessibilityRole="text"
        accessible
        className={cn('flex-row items-center gap-1', className)}
        style={{ gap: normalizedSpacing }}
      >
        {stars.map((star) => (
          <RatingStar
            fill={displayRating - (star - 1)}
            key={star}
            size={size}
            star={star}
          />
        ))}
      </View>
    );
  }

  return (
    <View
      accessibilityActions={[
        { name: 'increment', label: 'Aumentar a nota' },
        { name: 'decrement', label: 'Diminuir a nota' },
      ]}
      accessibilityHint="Ajuste a nota com as ações de aumentar ou diminuir."
      accessibilityLabel="Nota da avaliação"
      accessibilityRole="adjustable"
      accessibilityState={{ disabled }}
      accessibilityValue={
        selectedRating === 0
          ? {
              min: 1,
              max: normalizedMax,
              text: 'Nenhuma nota selecionada',
            }
          : {
              min: 1,
              max: normalizedMax,
              now: selectedRating,
              text: `${selectedRating} de ${normalizedMax} estrelas`,
            }
      }
      className={cn('flex-row items-center', className)}
      onAccessibilityAction={handleAccessibilityAction}
      style={{ gap: normalizedSpacing }}
    >
      {stars.map((star) => (
        <Touchable
          accessibilityLabel={`Dar nota ${star} de ${normalizedMax}`}
          accessibilityRole="button"
          accessibilityState={{ disabled, selected: star === selectedRating }}
          disabled={disabled}
          key={star}
          onPress={() => onChange?.(star)}
          // The icon is smaller than a finger; the target around it is not.
          style={{
            minWidth: MIN_TOUCH_TARGET,
            minHeight: MIN_TOUCH_TARGET,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          testID={`star-${star}`}
        >
          <RatingStar fill={star <= selectedRating ? 1 : 0} size={size} star={star} />
        </Touchable>
      ))}
    </View>
  );
}

interface RatingStarProps {
  /** Filled fraction. Values outside 0-1 are clamped. */
  fill: number;
  size: number;
  star: number;
}

/**
 * Vector star with a clipped active layer.
 *
 * The inactive outline always spans the whole star. A solid star is then laid
 * over it inside an `overflow: hidden` view whose width represents the decimal
 * fraction, so a score such as 4.9 remains visibly distinct from 5.0.
 */
function RatingStar({ fill, size, star }: RatingStarProps) {
  const fraction = Math.min(1, Math.max(0, fill));

  return (
    <View
      accessibilityElementsHidden
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
      testID={`rating-star-${star}`}
    >
      <StarIcon color={colors.textDim} filled={false} size={size} />

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size * fraction,
          height: size,
          overflow: 'hidden',
        }}
        testID={`rating-star-${star}-fill`}
      >
        <StarIcon color={colors.primary} filled size={size} />
      </View>
    </View>
  );
}

function normalizeMax(max: number): number {
  if (!Number.isFinite(max) || max < 1) return MAX_RATING;
  return Math.max(1, Math.floor(max));
}

function normalizeSpacing(spacing: number): number {
  if (!Number.isFinite(spacing)) return DEFAULT_SPACING;
  return Math.max(0, spacing);
}

function clampDisplayRating(value: number | string, max: number): number {
  const numeric = parseRating(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(max, Math.max(0, numeric));
}

function clampInteractiveRating(value: number, max: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(max, Math.max(1, Math.round(value)));
}

export interface RatingBadgeProps {
  /** Score, formatted to one decimal in pt-BR. Accepts the string the catalogue stores. */
  value: number | string;
  max?: number;
  size?: number;
  className?: string;
}

/**
 * One star plus a score, for a list row or a card.
 *
 * `flex-shrink-0` on purpose: in a row with a name beside it, the name gives way
 * and truncates, never the score.
 */
export function RatingBadge({ value, max = MAX_RATING, size = 14, className }: RatingBadgeProps) {
  const formatted = formatRating(value);
  const normalizedMax = normalizeMax(max);

  return (
    <View
      accessibilityLabel={`Nota ${formatted} de ${normalizedMax}`}
      accessibilityRole="text"
      accessible
      className={cn('shrink-0 flex-row items-center gap-1', className)}
    >
      <StarIcon color={colors.primary} filled size={size} />
      <Text className="text-base font-extrabold text-primary">{formatted}</Text>
    </View>
  );
}

export interface RatingLabelProps {
  rating: string | number;
  className?: string;
}

/** Compact star label used on cards. Kept for the existing call sites. */
export function RatingLabel({ rating, className }: RatingLabelProps) {
  return <RatingBadge className={className} value={rating} />;
}
