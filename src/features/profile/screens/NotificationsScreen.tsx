import { Text, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/layout';
import { Toggle } from '@/components/ui';
import { BellHeaderIcon } from '@/components/ui/icons';
import { NOTIFICATION_TYPES } from '@/mocks/profile';
import { usePreferencesStore } from '@/store/preferencesStore';

/** Per-category notification opt-in. */
export function NotificationsScreen() {
  const notifications = usePreferencesStore((state) => state.notifications);
  const toggle = usePreferencesStore((state) => state.toggleNotification);

  return (
    <Screen contentClassName="pb-10" scroll>
      <ScreenHeader backFallbackHref="/profile" icon={<BellHeaderIcon size={22} />} title="Notificações" />

      <View className="px-4.5">
        <View className="flex-row gap-3 rounded-md border-l-[3px] border-primary bg-[#131313] p-4">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
            <Text className="font-extrabold text-bg">i</Text>
          </View>
          <Text className="flex-1 text-base leading-5 text-[#BDBDBD]">
            Configure suas preferências de notificação para receber apenas as informações
            importantes para você.
          </Text>
        </View>

        <View className="mt-4 rounded-xl border border-border bg-surface p-5">
          <Text accessibilityRole="header" className="mb-2 text-2xl font-extrabold text-text">
            Tipos de Notificação
          </Text>

          {NOTIFICATION_TYPES.map((type) => (
            <View
              className="flex-row items-center gap-3.5 border-t border-border-subtle py-4"
              key={type.key}
            >
              <View className="min-w-0 flex-1">
                <Text className="text-lg font-extrabold text-text">{type.title}</Text>
                <Text className="mt-1 text-sm leading-[18px] text-text-muted">
                  {type.description}
                </Text>
              </View>

              <Toggle
                accessibilityLabel={type.title}
                onValueChange={() => toggle(type.key)}
                value={notifications[type.key]}
              />
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
