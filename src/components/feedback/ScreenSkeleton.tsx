import { memo } from 'react';
import { View } from 'react-native';

import { Skeleton } from './Skeleton';
import { SkeletonCard } from './SkeletonCard';
import { SkeletonList } from './SkeletonList';

export type LoadingVariant = 'role' | 'products' | 'profile' | 'map' | 'lineup';

export interface ScreenSkeletonProps {
  variant?: LoadingVariant;
  /** Overrides the variant's default announcement. */
  label?: string;
}

/**
 * What each variant tells a screen reader.
 *
 * Announced once by the container, never per block — a live region that fired
 * on every frame of the loop would talk over everything else.
 */
const LABELS: Record<LoadingVariant, string> = {
  role: 'Procurando rolê',
  products: 'Procurando produto',
  profile: 'Carregando perfil',
  map: 'Carregando mapa',
  lineup: 'Carregando lineup',
};

/**
 * Full-screen placeholder shaped like the screen it stands in for.
 *
 * A single generic spinner told the user only that something was happening.
 * These tell them what is coming and reserve roughly the space it will take,
 * so the content does not shove the layout around when it lands.
 */
export const ScreenSkeleton = memo(function ScreenSkeleton({
  variant = 'role',
  label,
}: ScreenSkeletonProps) {
  return (
    <View
      accessibilityLabel={label ?? LABELS[variant]}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      className="flex-1 bg-bg"
    >
      {variant === 'map' ? <MapSkeleton /> : null}
      {variant === 'products' ? <ProductsSkeleton /> : null}
      {variant === 'profile' ? <ProfileSkeleton /> : null}
      {variant === 'lineup' ? <LineupSkeleton /> : null}
      {variant === 'role' ? <RoleSkeleton /> : null}
    </View>
  );
});

function RoleSkeleton() {
  return (
    <View className="gap-4 px-4.5 pt-6">
      <Skeleton className="h-7 w-1/2" />
      <View className="flex-row gap-2">
        <Skeleton className="h-9 w-20 rounded-2xl" delay={40} />
        <Skeleton className="h-9 w-24 rounded-2xl" delay={80} />
        <Skeleton className="h-9 w-16 rounded-2xl" delay={120} />
      </View>
      <SkeletonList className="mt-1" count={3} />
    </View>
  );
}

function ProductsSkeleton() {
  return (
    <View className="gap-4 px-4.5 pt-6">
      <Skeleton className="h-12 rounded-xl" />
      <SkeletonList count={4} grid />
    </View>
  );
}

function ProfileSkeleton() {
  return (
    <View className="gap-4 px-4.5 pt-6">
      <View className="flex-row items-center gap-3.5">
        <Skeleton className="h-20 w-20 rounded-full" />
        <View className="flex-1 gap-2.5">
          <Skeleton className="h-5 w-2/3" delay={40} />
          <Skeleton className="h-3.5 w-1/2" delay={80} />
        </View>
      </View>

      <View className="mt-2 gap-2.5">
        <SkeletonCard delay={120} shape="profileRow" />
        <SkeletonCard delay={210} shape="profileRow" />
        <SkeletonCard delay={300} shape="profileRow" />
      </View>
    </View>
  );
}

function LineupSkeleton() {
  return (
    <View className="gap-4 px-4.5 pt-6">
      <Skeleton className="h-5 w-3/5" />
      <Skeleton className="h-12 rounded-xl" delay={40} />
      <View className="flex-row gap-2">
        <Skeleton className="h-11 flex-1 rounded-2xl" delay={80} />
        <Skeleton className="h-11 flex-1 rounded-2xl" delay={120} />
      </View>
      <SkeletonList className="mt-1" count={3} />
    </View>
  );
}

/**
 * The map cannot be represented by a stack of cards: the screen is a surface
 * with pins and a card docked at the bottom, so the placeholder mirrors that
 * instead of hiding it behind a list.
 */
function MapSkeleton() {
  return (
    <View className="flex-1">
      <Skeleton className="flex-1 rounded-none" />

      <View className="absolute left-0 right-0 top-0 flex-1">
        <Skeleton className="mx-10 mt-24 h-9 w-9 rounded-full" delay={60} />
        <Skeleton className="ml-auto mr-16 mt-6 h-9 w-9 rounded-full" delay={140} />
        <Skeleton className="ml-20 mt-10 h-9 w-9 rounded-full" delay={220} />
      </View>

      <View className="absolute bottom-8 left-0 right-0 px-6">
        <SkeletonCard className="bg-surface-sheet" delay={300} />
      </View>
    </View>
  );
}
