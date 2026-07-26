import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyState, ErrorState } from '@/components/feedback';
import { Skeleton } from '@/components/ui';
import { EmptyHeartIcon } from '@/components/ui/icons';
import { ROUTES } from '@/constants/routes';
import { BarCard } from '@/features/bars';
import { useBars } from '@/features/bars/hooks/useBars';
import { colors } from '@/theme';

import { SearchField } from './SearchField';

/** Venue tab of the ROLÊ feed: search plus the matching venue list. */
export function BarsFeed() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data: bars, status, error, reload } = useBars(query);

  return (
    <View>
      <View className="px-4.5 pb-0.5 pt-2.5">
        <SearchField onChangeText={setQuery} value={query} />
      </View>

      <View className="gap-3.5 px-4 pb-2 pt-2">
        {status === 'loading' ? (
          <>
            <Skeleton className="h-[132px] rounded-xl" />
            <Skeleton className="h-[132px] rounded-xl" />
            <Skeleton className="h-[132px] rounded-xl" />
          </>
        ) : null}

        {status === 'error' ? (
          <ErrorState className="py-16" description={error?.message} onRetry={reload} />
        ) : null}

        {status === 'success' && bars?.length === 0 ? (
          <EmptyState
            className="py-16"
            description="Tente buscar por outro nome ou categoria."
            icon={<EmptyHeartIcon color={colors.surfaceMuted} size={72} />}
            title="Nenhum bar encontrado"
          />
        ) : null}

        {status === 'success'
          ? bars?.map((bar) => (
              <BarCard bar={bar} key={bar.id} onPress={() => router.push(ROUTES.bar(bar.id))} />
            ))
          : null}
      </View>
    </View>
  );
}
