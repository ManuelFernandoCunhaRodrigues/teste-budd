import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import type { Href } from 'expo-router';

import { TabBar, TabBarButton, TAB_ITEMS } from '@/components/navigation';

/**
 * Bottom tab navigator.
 *
 * Uses Expo Router's headless tabs so the bar itself is fully custom: the
 * sliding notch and lifted icon in `TabBar` cannot be expressed through the
 * standard tab bar's options.
 */
export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot />

      <TabList asChild>
        <TabBar>
          {TAB_ITEMS.map((item) => (
            <TabTrigger asChild href={item.href as Href} key={item.name} name={item.name}>
              <TabBarButton Icon={item.Icon} iconSize={item.iconSize} label={item.label} />
            </TabTrigger>
          ))}
        </TabBar>
      </TabList>
    </Tabs>
  );
}
