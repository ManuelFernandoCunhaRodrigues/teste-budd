import { useState } from 'react';

import { LoadingState } from '@/components/feedback';
import { Screen } from '@/components/layout';
import { useDelayedFlag } from '@/hooks/useDelayedFlag';
import { loadingDelay } from '@/theme';

import { BarsFeed } from '../components/BarsFeed';
import { EventsFeed } from '../components/EventsFeed';
import { RoleTabs, type RoleTab } from '../components/RoleTabs';

/**
 * The app's home surface, listing nearby venues and events.
 *
 * The brand loading animation runs for a fixed beat on entry — it is a
 * deliberate part of the experience in the design, not a data dependency.
 *
 * The screen no longer wraps its content in a `ScrollView`: each feed is a
 * virtualised list that owns the vertical scroll, and the tab switcher travels
 * into the list header so it still scrolls away with the content (M-01). Keeping
 * the outer `ScrollView` would have disabled virtualisation entirely.
 */
export function RoleScreen() {
  const [tab, setTab] = useState<RoleTab>('eventos');
  const ready = useDelayedFlag(loadingDelay.role);

  if (!ready) {
    return (
      <Screen>
        <LoadingState description="Buscando os melhores lugares…" title="Carregando rolês" />
      </Screen>
    );
  }

  const tabs = <RoleTabs active={tab} onChange={setTab} />;

  return (
    <Screen contentClassName="pt-1.5">
      {tab === 'bares' ? <BarsFeed header={tabs} /> : <EventsFeed header={tabs} />}
    </Screen>
  );
}
