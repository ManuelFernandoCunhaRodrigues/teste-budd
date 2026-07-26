import { useState } from 'react';
import { Text, View } from 'react-native';

import { EmptyState } from '@/components/feedback';
import { Screen, ScreenHeader } from '@/components/layout';
import { IconButton } from '@/components/ui';
import { CalendarHeaderIcon, EmptyBagIcon } from '@/components/ui/icons';
import { formatMonthLabel } from '@/utils/formatDate';

/** Past orders, browsable one month at a time. */
export function OrderHistoryScreen() {
  const [monthOffset, setMonthOffset] = useState(0);

  return (
    <Screen>
      <ScreenHeader backFallbackHref="/profile" title="Histórico de Compras" />

      <View className="flex-1 px-4.5">
        <View className="flex-row items-center justify-between rounded-lg border border-border-green px-3.5 py-3">
          <IconButton
            accessibilityLabel="Mês anterior"
            onPress={() => setMonthOffset((value) => value - 1)}
            size={40}
            variant="neutral"
          >
            <Text className="text-2xl text-primary">‹</Text>
          </IconButton>

          <View className="flex-row items-center gap-2">
            <CalendarHeaderIcon size={18} />
            <Text className="text-lg font-extrabold text-text">
              {formatMonthLabel(monthOffset)}
            </Text>
          </View>

          <IconButton
            accessibilityLabel="Próximo mês"
            onPress={() => setMonthOffset((value) => value + 1)}
            size={40}
            variant="neutral"
          >
            <Text className="text-2xl text-text-dim">›</Text>
          </IconButton>
        </View>

        {/* Orders are not persisted yet, so every month reads as empty. */}
        <EmptyState
          description="Suas compras aparecerão aqui"
          icon={<EmptyBagIcon color="#333333" size={90} />}
          muted
          title="Nenhuma compra encontrada"
        />
      </View>
    </Screen>
  );
}
