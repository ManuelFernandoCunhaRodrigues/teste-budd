import { Text, TextInput, View } from 'react-native';

import { colors } from '@/theme';
import { cn } from '@/utils/cn';

export interface AuthFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  trailing?: React.ReactNode;
  inputRef?: React.RefObject<TextInput | null>;
  props?: React.ComponentProps<typeof TextInput>;
}

/**
 * Labelled input with an inline validation message.
 *
 * Lifted out of `LoginScreen` so sign-up does not grow a second copy that
 * drifts — the two forms must fail in the same visual language.
 */
export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  trailing,
  inputRef,
  props,
}: AuthFieldProps) {
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
