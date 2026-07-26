import { Text, View } from 'react-native';

import { Touchable } from '@/components/ui';
import { cn } from '@/utils/cn';

/** The two content modes of the ROLÊ feed. */
export type RoleTab = 'bares' | 'eventos';

export interface RoleTabsProps {
  active: RoleTab;
  onChange: (tab: RoleTab) => void;
}

const TABS: { key: RoleTab; label: string }[] = [
  { key: 'bares', label: 'Bares' },
  { key: 'eventos', label: 'Eventos' },
];

/** Segmented control switching the feed between venues and events. */
export function RoleTabs({ active, onChange }: RoleTabsProps) {
  return (
    <View accessibilityRole="tablist" className="flex-row gap-3 px-4.5 pb-1.5 pt-3.5">
      {TABS.map((tab) => {
        const selected = active === tab.key;

        return (
          <Touchable
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={cn(
              'min-h-[44px] items-center justify-center rounded-2xl px-6',
              selected ? 'bg-primary' : 'bg-surface-muted',
            )}
            key={tab.key}
            onPress={() => onChange(tab.key)}
          >
            <Text
              className={cn('text-lg font-bold', selected ? 'text-bg' : 'text-text-soft')}
            >
              {tab.label}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}
