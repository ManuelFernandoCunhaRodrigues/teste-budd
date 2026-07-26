import { useRouter } from 'expo-router';

import {
  BagIcon,
  BellIcon,
  BuddLogo,
  GearIcon,
  HeartMenuIcon,
  LogoutIcon,
  ShieldIcon,
  SlidersIcon,
  StarMenuIcon,
  WhatsAppIcon,
} from '@/components/ui/icons';
import { ROUTES } from '@/constants/routes';
import {
  isWhatsAppSupportAvailable,
  openWhatsAppSupport,
  WHATSAPP_ERROR_MESSAGES,
} from '@/services/externalLinks/whatsapp';
import { showToast } from '@/store/toastStore';
import { selectBalanceInCents, useWalletStore } from '@/store/walletStore';
import { formatCents } from '@/utils/money';

export interface ProfileMenuEntry {
  key: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  badge?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link';
}

/**
 * Builds the profile menu.
 *
 * Lives in a hook so `ProfileScreen` stays presentational — the routing and
 * the WhatsApp deep link are wiring, not layout.
 */
export function useProfileMenu(onRequestLogout: () => void): ProfileMenuEntry[] {
  const router = useRouter();
  // `null` while the balance has not been fetched — distinct from a real zero,
  // so the badge stays hidden instead of asserting "R$ 0,00".
  const balanceInCents = useWalletStore(selectBalanceInCents);

  // Configuration decides whether support exists at all; the row is disabled
  // rather than hidden, so the absence is visible instead of mysterious.
  const supportAvailable = isWhatsAppSupportAvailable();

  const openWhatsApp = async () => {
    const result = await openWhatsAppSupport('support');
    if (result.status === 'opened') return;

    showToast(WHATSAPP_ERROR_MESSAGES[result.status]);
  };

  return [
    {
      key: 'credit',
      title: 'Crédito disponível',
      icon: <BuddLogo size={24} />,
      badge: balanceInCents !== null && balanceInCents > 0 ? formatCents(balanceInCents) : undefined,
      onPress: () => router.push(ROUTES.recharge),
    },
    {
      key: 'orders',
      title: 'Histórico de pedidos',
      icon: <BagIcon />,
      onPress: () => router.push(ROUTES.orderHistory),
    },
    {
      key: 'favorites',
      title: 'Bares favoritos',
      icon: <HeartMenuIcon />,
      onPress: () => router.push(ROUTES.favorites),
    },
    {
      key: 'recommendations',
      title: 'Recomendações para você',
      icon: <StarMenuIcon />,
      onPress: () => router.push(ROUTES.recommendations),
    },
    {
      key: 'preferences',
      title: 'Preferências',
      icon: <SlidersIcon />,
      onPress: () => router.push(ROUTES.preferences),
    },
    {
      key: 'settings',
      title: 'Configurações',
      icon: <GearIcon />,
      onPress: () => router.push(ROUTES.settings),
    },
    {
      key: 'notifications',
      title: 'Notificações',
      icon: <BellIcon />,
      onPress: () => router.push(ROUTES.notifications),
    },
    {
      key: 'privacy',
      title: 'Política de Privacidade',
      icon: <ShieldIcon />,
      onPress: () => router.push(ROUTES.privacy),
    },
    {
      key: 'support',
      title: supportAvailable ? 'Atendimento pelo WhatsApp' : 'Atendimento indisponível',
      icon: <WhatsAppIcon />,
      disabled: !supportAvailable,
      accessibilityRole: supportAvailable ? 'link' : 'button',
      accessibilityLabel: supportAvailable
        ? 'Abrir atendimento no WhatsApp'
        : 'Atendimento indisponível',
      accessibilityHint: supportAvailable
        ? undefined
        : 'O número de atendimento não está configurado.',
      onPress: openWhatsApp,
    },
    {
      key: 'logout',
      title: 'Sair da conta',
      icon: <LogoutIcon />,
      onPress: onRequestLogout,
    },
  ];
}
