import { MIN_TOUCH_TARGET } from '@/theme';
import { cn } from '@/utils/cn';

import { Touchable, type TouchableProps } from './Touchable';

export type IconButtonVariant = 'tint' | 'overlay' | 'neutral' | 'plain';

export interface IconButtonProps extends Omit<TouchableProps, 'children'> {
  /** Required — icon-only controls are invisible to screen readers without it. */
  accessibilityLabel: string;
  children: React.ReactNode;
  variant?: IconButtonVariant;
  /** Diameter in points. Defaults to the 44pt minimum touch target. */
  size?: number;
}

const VARIANT: Record<IconButtonVariant, string> = {
  /** Green-tinted circle used by in-page headers. */
  tint: 'bg-primary-tint border border-primary-border',
  /** Translucent circle that sits on top of cover artwork. */
  overlay: 'bg-black/55',
  neutral: 'bg-surface-raised',
  plain: 'bg-transparent',
};

export function IconButton({
  children,
  variant = 'tint',
  size = MIN_TOUCH_TARGET,
  className,
  ...props
}: IconButtonProps) {
  return (
    <Touchable
      accessibilityRole="button"
      className={cn('items-center justify-center rounded-full', VARIANT[variant], className)}
      style={{ width: size, height: size }}
      {...props}
    >
      {children}
    </Touchable>
  );
}
