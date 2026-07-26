import { View, type ViewProps } from 'react-native';

import { cn } from '@/utils/cn';

import { Touchable } from './Touchable';

export interface CardProps extends ViewProps {
  className?: string;
  /** Makes the whole card tappable with the design's subtle press feedback. */
  onPress?: () => void;
  accessibilityLabel?: string;
}

/** The dark bordered surface used by nearly every list and detail block. */
export function Card({ className, onPress, children, ...props }: CardProps) {
  const classes = cn(
    'bg-surface border border-border rounded-xl overflow-hidden',
    className,
  );

  if (onPress) {
    return (
      <Touchable
        accessibilityRole="button"
        className={classes}
        feedback="card"
        onPress={onPress}
        {...props}
      >
        {children}
      </Touchable>
    );
  }

  return (
    <View className={classes} {...props}>
      {children}
    </View>
  );
}
