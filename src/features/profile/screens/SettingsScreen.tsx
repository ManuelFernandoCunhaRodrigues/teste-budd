import { Text, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/layout';
import { Button, Toggle } from '@/components/ui';
import { ACCOUNT_FIELDS, PERMISSION_TOGGLES } from '@/mocks/profile';
import { usePreferencesStore } from '@/store/preferencesStore';
import { showToast } from '@/store/toastStore';

/** Account details and privacy switches. */
export function SettingsScreen() {
  const permissions = usePreferencesStore((state) => state.permissions);
  const togglePermission = usePreferencesStore((state) => state.togglePermission);

  return (
    <Screen contentClassName="pb-10" scroll>
      <ScreenHeader backFallbackHref="/profile" title="Configurações" />

      <View className="px-4.5">
        <Text
          accessibilityRole="header"
          className="mb-1.5 mt-2.5 px-0.5 text-sm font-bold uppercase tracking-wide text-text-dim"
        >
          Conta
        </Text>

        <View className="overflow-hidden rounded-xl border border-border-green bg-surface">
          {ACCOUNT_FIELDS.map((field) => (
            <View
              className="flex-row items-center gap-3.5 border-t border-surface-alt p-4"
              key={field.key}
            >
              <View className="min-w-0 flex-1">
                <Text className="text-md font-bold text-text">{field.label}</Text>
                <Text className="mt-0.5 text-sm text-text-muted" numberOfLines={1}>
                  {field.value}
                </Text>
              </View>

              <Button
                accessibilityLabel={`Editar ${field.label.toLowerCase()}`}
                className="rounded-2xl border-primary-border px-4"
                label="Editar"
                onPress={() =>
                  showToast(`Edição de ${field.label.toLowerCase()} em breve`)
                }
                size="sm"
                variant="outline"
              />
            </View>
          ))}
        </View>

        <Text
          accessibilityRole="header"
          className="mb-1.5 mt-5.5 px-0.5 text-sm font-bold uppercase tracking-wide text-text-dim"
        >
          Privacidade e permissões
        </Text>

        <View className="overflow-hidden rounded-xl border border-border-green bg-surface">
          {PERMISSION_TOGGLES.map((permission) => (
            <View
              className="flex-row items-center gap-3.5 border-t border-surface-alt p-4"
              key={permission.key}
            >
              <Text className="flex-1 text-md font-semibold text-text">{permission.label}</Text>
              <Toggle
                accessibilityLabel={permission.label}
                onValueChange={() => togglePermission(permission.key)}
                value={permissions[permission.key]}
              />
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
