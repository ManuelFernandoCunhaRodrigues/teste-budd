import { useRouter } from 'expo-router';
import { Linking } from 'react-native';

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
import { SUPPORT_WHATSAPP } from '@/constants/app';
import { ROUTES } from '@/constants/routes';
import { showToast } from '@/store/toastStore';
import { selectBalanceInCents, useWalletStore } from '@/store/walletStore';
import { formatCents } from '@/utils/money';

export interface ProfileMenuEntry {
  key: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  badge?: string;
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

  const openWhatsApp = async () => {
    const url = `https://wa.me/${SUPPORT_WHATSAPP.phone}?text=${encodeURIComponent(
      SUPPORT_WHATSAPP.message,
    )}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        showToast('Não foi possível abrir o WhatsApp');
        return;
      }
      await Linking.openURL(url);
    } catch {
      showToast('Não foi possível abrir o WhatsApp');
    }
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
      title: 'Atendimento pelo WhatsApp',
      icon: <WhatsAppIcon />,
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
