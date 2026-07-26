import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/layout';
import { Button, Chip } from '@/components/ui';
import { PixIcon } from '@/components/ui/icons';
import { RECHARGE } from '@/constants/app';
import { paymentStatusLabel } from '@/domain/payments/paymentStatus';
import { PixChargePanel } from '@/features/checkout';
import { colors } from '@/theme';
import { formatCents, parseAmountInputToCents, type MoneyInCents } from '@/utils/money';

import { BuddcoinCard } from '../components/BuddcoinCard';
import { RechargeSummary } from '../components/RechargeSummary';
import { useRecharge } from '../hooks/useRecharge';

/**
 * Wallet top-up via PIX.
 *
 * The old screen credited the balance in memory the moment the button was tapped
 * and announced "Recarga realizada com sucesso" — money the user never paid.
 * Now the button opens a real charge and the balance only moves when the server
 * reports the payment settled.
 */
export function RechargeScreen() {
  const recharge = useRecharge();

  const [amountInCents, setAmountInCents] = useState<MoneyInCents | null>(null);
  const [rawInput, setRawInput] = useState('');

  const withinRange =
    amountInCents !== null &&
    amountInCents >= RECHARGE.minInCents &&
    amountInCents <= RECHARGE.maxInCents;

  const pickQuickAmount = (value: MoneyInCents) => {
    setAmountInCents(value);
    setRawInput('');
  };

  const handleInput = (text: string) => {
    setRawInput(text);
    // `null` for empty or malformed input, so "0" and "" stay distinguishable.
    setAmountInCents(parseAmountInputToCents(text));
  };

  const isCreating = recharge.stage === 'creating';

  // Once a charge exists the amount is fixed; changing it means starting over.
  const hasOpenCharge = recharge.stage === 'awaiting' || recharge.stage === 'closed';

  return (
    <Screen contentClassName="pb-10" scroll>
      <ScreenHeader backFallbackHref="/profile" title="Inserir Créditos" />

      <View className="px-4.5">
        {recharge.stage === 'paid' ? (
          <View className="rounded-xl border border-primary bg-primary-surface p-5">
            <Text accessibilityRole="header" className="text-2xl font-extrabold text-primary">
              Recarga confirmada
            </Text>
            <Text className="mt-1.5 text-md text-text-soft">
              O valor já está disponível no seu saldo.
            </Text>
            <Button
              className="mt-4"
              fullWidth
              label="Fazer outra recarga"
              onPress={() => {
                recharge.reset();
                setAmountInCents(null);
                setRawInput('');
              }}
              size="md"
              variant="outline"
            />
          </View>
        ) : null}

        {hasOpenCharge && recharge.charge ? (
          <>
            <PixChargePanel
              charge={recharge.charge}
              isRefreshing={recharge.isChecking}
              onRefresh={recharge.check}
              onRetry={() => {
                recharge.reset();
                setAmountInCents(null);
                setRawInput('');
              }}
              status={recharge.status ?? recharge.charge.status}
            />

            {recharge.recharge ? (
              <Text className="mt-2.5 text-center text-sm text-text-muted">
                Taxa {formatCents(recharge.recharge.feeInCents)} • crédito de{' '}
                {formatCents(recharge.recharge.netInCents)}
              </Text>
            ) : null}

            {recharge.error ? (
              <Text
                accessibilityLiveRegion="polite"
                className="mt-2.5 text-center text-sm text-danger-alt"
              >
                {recharge.error}
              </Text>
            ) : null}
          </>
        ) : null}

        {recharge.stage === 'idle' || recharge.stage === 'creating' || recharge.stage === 'error' ? (
          <>
            <Text accessibilityRole="header" className="mb-3.5 text-3xl font-extrabold text-text">
              Valor do Crédito
            </Text>

            <View className="flex-row flex-wrap gap-3">
              {RECHARGE.quickAmountsInCents.map((value) => (
                <Chip
                  className="px-5.5 py-4"
                  key={value}
                  label={formatCents(value)}
                  onPress={() => pickQuickAmount(value)}
                  selected={amountInCents === value}
                />
              ))}
            </View>

            <Text className="mb-2.5 mt-5.5 text-md text-text-muted">Ou digite um valor:</Text>

            <View className="flex-row items-center gap-2 rounded-lg border border-surface-muted bg-surface-raised px-4.5 py-4">
              <Text className="text-3xl font-extrabold text-text">R$</Text>
              <TextInput
                accessibilityLabel="Valor da recarga"
                className="min-w-0 flex-1 text-3xl font-bold text-text"
                editable={!isCreating}
                inputMode="decimal"
                keyboardType="decimal-pad"
                onChangeText={handleInput}
                placeholder="0,00"
                placeholderTextColor={colors.textDim}
                value={rawInput}
              />
            </View>

            <Text className="mt-2.5 text-center text-sm text-text-muted">
              Mínimo: {formatCents(RECHARGE.minInCents)} • Máximo:{' '}
              {formatCents(RECHARGE.maxInCents)}
            </Text>

            <Text accessibilityRole="header" className="mb-3.5 mt-6 text-3xl font-extrabold text-text">
              Método de Pagamento
            </Text>

            <View
              accessibilityRole="radio"
              accessibilityState={{ selected: true }}
              className="flex-row items-center gap-3.5 rounded-xl border-[1.5px] border-primary bg-primary-surface p-4.5"
            >
              <PixIcon size={26} />
              <View className="flex-1">
                <Text className="text-xl font-extrabold text-primary">PIX</Text>
                <Text className="text-sm text-text-muted">Taxa: {RECHARGE.feeRate * 100}%</Text>
              </View>
              <View className="h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-primary">
                <View className="h-[11px] w-[11px] rounded-full bg-primary" />
              </View>
            </View>

            {withinRange && amountInCents !== null ? (
              <RechargeSummary amountInCents={amountInCents} />
            ) : null}

            {recharge.error ? (
              <Text
                accessibilityLiveRegion="polite"
                className="mt-3.5 text-center text-sm text-danger-alt"
              >
                {recharge.error}
              </Text>
            ) : null}

            <Button
              className="mt-5"
              disabled={!withinRange}
              fullWidth
              label="Gerar cobrança PIX"
              loading={isCreating}
              onPress={() => recharge.start(amountInCents)}
              size="lg"
            />

            <Text className="mt-2.5 text-center text-xs text-text-dim">
              O saldo é creditado apenas após a confirmação do pagamento
            </Text>
          </>
        ) : null}

        {recharge.stage === 'closed' && recharge.status ? (
          <Text className="mt-3.5 text-center text-sm text-text-muted">
            {paymentStatusLabel(recharge.status)}
          </Text>
        ) : null}

        <BuddcoinCard />
      </View>
    </Screen>
  );
}
