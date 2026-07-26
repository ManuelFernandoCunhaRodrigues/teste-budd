import { Text, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/layout';
import { Button, Chip } from '@/components/ui';
import { INTEREST_GROUPS } from '@/mocks/profile';
import { usePreferencesStore } from '@/store/preferencesStore';
import { showToast } from '@/store/toastStore';

/** Interest picker that drives the recommendations screen. */
export function PreferencesScreen() {
  const interests = usePreferencesStore((state) => state.interests);
  const toggleInterest = usePreferencesStore((state) => state.toggleInterest);

  return (
    <Screen contentClassName="pb-10" scroll>
      <ScreenHeader backFallbackHref="/profile" title="Preferências" />

      <View className="px-4.5">
        <Text className="mb-4.5 mt-1 text-base text-text-muted">
          Escolha seus interesses para personalizar as recomendações.
        </Text>

        {INTEREST_GROUPS.map((group) => (
          <View className="mb-5.5" key={group.id}>
            <Text accessibilityRole="header" className="mb-3 text-lg font-extrabold text-text">
              {group.title}
            </Text>

            <View className="flex-row flex-wrap gap-2.5">
              {group.items.map((label) => (
                <Chip
                  key={label}
                  label={label}
                  onPress={() => toggleInterest(label)}
                  selected={!!interests[label]}
                />
              ))}
            </View>
          </View>
        ))}

        <Button
          fullWidth
          label="Salvar preferências"
          onPress={() => showToast('Preferências salvas')}
        />
      </View>
    </Screen>
  );
}
