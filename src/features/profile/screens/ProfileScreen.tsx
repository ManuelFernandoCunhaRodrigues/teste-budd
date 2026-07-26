import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ConfirmDialog } from '@/components/feedback';
import { Screen } from '@/components/layout';
import { TAB_BAR_CONTENT_INSET } from '@/components/navigation';
import { IconButton, Touchable } from '@/components/ui';
import { EditIcon, MapPinIcon, TrashIcon } from '@/components/ui/icons';
import { CURRENT_USER } from '@/mocks/profile';
import { normalizeError } from '@/services/errors';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useSessionStore } from '@/store/sessionStore';
import { showToast } from '@/store/toastStore';
import { useWalletStore } from '@/store/walletStore';
import { colors } from '@/theme';

import { ProfileMenuItem } from '../components/ProfileMenuItem';
import { ProfileStats } from '../components/ProfileStats';
import { useProfileMenu } from '../hooks/useProfileMenu';

/** Account hub: stats, navigation menu and destructive account actions. */
export function ProfileScreen() {
  const router = useRouter();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const signOut = useSessionStore((state) => state.signOut);
  const isSigningOut = useSessionStore((state) => state.isSigningOut);
  const deleteAccount = useSessionStore((state) => state.deleteAccount);
  const isDeletingAccount = useSessionStore((state) => state.isDeletingAccount);
  const user = useSessionStore((state) => state.user);
  const favoritesCount = useFavoritesStore((state) => state.barIds.length);
  const refreshWallet = useWalletStore((state) => state.refresh);
  const menu = useProfileMenu(() => setLogoutVisible(true));

  // The balance shown in the menu is the server's, so it has to be fetched.
  useEffect(() => {
    void refreshWallet();
  }, [refreshWallet]);

  const handleLogout = async () => {
    // The store also drops a concurrent call, so a double tap cannot sign out twice.
    if (isSigningOut) return;

    setLogoutVisible(false);
    await signOut();

    // `replace` rather than `push`: the private stack must not remain behind
    // this screen for the Android back button to return to.
    router.replace('/login');
  };

  const handleDelete = async () => {
    if (isDeletingAccount) return;

    setDeleteError(null);

    try {
      // Resolves only when the server confirmed the deletion.
      await deleteAccount();

      // The private layout would redirect on its own once the status flips, but
      // replacing here removes the profile from the stack immediately, so the
      // Android back button cannot return to it.
      setDeleteVisible(false);
      router.replace('/login');
      showToast('Sua conta foi excluída');
    } catch (error) {
      // The dialog stays open with the reason: closing it would read as success.
      setDeleteError(normalizeError(error).userMessage);
    }
  };

  return (
    <>
      <Screen
        contentContainerStyle={{ paddingBottom: TAB_BAR_CONTENT_INSET }}
        contentClassName="px-4 pt-2"
        scroll
      >
        <View className="flex-row items-center justify-between px-0.5 pb-1 pt-2">
          <View className="w-11" />
          <Text accessibilityRole="header" className="text-3xl font-extrabold text-text">
            Perfil
          </Text>
          <IconButton
            accessibilityLabel="Editar perfil"
            onPress={() => showToast('Edição de perfil em breve')}
          >
            <EditIcon size={18} />
          </IconButton>
        </View>

        <ProfileStats
          buddcoins={CURRENT_USER.buddcoins}
          favorites={favoritesCount}
          orders={CURRENT_USER.ordersCount}
        />

        <View className="mt-4 items-center">
          {/* The signed-in user's own name, falling back to the mock profile
              for the fields the session does not carry. */}
          <Text className="text-5xl font-black text-text">{user?.name ?? CURRENT_USER.name}</Text>
          <View className="mt-1.5 flex-row items-center gap-1.5">
            <MapPinIcon color={colors.primary} size={14} />
            <Text className="text-base text-text-muted">{CURRENT_USER.city}</Text>
          </View>
        </View>

        <View className="mt-5.5">
          {menu.map((entry) => (
            <ProfileMenuItem
              accessibilityHint={entry.accessibilityHint}
              accessibilityRole={entry.accessibilityRole}
              badge={entry.badge}
              disabled={entry.disabled}
              icon={entry.icon}
              key={entry.key}
              onPress={entry.onPress}
              title={entry.title}
            />
          ))}
        </View>

        <Touchable
          accessibilityLabel="Excluir conta"
          accessibilityRole="button"
          className="mt-6.5 flex-row items-center justify-center gap-2.5 rounded-lg border border-danger-border py-4"
          onPress={() => setDeleteVisible(true)}
        >
          <TrashIcon color={colors.danger} size={18} />
          <Text className="text-md font-extrabold text-danger">Excluir Conta</Text>
        </Touchable>
      </Screen>

      <ConfirmDialog
        confirmLabel="Sair"
        message="Tem certeza de que deseja sair da sua conta?"
        onCancel={() => setLogoutVisible(false)}
        onConfirm={handleLogout}
        title="Sair da conta"
        visible={logoutVisible}
      />

      <ConfirmDialog
        confirmLabel="Excluir conta"
        destructive
        errorMessage={deleteError}
        loading={isDeletingAccount}
        message="Esta ação removerá seu perfil e apagará permanentemente seus dados, favoritos, histórico e preferências. Esta ação não poderá ser desfeita."
        onCancel={() => {
          setDeleteVisible(false);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        title="Excluir sua conta?"
        visible={deleteVisible}
      />
    </>
  );
}
