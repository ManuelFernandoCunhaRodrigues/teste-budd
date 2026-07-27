import { useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton, Touchable } from '@/components/ui';
import { CloseIcon, MapPinIcon } from '@/components/ui/icons';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { colors } from '@/theme';

import { cityLabel, searchCities } from '../services/lineupService';
import type { CityOption } from '../types';

export interface CityPickerSheetProps {
  visible: boolean;
  selectedCityId: string | null;
  onSelect: (city: CityOption) => void;
  onClose: () => void;
}

/**
 * Manual location, for when the device's own is unavailable or refused.
 *
 * This is what keeps a denied permission from being a dead end: the nearby
 * results are computed from whatever origin the app has, and a city the user
 * picked is a perfectly good one.
 */
export function CityPickerSheet({
  visible,
  selectedCityId,
  onSelect,
  onClose,
}: CityPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const titleRef = useModalAccessibility(visible, 'Escolher localização');

  const cities = useMemo(() => searchCities(query), [query]);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end bg-black/60">
        <View
          accessibilityViewIsModal
          className="max-h-[80%] rounded-t-3xl bg-surface-sheet"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-row items-center gap-3 border-b border-border px-4.5 pb-3.5 pt-4">
            <Text
              accessibilityRole="header"
              className="min-w-0 flex-1 text-lg font-extrabold text-text"
              ref={titleRef}
            >
              Escolher localização
            </Text>
            <IconButton
              accessibilityLabel="Fechar"
              onPress={onClose}
              size={38}
              variant="neutral"
            >
              <CloseIcon color={colors.textSoft} size={18} />
            </IconButton>
          </View>

          <View className="px-4.5 pt-3.5">
            <TextInput
              accessibilityLabel="Pesquisar cidade"
              className="min-h-[48px] rounded-xl border border-border bg-surface px-4 text-md text-text"
              onChangeText={setQuery}
              placeholder="Pesquisar cidade"
              placeholderTextColor={colors.textDim}
              value={query}
            />
          </View>

          <ScrollView className="px-4.5" contentContainerClassName="gap-2 py-3.5">
            {cities.length === 0 ? (
              <Text className="py-6 text-center text-sm text-text-muted">
                Nenhuma cidade encontrada.
              </Text>
            ) : null}

            {cities.map((city) => {
              const selected = city.id === selectedCityId;

              return (
                <Touchable
                  accessibilityLabel={cityLabel(city)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  className={
                    selected
                      ? 'flex-row items-center gap-2.5 rounded-xl border border-primary bg-primary-surface px-3.5 py-3'
                      : 'flex-row items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3'
                  }
                  key={city.id}
                  onPress={() => onSelect(city)}
                >
                  <MapPinIcon color={selected ? colors.primary : colors.textMuted} size={16} />
                  <Text
                    className={selected ? 'text-md font-bold text-primary' : 'text-md text-text'}
                  >
                    {cityLabel(city)}
                  </Text>
                </Touchable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
