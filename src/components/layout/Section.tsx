import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

export interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  /** Trailing element on the title row, e.g. a "see all" link. */
  action?: React.ReactNode;
}

/** A titled block of content. */
export function Section({ title, children, className, titleClassName, action }: SectionProps) {
  return (
    <View className={cn('pt-4', className)}>
      {title ? (
        <View className="mb-3 flex-row items-center justify-between gap-3">
          <Text
            accessibilityRole="header"
            className={cn('text-3xl font-extrabold text-text', titleClassName)}
          >
            {title}
          </Text>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}
