import Svg, { G, Mask, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

import type { IconProps } from './types';

/**
 * The budd "b" brand mark: a vertical stem beside a ring, with two horizontal
 * stripes knocked out.
 *
 * Reconstructed from the vector the design already ships for the Buddcoin /
 * wallet icon, so it is the authentic mark rather than an approximation. It
 * doubles as the map pin glyph — the design used a raster `b-marker.png` there,
 * which this replaces with a resolution-independent vector.
 */
export function BuddLogo({ size = 24, color = colors.primary }: IconProps) {
  // Mask ids must be unique per size so multiple instances don't collide.
  const maskId = `budd-stripes-${size}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Mask id={maskId}>
        <Rect x={0} y={0} width={24} height={24} fill="#fff" />
        <Rect x={0} y={9.4} width={24} height={1.7} fill="#000" />
        <Rect x={0} y={13.4} width={24} height={1.7} fill="#000" />
      </Mask>
      <G mask={`url(#${maskId})`}>
        <Rect x={3} y={1.5} width={3.4} height={21} rx={1} fill={color} />
        <Path
          d="M12 8a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 3.4a3.1 3.1 0 110 6.2 3.1 3.1 0 010-6.2z"
          fill={color}
        />
      </G>
    </Svg>
  );
}
