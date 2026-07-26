import type {
  CreateReservationInput,
  Ticket,
  TicketAvailability,
  TicketReservation,
  TicketTier,
} from '@/domain/tickets/ticketTypes';
import { backend } from '@/services/backend';
import { AppError } from '@/services/errors';

/**
 * Ticketing use cases.
 *
 * The old event screen had a "Comprar ingresso" button that navigated to the cart
 * and toasted "Ingresso adicionado ao carrinho" without adding anything. Here a
 * purchase is a reservation followed by a payment, and a ticket only exists once
 * the payment is confirmed.
 */

export function fetchAvailability(eventId: string): Promise<TicketAvailability> {
  return backend.fetchTicketAvailability(eventId);
}

/**
 * Holds stock ahead of payment.
 *
 * Validates the request against the tier the user is looking at, so an
 * out-of-range quantity never reaches the network. The server enforces the same
 * limits — a client check is a courtesy, not a control.
 */
export function createReservation(
  input: CreateReservationInput,
  tier: TicketTier,
): Promise<TicketReservation> {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new AppError('validation', {
      userMessage: 'Escolha uma quantidade válida.',
      detail: `createReservation: quantity ${input.quantity}`,
    });
  }

  if (input.quantity > tier.maxPerUser) {
    throw new AppError('validation', {
      userMessage: `O limite é ${tier.maxPerUser} ingressos por pessoa neste lote.`,
      detail: `createReservation: quantity ${input.quantity} over ${tier.maxPerUser}`,
    });
  }

  if (input.quantity > tier.available) {
    throw new AppError('out_of_stock', {
      userMessage:
        tier.available > 0
          ? `Restam apenas ${tier.available} ingressos neste lote.`
          : 'Este lote está esgotado.',
      detail: `createReservation: only ${tier.available} available`,
    });
  }

  return backend.createReservation(input);
}

export function fetchTickets(): Promise<Ticket[]> {
  return backend.fetchTickets();
}

/** Copy for each non-purchasable state, so the UI never has to invent one. */
export function availabilityMessage(availability: TicketAvailability): string | null {
  switch (availability.kind) {
    case 'available':
      return null;
    case 'sold_out':
      return 'Ingressos esgotados.';
    case 'event_ended':
      return 'Este evento já foi encerrado.';
    case 'unavailable':
      return availability.reason;
  }
}
