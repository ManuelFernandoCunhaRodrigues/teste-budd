import { Modal, ScrollView, Text, View } from 'react-native';

import { Button, Chip, Stepper } from '@/components/ui';
import type { TicketTier } from '@/domain/tickets/ticketTypes';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { availabilityMessage } from '@/services/tickets/ticketService';
import { formatCents, multiplyCents } from '@/utils/money';

import type { TicketPurchaseController } from '../hooks/useTicketPurchase';

export interface TicketSheetProps {
  visible: boolean;
  onClose: () => void;
  controller: TicketPurchaseController;
  eventName: string;
}

/**
 * Ticket selection and reservation.
 *
 * Every state is explicit — loading, each unavailable reason, a held reservation
 * awaiting payment. There is no path that reports a purchase before one exists;
 * the furthest this goes is a reservation, and it says so.
 */
export function TicketSheet({ visible, onClose, controller, eventName }: TicketSheetProps) {
  const { availability, selectedTier, quantity, reservation, error, stage } = controller;
  const titleRef = useModalAccessibility(visible, `Ingressos. ${eventName}`);

  const unavailableReason = availability ? availabilityMessage(availability) : null;
  const tiers = availability?.kind === 'available' ? availability.tiers : [];

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end bg-black/60">
        <View
          accessibilityViewIsModal
          aria-modal
          className="max-h-[85%] rounded-t-2xl border-t border-border bg-surface px-5 pb-8 pt-5"
          importantForAccessibility="yes"
        >
          <View className="flex-row items-start justify-between gap-3">
            <Text
              accessibilityRole="header"
              className="flex-1 text-2xl font-extrabold text-text"
              ref={titleRef}
            >
              Ingressos
            </Text>
            <Button label="Fechar" onPress={onClose} size="sm" variant="ghost" />
          </View>

          <Text className="mt-1 text-sm text-text-muted" numberOfLines={2}>
            {eventName}
          </Text>

          <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
            {stage === 'loading' ? (
              <Text className="py-6 text-center text-md text-text-muted">
                Verificando disponibilidade…
              </Text>
            ) : null}

            {/* A closed sale is a product state, not an error screen. */}
            {stage !== 'loading' && unavailableReason ? (
              <View className="rounded-xl border border-border-muted bg-surface-raised p-4">
                <Text className="text-md font-bold text-text-soft">{unavailableReason}</Text>
                <Text className="mt-1 text-sm text-text-muted">
                  Nenhuma cobrança foi gerada.
                </Text>
              </View>
            ) : null}

            {stage === 'reserved' && reservation ? (
              <View className="rounded-xl border border-primary bg-primary-surface p-4">
                <Text className="text-lg font-extrabold text-primary">Ingressos reservados</Text>
                <Text className="mt-1.5 text-md text-text-soft">
                  {reservation.quantity}{' '}
                  {reservation.quantity === 1 ? 'ingresso' : 'ingressos'} •{' '}
                  {formatCents(reservation.totalInCents)}
                </Text>
                <Text className="mt-2 text-sm text-text-muted">
                  A reserva vale até{' '}
                  {new Date(reservation.expiresAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  . O ingresso é emitido somente após a confirmação do pagamento.
                </Text>
              </View>
            ) : null}

            {stage !== 'loading' && !unavailableReason && stage !== 'reserved' ? (
              <>
                <Text className="mb-2 text-sm font-bold text-text-muted">Lote</Text>
                <View className="flex-row flex-wrap gap-2.5">
                  {tiers.map((tier) => (
                    <Chip
                      disabled={tier.available <= 0}
                      key={tier.id}
                      label={tierLabel(tier)}
                      onPress={() => controller.selectTier(tier)}
                      selected={selectedTier?.id === tier.id}
                    />
                  ))}
                </View>

                {selectedTier ? (
                  <>
                    <Text className="mb-2 mt-5 text-sm font-bold text-text-muted">Quantidade</Text>
                    <View className="flex-row items-center justify-between">
                      <Stepper
                        itemLabel="ingresso"
                        onDecrement={() => controller.setQuantity(quantity - 1)}
                        onIncrement={() => controller.setQuantity(quantity + 1)}
                        quantity={quantity}
                        size="lg"
                      />
                      <Text className="text-2xl font-black text-primary">
                        {formatCents(multiplyCents(selectedTier.priceInCents, quantity))}
                      </Text>
                    </View>

                    <Text className="mt-2 text-xs text-text-dim">
                      Limite de {selectedTier.maxPerUser} por pessoa • {selectedTier.available}{' '}
                      disponíveis
                    </Text>
                  </>
                ) : null}
              </>
            ) : null}

            {error ? (
              <Text
                accessibilityLiveRegion="polite"
                className="mt-3.5 text-sm text-danger-alt"
              >
                {error}
              </Text>
            ) : null}
          </ScrollView>

          {stage !== 'loading' && !unavailableReason && stage !== 'reserved' && selectedTier ? (
            <Button
              className="mt-4"
              disabled={selectedTier.available <= 0}
              fullWidth
              label="Reservar e pagar"
              loading={stage === 'reserving'}
              onPress={controller.reserve}
              size="lg"
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function tierLabel(tier: TicketTier): string {
  if (tier.available <= 0) return `${tier.name} — esgotado`;
  return `${tier.name} • ${formatCents(tier.priceInCents)}`;
}
