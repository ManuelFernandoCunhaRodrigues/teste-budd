import { Text, View } from 'react-native';

import { Avatar } from '@/components/ui';
import { ProfileSolidIcon } from '@/components/ui/icons';
import { colors } from '@/theme';

export interface ProfileStatsProps {
  favorites: number;
  buddcoins: number;
  orders: number;
}

/** Avatar overlapping the three-column stats card. */
export function ProfileStats({ favorites, buddcoins, orders }: ProfileStatsProps) {
  const stats = [
    { label: 'Favoritos', value: favorites },
    { label: 'BDC', value: buddcoins },
    { label: 'Pedidos', value: orders },
  ];

  return (
    <View className="relative mt-5 pt-12">
      <View className="absolute left-0 right-0 top-0 z-10 items-center">
        <Avatar bordered size={96}>
          <ProfileSolidIcon color={colors.primary} size={50} />
        </Avatar>
      </View>

      <View className="flex-row items-center rounded-2xl border border-border-green bg-surface px-2 pb-4.5 pt-[58px]">
        {stats.map((stat, index) => (
          <View className="flex-row items-center" key={stat.label} style={{ flex: 1 }}>
            {index > 0 ? <View className="h-[34px] w-px bg-border-green" /> : null}
            <View className="flex-1 items-center">
              <Text className="text-6xl font-black text-primary">{stat.value}</Text>
              <Text className="mt-0.5 text-xs text-text-muted">{stat.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
