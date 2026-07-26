import { useLocalSearchParams } from 'expo-router';

import { OrderStatusScreen } from '@/features/checkout';

export default function OrderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <OrderStatusScreen orderId={id} />;
}
