import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { gradients, type GradientToken } from '@/theme/gradients';

export interface GradientImageProps extends ViewProps {
  token: GradientToken;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Stand-in artwork for venue, event and product imagery.
 *
 * The gradient is rendered behind an ordinary `View` rather than styling the
 * `LinearGradient` directly, so Tailwind classes (rounding, sizing, absolute
 * positioning) keep working on the wrapper.
 */
export function GradientImage({
  token,
  className,
  children,
  style,
  ...props
}: GradientImageProps) {
  return (
    <View className={className} style={style} {...props}>
      <LinearGradient
        // Approximates the design's 150deg CSS gradients.
        colors={[...gradients[token]]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}
