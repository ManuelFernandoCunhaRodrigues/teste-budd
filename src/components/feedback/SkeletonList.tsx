import { memo } from 'react';
import { View } from 'react-native';

import { cn } from '@/utils/cn';

import { SkeletonCard, type SkeletonCardShape } from './SkeletonCard';

export interface SkeletonListProps {
  count?: number;
  shape?: SkeletonCardShape;
  /** Two columns instead of a single stack — used by the products grid. */
  grid?: boolean;
  className?: string;
}

/** Milliseconds between one card's band and the next. */
const STAGGER_MS = 90;

/**
 * A run of placeholder cards.
 *
 * The stagger is the whole point: identical cards animating in lockstep read as
 * a flashing block, while 90ms apart they read as one band travelling down the
 * list. It is capped so a long list does not end up with its last card waiting
 * seconds before moving.
 */
export const SkeletonList = memo(function SkeletonList({
  count = 3,
  shape = 'row',
  grid = false,
  className,
}: SkeletonListProps) {
  const items = Array.from({ length: Math.max(0, count) }, (_, index) => index);
  const delayFor = (index: number) => Math.min(index, 6) * STAGGER_MS;

  if (grid) {
    const rows: number[][] = [];
    for (let index = 0; index < items.length; index += 2) {
      rows.push(items.slice(index, index + 2));
    }

    return (
      <View className={cn('gap-3.5', className)}>
        {rows.map((row) => (
          <View className="flex-row gap-3.5" key={`row-${row[0]}`}>
            {row.map((index) => (
              <SkeletonCard delay={delayFor(index)} key={index} shape="tile" />
            ))}
            {/* Keeps a lone last card at column width instead of letting it
                stretch across the grid. */}
            {row.length === 1 ? <View className="flex-1" /> : null}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className={cn('gap-3.5', className)}>
      {items.map((index) => (
        <SkeletonCard delay={delayFor(index)} key={index} shape={shape} />
      ))}
    </View>
  );
});
