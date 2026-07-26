import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

export interface PromoTagProps {
  label: string;
  /** Shows the small filled heart used in the highlights grid. */
  withIcon?: boolean;
}

/** Green promotional line under a product's price. */
export function PromoTag({ label, withIcon = false }: PromoTagProps) {
  return (
    <View className="mt-1 flex-row items-center gap-1.5">
      {withIcon ? (
        <Svg fill="none" height={12} viewBox="0 0 14 14" width={12}>
          <Path
            d="M7 12S1.5 8 1.5 4.6A2.6 2.6 0 017 3a2.6 2.6 0 015.5 1.6C12.5 8 7 12 7 12z"
            fill={colors.primary}
          />
        </Svg>
      ) : null}
      <Text className="text-sm font-bold text-primary">{label}</Text>
    </View>
  );
}
