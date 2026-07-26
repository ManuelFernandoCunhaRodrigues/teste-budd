import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { BuddLogo } from '@/components/ui/icons';
import { BUDDCOIN_LABEL } from '@/constants/app';
import { BUDDCOIN_ABOUT, CURRENT_USER } from '@/mocks/profile';

/** Loyalty programme summary with an expandable explainer. */
export function BuddcoinCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="mt-6 rounded-2xl border border-border-green bg-[#0A0A0A] p-5">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-[#0E1A0C]">
          <BuddLogo size={24} />
        </View>

        <View className="min-w-0 flex-1">
          <Text className="text-xl font-extrabold text-text">Sobre a Buddcoin</Text>
          <Text className="mt-0.5 text-sm text-text-muted">
            Programa de pontos e recompensas
          </Text>
        </View>

        <Text className="rounded-2xl bg-primary-tint px-3 py-1 text-sm font-extrabold text-primary">
          {CURRENT_USER.buddcoins} {BUDDCOIN_LABEL}
        </Text>
      </View>

      <Button
        accessibilityState={{ expanded }}
        className="mt-4"
        fullWidth
        label={expanded ? 'Ocultar informações' : 'O que é a buddcoin?'}
        onPress={() => setExpanded((value) => !value)}
        trailing={<Text className="text-primary">{expanded ? '⌃' : '⌄'}</Text>}
        variant="outline"
      />

      {expanded ? (
        <View className="mt-3.5 rounded-lg border border-border-green p-4">
          <Text className="text-base leading-6 text-text-soft">{BUDDCOIN_ABOUT}</Text>
        </View>
      ) : null}
    </View>
  );
}
