import { memo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

export interface MockMapSurfaceProps {
  /** Fills its parent; the caller decides the box. */
  children?: React.ReactNode;
}

/**
 * A drawn stand-in for the map, for demonstrations.
 *
 * Google Maps renders an empty grey surface on Android without an API key, and
 * getting one is a Google Cloud task rather than a code change. This keeps the
 * screen presentable meanwhile: streets, water and blocks in the app's own
 * palette, so a demo reads as a map instead of as a bug.
 *
 * It is **not** geography. Nothing here corresponds to a real place, and the
 * venue pins the screen draws on top are positioned by the carousel, not by
 * these coordinates. It must never stand in for the real map in a build that
 * ships — which is why it is reached only through an explicit flag.
 *
 * Every coordinate is fixed in a 100×140 viewBox: a generated layout would land
 * differently on each launch and read as noise rather than as a city.
 */
export const MockMapSurface = memo(function MockMapSurface({ children }: MockMapSurfaceProps) {
  return (
    <View className="flex-1 bg-map-backdrop">
      <Svg
        // Decorative: the screen's own controls and cards carry every label a
        // screen reader needs.
        accessibilityElementsHidden
        height="100%"
        importantForAccessibility="no-hide-descendants"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 100 140"
        width="100%"
      >
        <Rect fill={colors.mapBackdrop} height={140} width={100} x={0} y={0} />

        {/* Parks — laid down first so roads cross over them. */}
        <Path d="M4,18 h26 v22 h-26 Z" fill={colors.primarySurface} opacity={0.9} />
        <Path d="M70,96 h30 v26 h-30 Z" fill={colors.primarySurface} opacity={0.7} />

        {/* The river, the one feature that gives the picture a sense of place. */}
        <Path
          d="M-4,64 C18,58 26,74 44,72 C62,70 70,52 100,56 L100,68 C72,64 64,82 46,84 C28,86 18,70 -4,76 Z"
          fill={colors.surfaceAlt}
        />

        {/* Blocks. Two densities, so the grid does not read as wallpaper. */}
        {BLOCKS.map((block) => (
          <Rect
            fill={colors.surface}
            height={block.h}
            key={`${block.x}-${block.y}`}
            opacity={0.65}
            rx={1.2}
            width={block.w}
            x={block.x}
            y={block.y}
          />
        ))}

        {/* Avenues over the blocks, thicker than the side streets. */}
        {AVENUES.map((d) => (
          <Path
            d={d}
            fill="none"
            key={d}
            stroke={colors.surfaceRaised}
            strokeLinecap="round"
            strokeWidth={2.6}
          />
        ))}

        {STREETS.map((d) => (
          <Path
            d={d}
            fill="none"
            key={d}
            stroke={colors.surfaceMuted}
            strokeLinecap="round"
            strokeWidth={1.1}
          />
        ))}

        {/* Two roundabouts, purely so the eye finds something to land on. */}
        <Circle cx={38} cy={44} fill="none" r={3.4} stroke={colors.surfaceRaised} strokeWidth={1.6} />
        <Circle cx={74} cy={104} fill="none" r={2.6} stroke={colors.surfaceRaised} strokeWidth={1.4} />
      </Svg>

      {children}
    </View>
  );
});

const BLOCKS = [
  { x: 6, y: 46, w: 14, h: 10 },
  { x: 24, y: 48, w: 10, h: 8 },
  { x: 52, y: 22, w: 16, h: 12 },
  { x: 72, y: 20, w: 12, h: 9 },
  { x: 8, y: 92, w: 18, h: 13 },
  { x: 30, y: 96, w: 12, h: 10 },
  { x: 48, y: 108, w: 14, h: 11 },
  { x: 14, y: 116, w: 11, h: 9 },
  { x: 60, y: 8, w: 10, h: 7 },
] as const;

const AVENUES = [
  'M0,44 H100',
  'M38,0 V140',
  'M0,104 C24,100 40,110 100,104',
] as const;

const STREETS = [
  'M0,28 H100',
  'M0,88 H100',
  'M0,124 H100',
  'M16,0 V140',
  'M60,0 V140',
  'M84,0 V140',
  'M0,12 H100',
] as const;
