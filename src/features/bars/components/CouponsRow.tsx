import { ScrollView, Text, View } from 'react-native';

import { CouponIcon } from '@/components/ui/icons';
import type { Coupon } from '@/types/domain';
import { formatCents } from '@/utils/money';

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
          accessibilityLabel={`Cupom de ${formatCents(coupon.valueInCents)}, mínimo ${formatCents(
            coupon.minimumInCents,
          )}`}
          className="flex-row items-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-3"
          key={coupon.id}
        >
          <View className="h-[34px] w-[34px] items-center justify-center rounded-sm bg-primary-tint">
            <CouponIcon size={18} />
          </View>
          <View>
            <Text className="text-xs text-text-muted">Cupom de</Text>
            <Text className="text-lg font-extrabold text-primary">
              {formatCents(coupon.valueInCents)}
            </Text>
            <Text className="text-2xs text-text-dim">
              Mínimo {formatCents(coupon.minimumInCents)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
