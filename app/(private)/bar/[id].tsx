import { useLocalSearchParams } from 'expo-router';

import { BarDetailScreen } from '@/features/bars';

export default function BarRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <BarDetailScreen barId={id} />;
}
