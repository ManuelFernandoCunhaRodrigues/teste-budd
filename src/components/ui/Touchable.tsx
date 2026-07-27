import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { cn } from '@/utils/cn';

export type PressFeedback = 'press' | 'card' | 'none';

export interface TouchableProps extends Omit<PressableProps, 'style'> {
  className?: string;
  /**
   * `press` mirrors the design's `.bud-press` (scale 0.94 + dim) for buttons;
   * `card` mirrors `.bud-card` (subtle 0.98) for large tappable surfaces.
   */
  feedback?: PressFeedback;
  /**
   * Whether a disabled control should inherit the generic 45% opacity.
   *
   * Composite controls such as `Button` provide their own contrast-safe
   * disabled colours and must opt out; otherwise the extra opacity blends both
   * colours into the page and makes the label unreadable.
   */
  dimWhenDisabled?: boolean;
  /** Merged underneath the press transform. */
  style?: StyleProp<ViewStyle>;
}

const SCALE: Record<PressFeedback, number> = {
  press: 0.96,
  card: 0.98,
  none: 1,
};

/**
 * Pressable with the design's press feedback and a `className` passthrough.
 *
 * The transform lives in a style callback rather than Tailwind because
 * NativeWind cannot express a pressed-state transform, and RN needs the
 * numeric scale anyway.
 */
export function Touchable({
  className,
  feedback = 'press',
  disabled,
  dimWhenDisabled = true,
  style,
  ...props
}: TouchableProps) {
  return (
    <Pressable
      className={cn(className, disabled && dimWhenDisabled && 'opacity-[0.45]')}
      disabled={disabled}
      style={({ pressed }) => [
        style,
        pressed && feedback !== 'none' && !disabled
          ? { transform: [{ scale: SCALE[feedback] }], opacity: 0.92 }
          : null,
      ]}
      {...props}
    />
  );
}
