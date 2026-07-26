import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

import { Button } from '../ui/Button';

export interface EmptyStateProps {
  /** Illustration, usually an outlined icon at 88–120pt. */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Optional call to action that moves the user somewhere useful. */
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  /** The muted grey treatment used by the cart and order-history screens. */
  muted?: boolean;
}

/** Shown when a list has no items yet. */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  muted = false,
}: EmptyStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center gap-4 px-3', className)}>
      {icon}
      <Text
        className={cn(
          'text-center text-3xl font-extrabold',
          muted ? 'text-text-faint' : 'text-text-soft',
        )}
      >
        {title}
      </Text>
      {description ? (
        <Text
          className={cn(
            'text-center text-md leading-6',
            muted ? 'text-text-ghost' : 'text-[#8A8A8A]',
          )}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button className="mt-1.5 px-7" label={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}
