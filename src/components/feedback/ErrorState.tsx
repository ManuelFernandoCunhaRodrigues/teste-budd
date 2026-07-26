import { Text, View } from 'react-native';

import { colors } from '@/theme';
import { cn } from '@/utils/cn';

import { Button } from '../ui/Button';
import { EmptyBoxIcon } from '../ui/icons';

export interface ErrorStateProps {
  title?: string;
  /** Message from the API client, or a generic fallback. */
  description?: string;
  onRetry?: () => void;
  className?: string;
}

/** Shown when a request fails, with a retry affordance. */
export function ErrorState({
  title = 'Algo deu errado',
  description = 'Não foi possível carregar as informações. Tente novamente.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center gap-4 px-6', className)}>
      <EmptyBoxIcon color={colors.dangerBorder} size={88} />
      <Text accessibilityRole="alert" className="text-center text-3xl font-extrabold text-text-soft">
        {title}
      </Text>
      <Text className="text-center text-md leading-6 text-text-muted">{description}</Text>
      {onRetry ? (
        <Button className="mt-1.5 px-7" label="Tentar novamente" onPress={onRetry} />
      ) : null}
    </View>
  );
}
