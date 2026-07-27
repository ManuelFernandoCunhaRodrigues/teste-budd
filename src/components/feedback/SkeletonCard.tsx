import { memo } from 'react';
import { View } from 'react-native';

import { cn } from '@/utils/cn';

import { Skeleton } from './Skeleton';

export type SkeletonCardShape = 'row' | 'tile' | 'listItem' | 'profileRow';

export interface SkeletonCardProps {
  shape?: SkeletonCardShape;
  /** Passed through to every block so a list can stagger its cards. */
  delay?: number;
  className?: string;
}

/**
 * A card-shaped placeholder.
 *
 * Each shape mirrors a real card in the app rather than being a generic grey
 * box: the point of a skeleton is that the layout does not jump when the data
 * lands, which only holds if the placeholder has the proportions of what
 * replaces it.
 *
 * Blocks inside one card are staggered a few milliseconds apart so the band
 * crosses the artwork before the text, reading as one wave instead of several
 * blocks blinking together.
 */
export const SkeletonCard = memo(function SkeletonCard({
  shape = 'row',
  delay = 0,
  className,
}: SkeletonCardProps) {
  if (shape === 'tile') {
    return (
      <View className={cn('flex-1 overflow-hidden rounded-xl border border-border', className)}>
        <Skeleton className="h-[120px] rounded-none" delay={delay} />
        <View className="gap-2 p-3">
          <Skeleton className="h-4 w-3/4" delay={delay + 40} />
          <Skeleton className="h-3 w-1/2" delay={delay + 80} />
          <Skeleton className="mt-1 h-4 w-1/3" delay={delay + 120} />
        </View>
      </View>
    );
  }

  if (shape === 'listItem') {
    return (
      <View className={cn('flex-row items-center gap-3 py-3', className)}>
        <Skeleton className="h-12 w-12 rounded-full" delay={delay} />
        <View className="flex-1 gap-2">
          <Skeleton className="h-4 w-2/3" delay={delay + 40} />
          <Skeleton className="h-3 w-1/3" delay={delay + 80} />
        </View>
      </View>
    );
  }

  if (shape === 'profileRow') {
    return (
      <View className={cn('flex-row items-center gap-3 rounded-xl border border-border p-3.5', className)}>
        <Skeleton className="h-10 w-10 rounded-lg" delay={delay} />
        <Skeleton className="h-4 flex-1" delay={delay + 40} />
      </View>
    );
  }

  return (
    <View className={cn('flex-row overflow-hidden rounded-xl border border-border', className)}>
      <Skeleton className="w-[34%] rounded-none" delay={delay} />
      <View className="flex-1 gap-2.5 p-3.5">
        <Skeleton className="h-5 w-4/5" delay={delay + 40} />
        <Skeleton className="h-3.5 w-2/5" delay={delay + 80} />
        <Skeleton className="h-3.5 w-3/5" delay={delay + 120} />
        <Skeleton className="mt-1 h-4 w-1/3" delay={delay + 160} />
      </View>
    </View>
  );
});
