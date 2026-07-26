import { ConfirmDialog } from '@/components/feedback';
import { selectCartVenue, selectPendingSwitch, useCartStore } from '@/store/cartStore';

/**
 * Asks before replacing a cart that belongs to another venue.
 *
 * Mounted once in the private layout rather than per screen, because an add can
 * come from the venue detail, the highlights grid or the event menu, and all of
 * them must get the same prompt. Nothing is cleared until the user confirms.
 */
export function VenueSwitchDialog() {
  const pending = useCartStore(selectPendingSwitch);
  const currentVenue = useCartStore(selectCartVenue);
  const confirmVenueSwitch = useCartStore((state) => state.confirmVenueSwitch);
  const cancelVenueSwitch = useCartStore((state) => state.cancelVenueSwitch);

  const message = currentVenue
    ? `Seu carrinho possui itens de ${currentVenue.name}. Para adicionar este produto, será necessário limpar o carrinho atual.`
    : 'Seu carrinho possui itens de outro estabelecimento. Para adicionar este produto, será necessário limpar o carrinho atual.';

  return (
    <ConfirmDialog
      cancelLabel="Manter carrinho"
      confirmLabel="Limpar e adicionar"
      message={message}
      onCancel={cancelVenueSwitch}
      onConfirm={confirmVenueSwitch}
      title="Trocar de estabelecimento?"
      visible={pending !== null}
    />
  );
}
