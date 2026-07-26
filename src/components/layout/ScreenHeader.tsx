import type { Href } from 'expo-router';
import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

import { BackButton } from '../navigation/BackButton';

export interface ScreenHeaderProps {
  title: string;
  /** Where the back button navigates. Defaults to `router.back()`. */
  onBack?: () => void;
  /**
   * Parent screen, used when the stack has no history — a deep link or a
   * notification opens this screen directly.
   */
  backFallbackHref?: Href;
  /** Hides the back control on root-level screens. */
  showBack?: boolean;
  /** Icon rendered before the title, inline with it. */
  icon?: React.ReactNode;
  /** Trailing control, e.g. an edit button. */
  action?: React.ReactNode;
  /** Centres the title between the back button and the action. */
  centered?: boolean;
  className?: string;
}

/**
 * Standard in-page header. Two layouts appear in the design: a left-aligned
 * title next to the back button, and a centred title flanked by two controls.
 */
export function ScreenHeader({
  title,
  onBack,
  backFallbackHref,
  showBack = true,
  icon,
  action,
  centered = false,
  className,
}: ScreenHeaderProps) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-3.5 px-[18px] pb-3 pt-2',
        centered && 'justify-between',
        className,
      )}
    >
      {showBack ? (
        <BackButton fallbackHref={backFallbackHref} onPress={onBack} />
      ) : (
        <View className="w-11" />
      )}

      <View
        className={cn(
          'min-w-0 flex-row items-center gap-2.5',
          centered ? 'flex-1 justify-center' : 'flex-1',
        )}
      >
        {icon}
        <Text
          accessibilityRole="header"
          className={cn('min-w-0 shrink text-5xl font-extrabold text-text', centered && 'text-center')}
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>

      {/* Keeps a centred title optically centred when there is no action. */}
      {centered ? (action ?? <View className="w-11" />) : action}
    </View>
  );
}
