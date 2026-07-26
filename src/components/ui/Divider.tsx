import { View } from 'react-native';

import { cn } from '@/utils/cn';

export interface DividerProps {
  className?: string;
}

/** Hairline rule separating blocks inside a card. */
export function Divider({ className }: DividerProps) {
  return <View className={cn('h-px bg-border-muted', className)} />;
}
