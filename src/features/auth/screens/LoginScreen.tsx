import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/layout';
import { Avatar, Button, Touchable } from '@/components/ui';
import { BuddLogo } from '@/components/ui/icons';
import { backendMode, DEV_CREDENTIALS, isDevBackendActive } from '@/services/backend';
import { validateCredentials } from '@/services/auth/authService';
import { useSessionStore } from '@/store/sessionStore';
import { colors } from '@/theme';
import { cn } from '@/utils/cn';

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
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center gap-4">
            <Avatar bordered size={96}>
              <BuddLogo size={52} />
            </Avatar>

            <Text accessibilityRole="header" className="text-center text-6xl font-black text-text">
              Entrar no budd
            </Text>

            <Text className="max-w-[300px] text-center text-md leading-6 text-text-muted">
              Acesse sua conta para ver pedidos, favoritos e créditos.
            </Text>
          </View>

          {backendUnavailable ? (
            <View
              accessibilityLiveRegion="polite"
              className="mt-5 rounded-xl border border-danger-border bg-surface p-4"
            >
              <Text className="text-md font-bold text-danger">Autenticação indisponível</Text>
              <Text className="mt-1 text-sm leading-5 text-text-muted">
                O servidor de autenticação ainda não foi configurado, portanto não é possível
                entrar. Configure `EXPO_PUBLIC_API_URL` para apontar para a API.
              </Text>
            </View>
          ) : null}

          <View className="mt-6 gap-4">
            <Field
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

            <Field
              error={fieldErrors.password}
              inputRef={passwordRef}
              label="Senha"
              onChangeText={(text) => {
                setPassword(text);
                if (fieldErrors.password)
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
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
                // Hidden by default; the toggle below reveals it.
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

          {/* Seeded credentials, shown only while the in-memory dev backend is on. */}
          {isDevBackendActive ? (
            <Text className="mt-4 text-center text-xs text-text-dim">
              [dev] {DEV_CREDENTIALS.email} / {DEV_CREDENTIALS.password}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  trailing?: React.ReactNode;
  inputRef?: React.RefObject<TextInput | null>;
  props?: React.ComponentProps<typeof TextInput>;
}

/** Labelled input with inline validation message. */
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  trailing,
  inputRef,
  props,
}: FieldProps) {
  return (
    <View>
      <Text className="mb-1.5 text-sm font-bold text-text-muted">{label}</Text>

      <View
        className={cn(
          'flex-row items-center gap-2.5 rounded-lg border bg-surface-raised px-4 py-3.5',
          error ? 'border-danger-border' : 'border-surface-muted',
        )}
      >
        <TextInput
          accessibilityHint={error}
          accessibilityLabel={label}
          className="min-w-0 flex-1 text-lg text-text"
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDim}
          ref={inputRef}
          value={value}
          {...props}
        />
        {trailing}
      </View>

      {error ? (
        <Text accessibilityLiveRegion="polite" className="mt-1 text-sm text-danger-alt">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
