import { Text, View } from 'react-native';

import { Divider } from '@/components/ui';
import { RECHARGE } from '@/constants/app';
import { previewRechargeFee } from '@/domain/wallet/walletValidation';
import { formatCents, type MoneyInCents } from '@/utils/money';

export interface RechargeSummaryProps {
  amountInCents: MoneyInCents;
}

/**
 * Breakdown of a top-up: gross amount, PIX fee and the net credit.
 *
 * A preview of what *would* be credited. The wording says so — the previous copy
 * read "Saldo adicionado", which described a credit that had not happened and
 * would not happen until a payment cleared.
 */
export function RechargeSummary({ amountInCents }: RechargeSummaryProps) {
  const { feeInCents, netInCents } = previewRechargeFee(amountInCents);

  return (
    <View className="mt-4 rounded-xl border border-primary p-5">
      <Text className="mb-4 text-2xl font-extrabold text-primary">Resumo da Recarga</Text>

      <View className="flex-row justify-between">
        <Text className="text-md text-text-softer">Valor do crédito:</Text>
        <Text className="text-md font-extrabold text-text-softer">
          {formatCents(amountInCents)}
        </Text>
      </View>

      <View className="mt-2.5 flex-row justify-between">
        <Text className="text-md text-text-softer">Taxa ({RECHARGE.feeRate * 100}%):</Text>
        <Text className="text-md font-extrabold text-text-softer">
          - {formatCents(feeInCents)}
        </Text>
      </View>

      <Divider className="my-3.5" />

      <View className="flex-row justify-between">
        <Text className="text-lg font-extrabold text-text">Você receberá:</Text>
        <Text className="text-lg font-black text-primary">{formatCents(netInCents)}</Text>
      </View>

      <Text className="mt-2 text-xs text-text-dim">
        Valores confirmados pelo servidor ao gerar a cobrança
      </Text>
    </View>
  );
}
