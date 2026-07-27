import { useRouter, usePathname, type Href } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useCallback, useState } from 'react';

import {
  resolveActiveIndex,
  TabBar,
  TabBarButton,
  tabBarTriggerStyles,
  useTabBarHeight,
  TAB_BACK_BEHAVIOR,
  TAB_ITEMS,
} from '@/components/navigation';
import { ROUTES } from '@/constants/routes';
import { AssistantBubble, AssistantSheet, type AssistantResult } from '@/features/assistant';

/**
 * Bottom tab navigator.
 *
 * Uses Expo Router's headless tabs so the bar itself is fully custom: the
 * sliding notch and lifted icon in `TabBar` cannot be expressed through the
 * standard tab bar's options.
 */
export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const activeIndex = resolveActiveIndex(pathname);
  const tabBarHeight = useTabBarHeight();
  const [assistantOpen, setAssistantOpen] = useState(false);

  /**
   * The map already owns the bottom-right corner — a recenter button above a
   * full-width carousel. A second floating control would land on both, so the
   * assistant stands down there rather than fighting for the space.
   */
  const showAssistant = !pathname.startsWith('/map');

  const openResult = useCallback(
    (result: AssistantResult) => {
      setAssistantOpen(false);

      if (result.kind === 'event') {
        router.push(ROUTES.event(result.event.id));
        return;
      }

      // A product opens the venue selling it: there is no standalone product
      // route, and the item is only meaningful beside its bar's menu.
      router.push(ROUTES.bar(result.kind === 'bar' ? result.bar.id : result.venueId));
    },
    [router],
  );

  return (
    <Tabs options={{ backBehavior: TAB_BACK_BEHAVIOR }}>
      <TabSlot />

      <TabList asChild>
        <TabBar activeIndex={activeIndex}>
          {TAB_ITEMS.map((item, index) => (
            <TabTrigger
              accessibilityLabel={item.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeIndex === index }}
              href={item.href as Href}
              key={item.name}
              name={item.name}
              style={({ pressed }) => [
                tabBarTriggerStyles.button,
                pressed && tabBarTriggerStyles.pressed,
              ]}
              testID={`tab-${item.label}`}
            >
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

      {/* Siblings of the TabList on purpose: `parseTriggersFromChildren`
          ignores anything that is not a TabTrigger, so the assistant rides
          along without becoming a tab. */}
      {showAssistant ? (
        <AssistantBubble bottom={tabBarHeight + 16} onPress={() => setAssistantOpen(true)} />
      ) : null}

      <AssistantSheet
        onClose={() => setAssistantOpen(false)}
        onOpenResult={openResult}
        visible={assistantOpen}
      />
    </Tabs>
  );
}
