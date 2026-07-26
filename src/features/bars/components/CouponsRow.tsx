import { ScrollView, Text, View } from 'react-native';

import { CouponIcon } from '@/components/ui/icons';
import type { Coupon } from '@/types/domain';

export interface CouponsRowProps {
  coupons: Coupon[];
}

/** Horizontally scrolling voucher cards. */
export function CouponsRow({ coupons }: CouponsRowProps) {
  return (
    <ScrollView
      contentContainerClassName="px-4 gap-2.5"
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {coupons.map((coupon) => (
        <View
          accessibilityLabel={`Cupom de ${coupon.value}, mínimo ${coupon.minimum}`}
          className="flex-row items-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-3"
          key={coupon.id}
        >
          <View className="h-[34px] w-[34px] items-center justify-center rounded-sm bg-primary-tint">
            <CouponIcon size={18} />
          </View>
          <View>
            <Text className="text-xs text-text-muted">Cupom de</Text>
            <Text className="text-lg font-extrabold text-primary">{coupon.value}</Text>
            <Text className="text-2xs text-text-dim">Mínimo {coupon.minimum}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
