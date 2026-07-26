import { useState } from 'react';

import { LoadingState } from '@/components/feedback';
import { Screen } from '@/components/layout';
import { TAB_BAR_CONTENT_INSET } from '@/components/navigation';
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

  return (
    <Screen
      contentContainerStyle={{ paddingBottom: TAB_BAR_CONTENT_INSET }}
      contentClassName="pt-1.5"
      scroll
    >
      <RoleTabs active={tab} onChange={setTab} />
      {tab === 'bares' ? <BarsFeed /> : <EventsFeed />}
    </Screen>
  );
}
