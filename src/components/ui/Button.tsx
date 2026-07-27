import { ActivityIndicator, Text, View } from 'react-native';

import { colors } from '@/theme';
import { cn } from '@/utils/cn';

import { Touchable, type TouchableProps } from './Touchable';

export type ButtonVariant = 'primary' | 'neutral' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Rendered before the label — an icon, badge or count bubble. */
  leading?: React.ReactNode;
  /** Rendered after the label, pushed to the far end when set. */
  trailing?: React.ReactNode;
  fullWidth?: boolean;
}

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  neutral: 'bg-surface-raised',
  outline: 'bg-transparent border border-primary',
  danger: 'bg-danger-solid',
  ghost: 'bg-transparent border border-surface-muted',
};

const LABEL: Record<ButtonVariant, string> = {
  primary: 'text-bg font-extrabold',
  neutral: 'text-text font-bold',
  outline: 'text-primary font-extrabold',
  danger: 'text-text font-extrabold',
  ghost: 'text-text-muted font-bold',
};

const SIZE: Record<ButtonSize, string> = {
  // Every size clears the 44pt minimum touch target.
  sm: 'px-4 py-2.5 rounded-sm min-h-[44px]',
  md: 'px-4 py-3.5 rounded-lg min-h-[48px]',
  lg: 'px-5 py-[17px] rounded-xl min-h-[56px]',
};

const LABEL_SIZE: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-md',
  lg: 'text-xl',
};

const SPINNER_COLOR: Record<ButtonVariant, string> = {
  primary: colors.background,
  neutral: colors.text,
  outline: colors.primary,
  danger: colors.text,
  ghost: colors.textMuted,
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  leading,
  trailing,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  // Loading blocks interaction but keeps the normal variant surface: the
  // spinner colours were designed for that surface. Treating loading as the
  // muted disabled palette made the primary spinner black on dark grey.
  const usesDisabledPalette = !!disabled && !loading;

  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      className={cn(
        'flex-row items-center justify-center gap-2.5',
        CONTAINER[variant],
        SIZE[size],
        fullWidth && 'w-full',
        // The design greys the whole control out rather than fading it.
        usesDisabledPalette && variant === 'primary' && 'bg-surface-muted',
        className,
      )}
      disabled={isDisabled}
      dimWhenDisabled={!loading && variant !== 'primary'}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={SPINNER_COLOR[variant]} size="small" />
      ) : (
        <>
          {leading}
          <Text
            className={cn(
              LABEL[variant],
              LABEL_SIZE[size],
              trailing ? 'flex-1' : '',
              // `text-muted` on `surface-muted`, not `text-faint`: the latter
              // gave 2.1:1 against the disabled background, which is unreadable.
              // This is 5.1:1 and still clearly reads as inactive.
              usesDisabledPalette && variant === 'primary' && 'text-text-muted',
            )}
            numberOfLines={1}
          >
            {label}
          </Text>
          {trailing ? <View>{trailing}</View> : null}
        </>
      )}
    </Touchable>
  );
}
