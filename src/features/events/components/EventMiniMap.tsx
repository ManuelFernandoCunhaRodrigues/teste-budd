import { View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

import { MINI_MAP_DELTA } from '@/constants/app';
import { VenueMarker } from '@/features/map/components/VenueMarker';
import type { Coordinate } from '@/types/domain';

export interface EventMiniMapProps {
  coordinate: Coordinate;
  /** Announced to screen readers in place of the map itself. */
  locationLabel: string;
}

/**
 * Non-interactive map preview of the event's venue.
 *
 * Gestures are disabled so the surrounding page keeps scrolling smoothly; the
 * full map lives on its own tab.
 */
export function EventMiniMap({ coordinate, locationLabel }: EventMiniMapProps) {
  return (
    <View
      accessibilityLabel={`Mapa mostrando ${locationLabel}`}
      accessibilityRole="image"
      className="mt-2.5 h-[150px] overflow-hidden rounded-lg bg-map-backdrop"
    >
      <MapView
        initialRegion={{ ...coordinate, ...MINI_MAP_DELTA }}
        pitchEnabled={false}
        provider={PROVIDER_DEFAULT}
        rotateEnabled={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
        zoomEnabled={false}
      >
        <Marker anchor={{ x: 0.5, y: 1 }} coordinate={coordinate} tracksViewChanges={false}>
          <VenueMarker size={36} />
        </Marker>
      </MapView>
    </View>
  );
}
