import { Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shadows, zIndex } from '@/theme';
import { useToastStore } from '@/store/toastStore';

/**
 * Global confirmation toast, mounted once in the root layout.
 *
 * Reads directly from the toast store so any screen or service can raise a
 * message without threading callbacks through the tree.
 */
export function Toast() {
  const message = useToastStore((state) => state.message);
  const insets = useSafeAreaInsets();

  if (!message) return null;

  return (
    <Animated.View
      accessible
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      entering={FadeInDown.duration(250)}
      exiting={FadeOutDown.duration(200)}
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          bottom: insets.bottom + 110,
          alignSelf: 'center',
          zIndex: zIndex.toast,
        },
        shadows.toast,
      ]}
    >
      <Text className="rounded-pill bg-primary px-5 py-3 text-base font-extrabold text-bg">
        {message}
      </Text>
    </Animated.View>
  );
}
