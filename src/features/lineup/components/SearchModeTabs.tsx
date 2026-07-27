import { View } from 'react-native';

import { Chip } from '@/components/ui';

import type { LineUpMode } from '../types';

export interface SearchModeTabsProps {
  mode: LineUpMode;
  onChange: (mode: LineUpMode) => void;
}

export function SearchModeTabs({ mode, onChange }: SearchModeTabsProps) {
  return (
    <View accessibilityRole="radiogroup" className="flex-row gap-2 px-4.5 pt-3">
      <Chip
        className="flex-1"
        label="Perto de mim"
        onPress={() => onChange('nearby')}
        selected={mode === 'nearby'}
      />
      <Chip
        className="flex-1"
        label="Artistas"
        onPress={() => onChange('artists')}
        selected={mode === 'artists'}
      />
    </View>
  );
}
