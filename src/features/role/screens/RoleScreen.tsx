import { useState } from 'react';

import { Screen } from '@/components/layout';

import { BarsFeed } from '../components/BarsFeed';
import { EventsFeed } from '../components/EventsFeed';
import { RoleTabs, type RoleTab } from '../components/RoleTabs';

/**
 * The app's home surface, listing nearby venues and events.
 *
 * No screen-level loading gate. There used to be a fixed 1.1s dwell here, added
 * to give the brand flame animation time to play; the flame is gone, and what
 * remained was a timer that delayed the feeds — which then showed their own
 * skeletons anyway, from real request status. Waiting to show a placeholder is
 * strictly worse than showing it.
 *
 * The screen no longer wraps its content in a `ScrollView`: each feed is a
 * virtualised list that owns the vertical scroll, and the tab switcher travels
 * into the list header so it still scrolls away with the content (M-01). Keeping
 * the outer `ScrollView` would have disabled virtualisation entirely.
 */
export function RoleScreen() {
  const [tab, setTab] = useState<RoleTab>('eventos');

  const tabs = <RoleTabs active={tab} onChange={setTab} />;

  return (
    <Screen contentClassName="pt-1.5">
      {tab === 'bares' ? <BarsFeed header={tabs} /> : <EventsFeed header={tabs} />}
    </Screen>
  );
}
