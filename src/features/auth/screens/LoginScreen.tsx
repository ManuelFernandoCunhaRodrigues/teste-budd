import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button, Touchable } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { validateCredentials } from '@/services/auth/authService';
import { backendMode, DEV_CREDENTIALS, isDevBackendActive } from '@/services/backend';
import { useSessionStore } from '@/store/sessionStore';

import { AuthField } from '../components/AuthField';
import { AuthLayout } from '../components/AuthLayout';

/**
 * Credential sign-in.
 *
 * The previous screen had no form at all: a single button called `signIn()` with
 * no arguments and navigated in the same tick, so the app was reachable without
 * credentials. Here nothing navigates until the service resolves — and the route
 * guard in `(private)/_layout` re-checks regardless, so a navigation slip cannot
 * expose a private screen.
 */
export function LoginScreen() {
  const router = useRouter();

  const signIn = useSessionStore((state) => state.signIn);
  const isSigningIn = useSessionStore((state) => state.isSigningIn);
  const authError = useSessionStore((state) => state.authError);
  const clearAuthError = useSessionStore((state) => state.clearAuthError);

  // Prefilled while the in-memory dev backend is serving, so a reload is one tap
  // from signed in. Against a real backend both fields start empty.
  const [email, setEmail] = useState(isDevBackendActive ? DEV_CREDENTIALS.email : '');
  const [password, setPassword] = useState(isDevBackendActive ? DEV_CREDENTIALS.password : '');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const passwordRef = useRef<TextInput>(null);

  /** No server is configured, so signing in cannot succeed. Say so up front. */
  const backendUnavailable = backendMode === 'unavailable';

  const handleSubmit = async () => {
    // Belt and braces: the button is disabled while submitting, and the store
    // drops a concurrent call. Neither alone is a guarantee.
    if (isSigningIn) return;

    const errors = validateCredentials({ email, password });
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    try {
      await signIn({ email, password });
      // Reached only on a valid session.
      router.replace('/role');
    } catch {
      // The store already holds a user-safe message in `authError`; it is
      // rendered below. Swallowed here so the screen stays put.
    }
  };

  const disabled = isSigningIn || backendUnavailable;

  return (
    <AuthLayout
      subtitle="Acesse sua conta para ver pedidos, favoritos e créditos."
      title="Bem-vindo de volta"
    >
      {backendUnavailable ? (
        <View
          accessibilityLiveRegion="polite"
          className="mb-5 rounded-xl border border-danger-border bg-surface p-4"
        >
          <Text className="text-md font-bold text-danger">Autenticação indisponível</Text>
          <Text className="mt-1 text-sm leading-5 text-text-muted">
            O servidor de autenticação ainda não foi configurado, portanto não é possível entrar.
            Configure `EXPO_PUBLIC_API_URL` para apontar para a API.
          </Text>
        </View>
      ) : null}

      <View className="gap-4">
        <AuthField
          error={fieldErrors.email}
          label="E-mail"
          onChangeText={(text) => {
            setEmail(text);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            if (authError) clearAuthError();
          }}
          placeholder="voce@email.com"
          props={{
            autoCapitalize: 'none',
            autoComplete: 'email',
            autoCorrect: false,
            editable: !disabled,
            inputMode: 'email',
            keyboardType: 'email-address',
            onSubmitEditing: () => passwordRef.current?.focus(),
            returnKeyType: 'next',
            textContentType: 'emailAddress',
          }}
          value={email}
        />

        <AuthField
          error={fieldErrors.password}
          inputRef={passwordRef}
          label="Senha"
          onChangeText={(text) => {
            setPassword(text);
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            if (authError) clearAuthError();
          }}
          placeholder="Sua senha"
          props={{
            autoCapitalize: 'none',
            autoComplete: 'current-password',
            autoCorrect: false,
            editable: !disabled,
            onSubmitEditing: handleSubmit,
            returnKeyType: 'go',
            secureTextEntry: !showPassword,
            textContentType: 'password',
          }}
          trailing={
            <Touchable
              accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              accessibilityRole="button"
              accessibilityState={{ selected: showPassword }}
              hitSlop={8}
              onPress={() => setShowPassword((current) => !current)}
            >
              <Text className="text-sm font-bold text-primary">
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </Text>
            </Touchable>
          }
          value={password}
        />
      </View>

      {/* Announced to screen readers as soon as it appears. */}
      {authError ? (
        <Text
          accessibilityLiveRegion="assertive"
          className="mt-4 text-center text-sm text-danger-alt"
          role="alert"
        >
          {authError}
        </Text>
      ) : null}

      <Button
        className="mt-6"
        disabled={disabled}
        fullWidth
        label="Entrar"
        loading={isSigningIn}
        onPress={handleSubmit}
        size="lg"
      />

      <View className="mt-5 flex-row items-center justify-center gap-1.5">
        <Text className="text-md text-text-muted">Não tem conta?</Text>
        <Touchable
          accessibilityLabel="Criar uma conta"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.push(ROUTES.signup)}
        >
          <Text className="text-md font-bold text-primary">Cadastre-se</Text>
        </Touchable>
      </View>

      {/* Seeded credentials, shown only while the in-memory dev backend is on. */}
      {isDevBackendActive ? (
        <Text className="mt-4 text-center text-xs text-text-dim">
          [dev] {DEV_CREDENTIALS.email} / {DEV_CREDENTIALS.password}
        </Text>
      ) : null}
    </AuthLayout>
  );
}
