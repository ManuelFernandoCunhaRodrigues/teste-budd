import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

export interface AvatarProps {
  /** Monogram shown when no `children` are supplied. */
  initial?: string;
  size?: number;
  /** Custom content — an icon or logo — replacing the monogram. */
  children?: React.ReactNode;
  /** Green ring used by venue and profile headers. */
  bordered?: boolean;
  className?: string;
}

/** Circular monogram/icon badge. */
export function Avatar({
  initial,
  size = 44,
  children,
  bordered = false,
  className,
}: AvatarProps) {
  return (
    <View
      className={cn(
        'items-center justify-center rounded-full bg-bg',
        bordered && 'border-[3px] border-primary',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {children ?? (
        <Text
          className="font-black text-primary"
          style={{ fontSize: Math.round(size * 0.26) }}
        >
          {initial}
        </Text>
      )}
    </View>
  );
}
