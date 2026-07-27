import { Text, View } from 'react-native';

import { Card, GradientImage } from '@/components/ui';
import { CalendarIcon, MapPinIcon } from '@/components/ui/icons';
import { colors } from '@/theme';
import { cn } from '@/utils/cn';
import { formatCents } from '@/utils/money';

import { artistForShow, formatShowDate, ticketStatusLabel } from '../services/lineupService';
import type { ShowWithDistance } from '../types';

export interface ShowCardProps {
  entry: ShowWithDistance;
  onPress: () => void;
}

/** Tone per sale status. Cancelled and sold out must not read as invitations. */
const STATUS_CLASS: Record<string, string> = {
  available: 'border-primary-border text-primary',
  last_tickets: 'border-primary-border text-primary',
  sold_out: 'border-border-muted text-text-dim',
  cancelled: 'border-danger-border text-danger-alt',
};

/**
 * One show in the LineUp results.
 *
 * Distance is rendered only when it was actually computed: a venue without
 * coordinates shows no distance rather than a plausible-looking guess.
 */
export function ShowCard({ entry, onPress }: ShowCardProps) {
  const { show, distanceLabel } = entry;
  const artist = artistForShow(show);
  const price = show.minimumPriceInCents;

  const accessibilityLabel = [
    artist?.name ?? show.title,
    `show em ${formatShowDate(show.startsAt)}`,
    show.venue.name,
    distanceLabel,
    price === undefined ? null : `ingressos a partir de ${formatCents(price)}`,
    ticketStatusLabel(show.ticketStatus),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card accessibilityLabel={accessibilityLabel} className="flex-row" onPress={onPress}>
      <GradientImage className="w-[32%]" token={artist?.image ?? 'neutral'} />

      <View className="min-w-0 flex-1 px-3.5 py-3">
        <Text className="text-base font-extrabold leading-tight text-text" numberOfLines={2}>
          {artist?.name ?? show.title}
        </Text>
        <Text className="mt-0.5 text-sm text-text-muted" numberOfLines={1}>
          {artist?.genre ?? show.title}
        </Text>

        <View className="mt-2 flex-row items-center gap-1.5">
          <CalendarIcon color={colors.textMuted} size={13} />
          <Text className="flex-1 text-sm text-text-soft" numberOfLines={1}>
            {formatShowDate(show.startsAt)}
          </Text>
        </View>

        <View className="mt-1 flex-row items-center gap-1.5">
          <MapPinIcon color={colors.textMuted} size={12} />
          <Text className="flex-1 text-sm text-text-muted" numberOfLines={1}>
            {show.venue.name} — {show.venue.city}, {show.venue.state}
          </Text>
        </View>

        {distanceLabel ? (
          <Text className="mt-1 text-sm font-semibold text-primary">{distanceLabel}</Text>
        ) : null}

        <View className="mt-2.5 flex-row flex-wrap items-center gap-2">
          {price === undefined ? null : (
            <Text className="text-sm font-extrabold text-text">
              {price === 0 ? 'Entrada gratuita' : `A partir de ${formatCents(price)}`}
            </Text>
          )}
          <Text
            className={cn(
              'rounded-pill border px-2.5 py-0.5 text-xs font-bold',
              STATUS_CLASS[show.ticketStatus],
            )}
          >
            {ticketStatusLabel(show.ticketStatus)}
          </Text>
        </View>
      </View>
    </Card>
  );
}
