import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button } from '@/components/ui';
import type { PaymentStatus } from '@/domain/payments/paymentStatus';
import { isSettling, paymentStatusLabel } from '@/domain/payments/paymentStatus';
import type { PixCharge } from '@/domain/payments/paymentTypes';
import { isDevBackendActive, devBackendControls } from '@/services/backend';
import { showToast } from '@/store/toastStore';
import { formatCents } from '@/utils/money';

export interface PixChargePanelProps {
  charge: PixCharge;
  /** Authoritative status, polled from the server. */
  status: PaymentStatus;
  onRefresh: () => void;
  isRefreshing?: boolean;
  /** Offered once the charge reached an unsuccessful final state. */
  onRetry?: () => void;
}

/**
 * A PIX charge awaiting payment.
 *
 * Deliberately never claims the payment succeeded: the heading reflects the
 * server's status, and "Já paguei" only triggers a re-check. Nothing in this
 * component can move the charge to `paid`.
 */
export function PixChargePanel({
  charge,
  status,
  onRefresh,
  isRefreshing = false,
  onRetry,
}: PixChargePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(charge.qrCodePayload);
    setCopied(true);
    showToast('Código PIX copiado');
  };

  const expiresAt = new Date(charge.expiresAt);
  const expiryLabel = Number.isNaN(expiresAt.getTime())
    ? null
    : expiresAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const waiting = isSettling(status);

  return (
    <View className="rounded-xl border border-border bg-surface p-4.5">
      <Text accessibilityRole="header" className="text-xl font-extrabold text-text">
        {paymentStatusLabel(status)}
      </Text>

      <Text className="mt-1 text-3xl font-black text-primary">
        {formatCents(charge.amountInCents)}
      </Text>

      {waiting && expiryLabel ? (
        <Text className="mt-1 text-sm text-text-muted">Válido até {expiryLabel}</Text>
      ) : null}

      {waiting ? (
        <>
          <View className="mt-4 items-center rounded-lg bg-white p-3.5">
            {/* Rendered from the same payload that is copied, so the two can
                never disagree. */}
            <QRCode size={168} value={charge.qrCodePayload} />
          </View>

          <Text className="mt-3.5 text-sm font-bold text-text-muted">PIX Copia e Cola</Text>
          <Text
            className="mt-1 rounded-lg bg-surface-raised p-3 text-xs text-text-soft"
            numberOfLines={3}
            selectable
          >
            {charge.qrCodePayload}
          </Text>

          <Button
            className="mt-3"
            fullWidth
            label={copied ? 'Código copiado' : 'Copiar código PIX'}
            onPress={handleCopy}
            size="md"
            variant="outline"
          />

          <Button
            className="mt-2.5"
            fullWidth
            label="Já paguei — verificar"
            loading={isRefreshing}
            onPress={onRefresh}
            size="md"
            variant="neutral"
          />

          <Text className="mt-2.5 text-center text-xs text-text-dim">
            O saldo e o pedido só são liberados após a confirmação do pagamento pelo banco.
          </Text>

          {/* Stands in for the provider webhook while the dev backend is on.
              Never present in a production build. */}
          {isDevBackendActive ? (
            <Button
              className="mt-3"
              fullWidth
              label="[dev] Simular confirmação do PIX"
              onPress={() => {
                devBackendControls.confirmPixPayment(charge.chargeId);
                onRefresh();
              }}
              size="sm"
              variant="ghost"
            />
          ) : null}
        </>
      ) : null}

      {!waiting && onRetry ? (
        <Button
          className="mt-4"
          fullWidth
          label="Gerar nova cobrança"
          onPress={onRetry}
          size="md"
        />
      ) : null}
    </View>
  );
}
