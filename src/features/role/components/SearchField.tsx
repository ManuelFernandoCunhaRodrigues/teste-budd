import { TextInput, View } from 'react-native';

import { SearchIcon } from '@/components/ui/icons';
import { colors } from '@/theme';

export interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

/** Rounded search input used above the venue list. */
export function SearchField({ value, onChangeText, placeholder = 'Buscar bares' }: SearchFieldProps) {
  return (
    <View className="flex-row items-center gap-2.5 rounded-lg border border-border bg-surface-alt px-4 py-3">
      <SearchIcon color={colors.textDim} size={20} />
      <TextInput
        accessibilityLabel={placeholder}
        autoCorrect={false}
        className="min-w-0 flex-1 text-lg text-text"
        clearButtonMode="while-editing"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        returnKeyType="search"
        value={value}
      />
    </View>
  );
}
