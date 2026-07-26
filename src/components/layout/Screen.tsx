import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { cn } from '@/utils/cn';

export interface ScreenProps {
  children: React.ReactNode;
  /** Wraps content in a vertical `ScrollView`. */
  scroll?: boolean;
  /** Which safe-area edges to inset. Bottom is off by default because the
   *  custom tab bar already reserves that space. */
  edges?: readonly Edge[];
  className?: string;
  /** Applied to the scroll content container, or the inner view when static. */
  contentClassName?: string;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

/**
 * Root container for every screen: black background, safe-area insets and an
 * optional scroll view. Keeps insets and background handling out of features.
 */
export function Screen({
  children,
  scroll = false,
  edges = ['top'],
  className,
  contentClassName,
  contentContainerStyle,
}: ScreenProps) {
  return (
    <SafeAreaView className={cn('flex-1 bg-bg', className)} edges={edges}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={contentClassName}
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={cn('flex-1', contentClassName)}>{children}</View>
      )}
    </SafeAreaView>
  );
}
