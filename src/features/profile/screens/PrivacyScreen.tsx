import { Text, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/layout';
import { PRIVACY_BLOCKS, PRIVACY_UPDATED_AT } from '@/mocks/profile';

/** Privacy policy copy. */
export function PrivacyScreen() {
  return (
    <Screen contentClassName="pb-10" scroll>
      <ScreenHeader backFallbackHref="/settings" title="Política de Privacidade" />

      <View className="px-4.5">
        {PRIVACY_BLOCKS.map((block) => (
          <View className="mt-4" key={block.id}>
            <Text accessibilityRole="header" className="text-lg font-extrabold text-primary">
              {block.heading}
            </Text>
            <Text className="mt-2 text-base leading-6 text-text-soft">{block.body}</Text>
          </View>
        ))}

        <Text className="mt-6 text-sm text-text-dim">{PRIVACY_UPDATED_AT}</Text>
      </View>
    </Screen>
  );
}
