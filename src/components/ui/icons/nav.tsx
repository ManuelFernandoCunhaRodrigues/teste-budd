import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { DEFAULT_ICON_COLOR, type IconProps } from './types';

/** Bottom tab bar glyphs, in tab order. */

export function LineupIcon({ size = 24, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={18} height={18} rx={3} stroke={color} strokeWidth={1.6} />
      <Path d="M8 8l1.2 2.4L12 11l-2 1.8.5 2.7L8 14.2 5.5 15.5 6 12.8 4 11l2.8-.6L8 8z" fill={color} />
    </Svg>
  );
}

export function MapIcon({ size = 24, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M9 4v14M15 6v14" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

/** The flame that marks the central ROLÊ tab. */
export function RoleIcon({ size = 26, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-4-2.5-6 .25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16m0-1c-1.657 0-3-1-3-2.75 0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5-.179 1-.25 2 1 3 .625.5 1 1.364 1 2.25C11 14 9.657 15 8 15"
        fill={color}
      />
    </Svg>
  );
}

export function ProductsIcon({ size = 24, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={7} height={7} rx={1.2} stroke={color} strokeWidth={1.6} />
      <Rect x={14} y={3} width={7} height={7} rx={1.2} stroke={color} strokeWidth={1.6} />
      <Rect x={3} y={14} width={7} height={7} rx={1.2} stroke={color} strokeWidth={1.6} />
      <Path d="M14 14h3v3M21 14v7h-7v-3" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function ProfileIcon({ size = 24, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.6} />
      <Path d="M4 21c0-4 3.6-6.5 8-6.5S20 17 20 21" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

/** Solid avatar glyph used inside the profile header circle. */
export function ProfileSolidIcon({ size = 50, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} fill={color} />
      <Path d="M4 21c0-4 3.6-6.5 8-6.5S20 17 20 21" fill={color} />
    </Svg>
  );
}

/**
 * The brand flame, used by the loading screen and map cards.
 * Distinct from `RoleIcon`: this is the filled marketing mark.
 */
export function FlameIcon({ size = 24, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2c1 3-1 4-2.5 6C8 10 7.5 12 9 13.5 8 12 9.5 9 12 8c-1 3 4 3.5 4 7.5A5.5 5.5 0 015 15.5C5 11 9 9 9 6c1.5 1 2 3 3 4 1-2 1-5 0-8z"
        fill={color}
      />
    </Svg>
  );
}
