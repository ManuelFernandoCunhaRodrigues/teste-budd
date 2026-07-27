import { Text, View } from 'react-native';

import { Button } from '@/components/ui';

import type { LineUpLocationState } from '../hooks/useLocationPermission';

export interface LocationPermissionStateProps {
  location: LineUpLocationState;
  onChooseCity: () => void;
}

/**
 * The location banner above the nearby results.
 *
 * Every state offers a way forward — asking again, opening settings, or picking
 * a city by hand. None of them is a dead end, because a user who cannot share
 * their position must still be able to find a show.
 *
 * Renders nothing once a fix is in: at that point the results themselves are
 * the feedback.
 */
export function LocationPermissionState({ location, onChooseCity }: LocationPermissionStateProps) {
  if (location.status === 'available') return null;

  if (location.status === 'loading') {
    return (
      <View
        accessibilityLiveRegion="polite"
        className="mx-4.5 mt-3 rounded-xl border border-border bg-surface p-3.5"
      >
        <Text className="text-sm text-text-soft">Buscando eventos perto de você…</Text>
      </View>
    );
  }

  if (location.status === 'idle') {
    return (
      <View className="mx-4.5 mt-3 rounded-xl border border-border bg-surface p-3.5">
        <Text className="text-sm leading-5 text-text-soft">
          Use sua localização para encontrar shows perto de você.
        </Text>
        <View className="mt-2.5 flex-row flex-wrap gap-2">
          <Button label="Usar minha localização" onPress={location.request} size="sm" />
          <Button label="Escolher cidade" onPress={onChooseCity} size="sm" variant="ghost" />
        </View>
      </View>
    );
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      className="mx-4.5 mt-3 rounded-xl border border-border bg-surface p-3.5"
    >
      <Text className="text-sm leading-5 text-text-soft">{location.message}</Text>

      <View className="mt-2.5 flex-row flex-wrap gap-2">
        <Button label="Tentar novamente" onPress={location.retry} size="sm" variant="outline" />
        {/* Only a blocked permission needs Settings; the others can be retried
            in place, and offering it everywhere would send people out of the
            app for nothing. */}
        {location.status === 'blocked' ? (
          <Button
            label="Abrir configurações"
            onPress={location.openSettings}
            size="sm"
            variant="ghost"
          />
        ) : null}
        <Button label="Escolher cidade" onPress={onChooseCity} size="sm" variant="ghost" />
      </View>
    </View>
  );
}
