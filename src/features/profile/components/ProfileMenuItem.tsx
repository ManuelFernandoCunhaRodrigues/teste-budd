import { Text, View } from 'react-native';

import { Touchable } from '@/components/ui';
import { ChevronRightIcon } from '@/components/ui/icons';
import { cn } from '@/utils/cn';

export interface ProfileMenuItemProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  /** Trailing pill, e.g. the available credit balance. */
  badge?: string;
  /** Greys the row out and blocks the press — e.g. support with no number configured. */
  disabled?: boolean;
  /** Explains why the row is unavailable, for screen readers. */
  accessibilityHint?: string;
  /** `link` for rows that leave the app, so assistive tech announces it correctly. */
  accessibilityRole?: 'button' | 'link';
}

/** One row of the profile menu. */
export function ProfileMenuItem({
  title,
  icon,
  onPress,
  badge,
  disabled = false,
  accessibilityHint,
  accessibilityRole = 'button',
}: ProfileMenuItemProps) {
  return (
    <Touchable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={badge ? `${title}, ${badge}` : title}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled }}
      className={cn(
        'min-h-[44px] flex-row items-center gap-4 border-t border-surface-alt px-1 py-4',
        disabled && 'opacity-40',
      )}
      disabled={disabled}
      feedback="none"
      onPress={onPress}
    >
      <View className="w-[26px] items-center justify-center">{icon}</View>

      <View className="min-w-0 flex-1 flex-row items-center gap-2">
        <Text className="text-lg font-semibold text-text">{title}</Text>
        {badge ? (
          <Text className="rounded-2xl bg-primary-tint px-2.5 py-0.5 text-xs font-extrabold text-primary">
            {badge}
          </Text>
        ) : null}
      </View>

      {disabled ? null : <ChevronRightIcon />}
    </Touchable>
  );
}
