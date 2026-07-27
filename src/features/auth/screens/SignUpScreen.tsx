import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button, Touchable } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { validateSignUp, type SignUpFormInput } from '@/services/auth/authService';
import { backendMode } from '@/services/backend';
import { useSessionStore } from '@/store/sessionStore';

import { AuthField } from '../components/AuthField';
import { AuthLayout } from '../components/AuthLayout';

type FieldErrors = Partial<Record<keyof SignUpFormInput, string>>;

/**
 * Account creation.
 *
 * Nothing here declares success on its own: the screen validates, hands the
 * details to the session store, and navigates only once a real session comes
 * back. Against `unavailableBackend` the attempt is refused and the message
 * says so, rather than dropping the user into the app with no account behind
 * them.
 */
export function SignUpScreen() {
  const router = useRouter();

  const signUp = useSessionStore((state) => state.signUp);
  const isSigningIn = useSessionStore((state) => state.isSigningIn);
  const authError = useSessionStore((state) => state.authError);
  const clearAuthError = useSessionStore((state) => state.clearAuthError);

  const [form, setForm] = useState<SignUpFormInput>({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmationRef = useRef<TextInput>(null);

  const backendUnavailable = backendMode === 'unavailable';
  const disabled = isSigningIn || backendUnavailable;

  const update = (key: keyof SignUpFormInput) => (text: string) => {
    setForm((current) => ({ ...current, [key]: text }));
    // Clears only the field being corrected, so the other messages stay put
    // instead of flickering away as the user types.
    if (fieldErrors[key]) setFieldErrors((current) => ({ ...current, [key]: undefined }));
    if (authError) clearAuthError();
  };

  const handleSubmit = async () => {
    if (isSigningIn) return;

    const errors = validateSignUp(form);
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    try {
      await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      router.replace('/role');
    } catch {
      // `authError` carries the user-safe message; the screen stays put.
    }
  };

  return (
    <AuthLayout
      compact
      subtitle="Crie sua conta para salvar favoritos, pedidos e créditos."
      title="Criar conta"
    >
      {backendUnavailable ? (
        <View
          accessibilityLiveRegion="polite"
          className="mb-5 rounded-xl border border-danger-border bg-surface p-4"
        >
          <Text className="text-md font-bold text-danger">Cadastro indisponível</Text>
          <Text className="mt-1 text-sm leading-5 text-text-muted">
            O servidor ainda não foi configurado, portanto não é possível criar uma conta agora.
          </Text>
        </View>
      ) : null}

      <View className="gap-4">
        <AuthField
          error={fieldErrors.name}
          label="Nome"
          onChangeText={update('name')}
          placeholder="Como te chamamos?"
          props={{
            autoCapitalize: 'words',
            autoComplete: 'name',
            editable: !disabled,
            onSubmitEditing: () => emailRef.current?.focus(),
            returnKeyType: 'next',
            textContentType: 'name',
          }}
          value={form.name}
        />

        <AuthField
          error={fieldErrors.email}
          inputRef={emailRef}
          label="E-mail"
          onChangeText={update('email')}
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
          value={form.email}
        />

        <AuthField
          error={fieldErrors.password}
          inputRef={passwordRef}
          label="Senha"
          onChangeText={update('password')}
          placeholder="Ao menos 6 caracteres"
          props={{
            autoCapitalize: 'none',
            autoComplete: 'new-password',
            autoCorrect: false,
            editable: !disabled,
            onSubmitEditing: () => confirmationRef.current?.focus(),
            returnKeyType: 'next',
            secureTextEntry: !showPassword,
            textContentType: 'newPassword',
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
          value={form.password}
        />

        <AuthField
          error={fieldErrors.passwordConfirmation}
          inputRef={confirmationRef}
          label="Confirmar senha"
          onChangeText={update('passwordConfirmation')}
          placeholder="Repita a senha"
          props={{
            autoCapitalize: 'none',
            autoComplete: 'new-password',
            autoCorrect: false,
            editable: !disabled,
            onSubmitEditing: handleSubmit,
            returnKeyType: 'go',
            secureTextEntry: !showPassword,
            textContentType: 'newPassword',
          }}
          value={form.passwordConfirmation}
        />
      </View>

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
        label="Criar conta"
        loading={isSigningIn}
        onPress={handleSubmit}
        size="lg"
      />

      <View className="mt-5 flex-row items-center justify-center gap-1.5">
        <Text className="text-md text-text-muted">Já tem conta?</Text>
        <Touchable
          accessibilityLabel="Voltar para o login"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.replace(ROUTES.login)}
        >
          <Text className="text-md font-bold text-primary">Entrar</Text>
        </Touchable>
      </View>
    </AuthLayout>
  );
}
