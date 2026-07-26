import { Text, View } from 'react-native';

import { Touchable } from '@/components/ui';
import { ChevronRightIcon } from '@/components/ui/icons';

export interface ProfileMenuItemProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  /** Trailing pill, e.g. the available credit balance. */
  badge?: string;
}

/** One row of the profile menu. */
export function ProfileMenuItem({ title, icon, onPress, badge }: ProfileMenuItemProps) {
  return (
    <Touchable
      accessibilityLabel={badge ? `${title}, ${badge}` : title}
      accessibilityRole="button"
      className="min-h-[44px] flex-row items-center gap-4 border-t border-surface-alt px-1 py-4"
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

      <ChevronRightIcon />
    </Touchable>
  );
}
