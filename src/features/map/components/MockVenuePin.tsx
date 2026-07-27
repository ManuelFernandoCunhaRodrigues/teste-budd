import { memo } from 'react';
import { View } from 'react-native';

import { Touchable } from '@/components/ui';
import { PLACES } from '@/mocks/places';
import type { Place } from '@/types/domain';

import { VenueMarker } from './VenueMarker';

export interface MockVenuePinProps {
  place: Place;
  selected: boolean;
  onPress: () => void;
}

/** Share of the surface left clear at the edges, so no pin sits on a border. */
const PADDING = 0.12;

/**
 * The bounding box of every mocked venue, computed once at module load.
 *
 * Projecting through the real extent keeps the pins in their true relative
 * arrangement — the venue that is north-east of the others still is — without
 * claiming the drawing underneath is a map of anywhere.
 */
const BOUNDS = PLACES.reduce(
  (box, place) => ({
    minLat: Math.min(box.minLat, place.coordinate.latitude),
    maxLat: Math.max(box.maxLat, place.coordinate.latitude),
    minLon: Math.min(box.minLon, place.coordinate.longitude),
    maxLon: Math.max(box.maxLon, place.coordinate.longitude),
  }),
  {
    minLat: Number.POSITIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY,
    minLon: Number.POSITIVE_INFINITY,
    maxLon: Number.NEGATIVE_INFINITY,
  },
);

/**
 * Where a venue sits on the stand-in surface, as percentages.
 *
 * A degenerate extent — one venue, or several at the same point — would divide
 * by zero, so it falls back to the centre rather than producing `NaN` offsets
 * that silently drop the pin out of view.
 */
export function mockPinPosition(place: Place): { left: `${number}%`; top: `${number}%` } {
  const latSpan = BOUNDS.maxLat - BOUNDS.minLat;
  const lonSpan = BOUNDS.maxLon - BOUNDS.minLon;

  const x = lonSpan > 0 ? (place.coordinate.longitude - BOUNDS.minLon) / lonSpan : 0.5;
  // Latitude grows northwards and screen y grows downwards, so this one inverts.
  const y = latSpan > 0 ? 1 - (place.coordinate.latitude - BOUNDS.minLat) / latSpan : 0.5;

  const scale = 1 - PADDING * 2;

  // Rounded through `Number` rather than left as a `toFixed` string: React
  // Native types a percentage as the literal `${number}%`, which a plain string
  // does not satisfy.
  return {
    left: `${Number(((PADDING + x * scale) * 100).toFixed(2))}%`,
    top: `${Number(((PADDING + y * scale) * 100).toFixed(2))}%`,
  };
}

/**
 * A tappable venue pin on the simulated surface.
 *
 * Mirrors what the real `Marker` does — tapping selects the place rather than
 * opening it — so the demo exercises the same flow the shipped map will.
 */
export const MockVenuePin = memo(function MockVenuePin({
  place,
  selected,
  onPress,
}: MockVenuePinProps) {
  const position = mockPinPosition(place);

  return (
    <View
      className="absolute"
      pointerEvents="box-none"
      style={{ left: position.left, top: position.top, zIndex: selected ? 5 : 1 }}
    >
      {/* Offset by half its own width and its full height, so the pin's tip
          lands on the coordinate instead of its top-left corner. */}
      <Touchable
        accessibilityLabel={`${place.name}. Mostrar no carrossel`}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        hitSlop={8}
        onPress={onPress}
        style={{ marginLeft: -20, marginTop: -49 }}
      >
        <VenueMarker />
      </Touchable>
    </View>
  );
});
