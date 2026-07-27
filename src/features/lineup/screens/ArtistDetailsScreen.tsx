import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { ErrorState } from '@/components/feedback';
import { Screen, ScreenHeader } from '@/components/layout';
import { Button, Card, GradientImage, Touchable } from '@/components/ui';
import { CalendarIcon, MapPinIcon } from '@/components/ui/icons';
import { colors } from '@/theme';
import { cn } from '@/utils/cn';
import { formatCents } from '@/utils/money';

import { useArtistDetails } from '../hooks/useArtistDetails';
import {
  canStartTicketFlow,
  formatShowDate,
  openDirections,
  ticketStatusLabel,
} from '../services/lineupService';
import type { LineUpShow } from '../types';

const BIOGRAPHY_PREVIEW = 180;

/**
 * An artist and their dates.
 *
 * The purchase CTA is driven by `canStartTicketFlow`, so a sold-out or
 * cancelled date cannot present a button that would fail — the state is the
 * reason the control is absent, not a check performed after the tap.
 */
export function ArtistDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { artist, shows } = useArtistDetails(id ?? '');
  const [expanded, setExpanded] = useState(false);

  if (!artist) {
    return (
      <Screen>
        <ScreenHeader backFallbackHref="/lineup" title="Artista" />
        <ErrorState className="py-20" description="Não encontramos esse artista." />
      </Screen>
    );
  }

  const isLong = artist.biography.length > BIOGRAPHY_PREVIEW;
  const biography =
    isLong && !expanded ? `${artist.biography.slice(0, BIOGRAPHY_PREVIEW).trimEnd()}…` : artist.biography;

  return (
    <Screen contentClassName="pb-10" scroll>
      <ScreenHeader backFallbackHref="/lineup" title={artist.name} />

      <GradientImage className="mx-4.5 h-[180px] rounded-xl" token={artist.image} />

      <View className="px-4.5 pt-4">
        <Text className="text-3xl font-black text-text">{artist.name}</Text>
        <Text className="mt-1 text-md text-text-muted">
          {artist.genre}
          {artist.origin ? ` · ${artist.origin}` : ''}
        </Text>

        <Text accessibilityRole="header" className="mt-6 text-lg font-extrabold text-text">
          Sobre o artista
        </Text>
        <Text className="mt-2 text-md leading-6 text-text-soft">{biography}</Text>
        {isLong ? (
          <Touchable
            accessibilityLabel={expanded ? 'Ver menos' : 'Ver mais'}
            accessibilityRole="button"
            className="mt-2 self-start py-1"
            onPress={() => setExpanded((current) => !current)}
          >
            <Text className="text-md font-bold text-primary">
              {expanded ? 'Ver menos' : 'Ver mais'}
            </Text>
          </Touchable>
        ) : null}

        <Text accessibilityRole="header" className="mt-7 text-lg font-extrabold text-text">
          Próximos shows
        </Text>

        {shows.length === 0 ? (
          <Text className="mt-2 text-md text-text-muted">
            Este artista ainda não possui novos shows cadastrados.
          </Text>
        ) : (
          <View className="mt-3 gap-3.5">
            {shows.map((show) => (
              <ShowBlock key={show.id} show={show} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function ShowBlock({ show }: { show: LineUpShow }) {
  const price = show.minimumPriceInCents;
  const sellable = canStartTicketFlow(show);

  return (
    <Card className="p-4">
      <Text className="text-lg font-extrabold leading-tight text-text">{show.title}</Text>

      <View className="mt-2 flex-row items-center gap-1.5">
        <CalendarIcon color={colors.textMuted} size={13} />
        <Text className="flex-1 text-sm text-text-soft">
          {formatShowDate(show.startsAt)}
          {show.doorsOpenAt ? ` · portões ${formatShowDate(show.doorsOpenAt)}` : ''}
        </Text>
      </View>

      <Text accessibilityRole="header" className="mt-4 text-base font-bold text-text">
        Local do show
      </Text>
      <View className="mt-1.5 flex-row items-start gap-1.5">
        <MapPinIcon color={colors.textMuted} size={13} />
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-text">{show.venue.name}</Text>
          <Text className="text-sm text-text-muted">{show.venue.address}</Text>
          <Text className="text-sm text-text-muted">
            {show.venue.neighborhood ? `${show.venue.neighborhood} — ` : ''}
            {show.venue.city}, {show.venue.state}
          </Text>
        </View>
      </View>

      {/* Hidden entirely when absent: §9 forbids rendering an empty field. */}
      {show.ageRating ? <InfoLine label="Classificação" value={show.ageRating} /> : null}
      {show.parkingInfo ? <InfoLine label="Estacionamento" value={show.parkingInfo} /> : null}
      {show.accessibilityInfo ? (
        <InfoLine label="Acessibilidade" value={show.accessibilityInfo} />
      ) : null}

      <View className="mt-4 flex-row flex-wrap items-center gap-2">
        <Text
          className={cn(
            'rounded-pill border px-2.5 py-0.5 text-xs font-bold',
            sellable ? 'border-primary-border text-primary' : 'border-border-muted text-text-dim',
          )}
        >
          {ticketStatusLabel(show.ticketStatus)}
        </Text>
        {price === undefined ? null : (
          <Text className="text-sm font-extrabold text-text">
            {price === 0 ? 'Entrada gratuita' : `A partir de ${formatCents(price)}`}
          </Text>
        )}
      </View>

      <View className="mt-3.5 flex-row flex-wrap gap-2">
        <Button
          label="Como chegar"
          onPress={() => {
            void openDirections(show);
          }}
          size="sm"
          variant="outline"
        />
        {/* No disabled buy button for a date that cannot be sold — the status
            pill above already says why, and a dead control invites the tap. */}
        {sellable ? <Button label="Comprar ingresso" onPress={() => {}} size="sm" /> : null}
      </View>
    </Card>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-2 flex-row gap-2">
      <Text className="text-sm font-semibold text-text-soft">{label}:</Text>
      <Text className="min-w-0 flex-1 text-sm text-text-muted">{value}</Text>
    </View>
  );
}
