import { Text, TextInput, View } from 'react-native';

import { Button, IconButton } from '@/components/ui';
import { CloseIcon, MapPinIcon, SearchIcon, SlidersIcon } from '@/components/ui/icons';
import { colors } from '@/theme';

export interface LineUpSearchProps {
  query: string;
  locationLabel: string;
  activeFilterCount: number;
  onChangeQuery: (query: string) => void;
  onClearQuery: () => void;
  onOpenFilters: () => void;
  onChooseCity: () => void;
}

export function LineUpSearch({
  query,
  locationLabel,
  activeFilterCount,
  onChangeQuery,
  onClearQuery,
  onOpenFilters,
  onChooseCity,
}: LineUpSearchProps) {
  const filterLabel = activeFilterCount > 0 ? `Filtros (${activeFilterCount})` : 'Filtros';

  return (
    <View className="px-4.5 pt-4">
      {/* No "LineUp" title: the tab bar already names this screen, and repeating
          it cost a screenful of vertical space. The subtitle takes over as the
          heading so assistive tech still has a landmark to land on. */}
      <Text accessibilityRole="header" className="text-lg font-bold text-text-soft">
        Encontre quem vai tocar perto de você
      </Text>

      <View className="mt-4 min-h-[52px] flex-row items-center rounded-xl border border-border bg-surface px-3">
        <SearchIcon color={colors.textMuted} size={19} />
        <TextInput
          accessibilityLabel="Pesquisar artistas, shows ou locais"
          className="min-h-[48px] flex-1 px-3 text-md text-text"
          onChangeText={onChangeQuery}
          placeholder="Pesquise artistas, shows ou locais"
          placeholderTextColor={colors.textDim}
          returnKeyType="search"
          value={query}
        />
        {query ? (
          <IconButton
            accessibilityLabel="Limpar pesquisa"
            onPress={onClearQuery}
            size={44}
            variant="plain"
          >
            <CloseIcon color={colors.textMuted} size={18} />
          </IconButton>
        ) : null}
      </View>

      <View className="mt-3 flex-row items-center justify-between gap-3">
        <Button
          className="flex-1 justify-start"
          label={locationLabel}
          leading={<MapPinIcon color={colors.primary} size={16} />}
          onPress={onChooseCity}
          size="sm"
          variant="ghost"
        />
        <Button
          label={filterLabel}
          leading={<SlidersIcon color={colors.primary} size={16} />}
          onPress={onOpenFilters}
          size="sm"
          variant="outline"
        />
      </View>
    </View>
  );
}
