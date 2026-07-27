import { usePathname, type Href } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';

import {
  resolveActiveIndex,
  TabBar,
  TabBarButton,
  TAB_BACK_BEHAVIOR,
  TAB_ITEMS,
} from '@/components/navigation';

/**
 * Bottom tab navigator.
 *
 * Uses Expo Router's headless tabs so the bar itself is fully custom: the
 * sliding notch and lifted icon in `TabBar` cannot be expressed through the
 * standard tab bar's options.
 */
export default function TabsLayout() {
  const pathname = usePathname();
  const activeIndex = resolveActiveIndex(pathname);

  return (
    <Tabs options={{ backBehavior: TAB_BACK_BEHAVIOR }}>
      <TabSlot />

      <TabList asChild>
        <TabBar activeIndex={activeIndex}>
          {TAB_ITEMS.map((item, index) => (
            <TabTrigger asChild href={item.href as Href} key={item.name} name={item.name}>
              <TabBarButton
                Icon={item.Icon}
                iconSize={item.iconSize}
                isActive={activeIndex === index}
                label={item.label}
              />
            </TabTrigger>
          ))}
        </TabBar>
      </TabList>
    </Tabs>
  );
}
