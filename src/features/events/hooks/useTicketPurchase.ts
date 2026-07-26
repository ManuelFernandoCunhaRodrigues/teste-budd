import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  TicketAvailability,
  TicketReservation,
  TicketTier,
} from '@/domain/tickets/ticketTypes';
import { normalizeError, reportError } from '@/services/errors';
import { createReservation, fetchAvailability } from '@/services/tickets/ticketService';
import { createIdempotencyKey } from '@/utils/idempotency';

export type TicketStage = 'loading' | 'browsing' | 'reserving' | 'reserved' | 'error';

export interface TicketPurchaseController {
  stage: TicketStage;
  availability: TicketAvailability | null;
  selectedTier: TicketTier | null;
  quantity: number;
  reservation: TicketReservation | null;
  error: string | null;

  selectTier: (tier: TicketTier) => void;
  setQuantity: (quantity: number) => void;
  reserve: () => void;
  reload: () => void;
}

/**
 * Ticket purchase for one event.
 *
 * Availability is asked for before anything is offered, so "sold out", "event
 * ended" and "not selling" are product states rather than failures discovered
 * after a tap. Reservation is idempotent: a double tap holds stock once, and a
 * reservation is a hold — never an issued ticket.
 *
 * State updates run in promise callbacks, matching `useAsyncData`.
 */
export function useTicketPurchase(eventId: string): TicketPurchaseController {
  const [stage, setStage] = useState<TicketStage>('loading');
  const [availability, setAvailability] = useState<TicketAvailability | null>(null);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [quantity, setQuantityState] = useState(1);
  const [reservation, setReservation] = useState<TicketReservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const inFlightRef = useRef(false);
  const reservationKeyRef = useRef<string | null>(null);

  const applyAvailability = useCallback((result: TicketAvailability) => {
    setAvailability(result);

    // Pre-select the first tier that actually has stock.
    const firstWithStock =
      result.kind === 'available' ? result.tiers.find((tier) => tier.available > 0) : undefined;
    setSelectedTier(firstWithStock ?? null);
    setQuantityState(1);
    setStage('browsing');
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    inFlightRef.current = true;

    fetchAvailability(eventId)
      .then((result) => {
        if (cancelled) return;
        applyAvailability(result);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        const normalized = normalizeError(caught);
        reportError(caught, { scope: 'useTicketPurchase.fetchAvailability', eventId });
        setError(normalized.userMessage);
        setStage('error');
      })
      .finally(() => {
        inFlightRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, applyAvailability, attempt]);

  const reload = useCallback(() => {
    if (inFlightRef.current) return;
    setStage('loading');
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  const selectTier = useCallback((tier: TicketTier) => {
    setSelectedTier(tier);
    // Clamp to what the newly picked tier allows.
    setQuantityState((current) =>
      Math.min(current, Math.max(1, Math.min(tier.maxPerUser, tier.available))),
    );
    setError(null);
  }, []);

  const setQuantity = useCallback(
    (next: number) => {
      if (!selectedTier) return;

      const ceiling = Math.max(1, Math.min(selectedTier.maxPerUser, selectedTier.available));
      setQuantityState(Math.min(Math.max(1, Math.trunc(next)), ceiling));
      setError(null);
    },
    [selectedTier],
  );

  const reserve = useCallback(() => {
    if (inFlightRef.current || !selectedTier) return;

    inFlightRef.current = true;
    setStage('reserving');
    setError(null);

    // Reused across retries of the same attempt, so a timeout followed by
    // another tap resolves to the original hold.
    if (!reservationKeyRef.current) {
      reservationKeyRef.current = createIdempotencyKey('reservation');
    }

    const tier = selectedTier;

    Promise.resolve()
      .then(() =>
        createReservation(
          { eventId, tierId: tier.id, quantity, idempotencyKey: reservationKeyRef.current as string },
          tier,
        ),
      )
      .then((held) => {
        // A hold, not a ticket. Nothing is issued until payment clears.
        setReservation(held);
        setStage('reserved');
      })
      .catch((caught: unknown) => {
        const normalized = normalizeError(caught);
        reportError(caught, { scope: 'useTicketPurchase.reserve', eventId });
        setError(normalized.userMessage);
        setStage('browsing');

        // Stock or limit moved under us — re-read so the UI stops offering it.
        if (normalized.code === 'out_of_stock') setAttempt((value) => value + 1);
      })
      .finally(() => {
        inFlightRef.current = false;
      });
  }, [eventId, quantity, selectedTier]);

  return {
    stage,
    availability,
    selectedTier,
    quantity,
    reservation,
    error,
    selectTier,
    setQuantity,
    reserve,
    reload,
  };
}
