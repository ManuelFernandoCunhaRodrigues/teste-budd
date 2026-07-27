import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { DEFAULT_ICON_COLOR, DEFAULT_ICON_SIZE, type IconProps } from './types';

/** General-purpose icons used across screens. */

export function ChevronLeftIcon({ size = DEFAULT_ICON_SIZE, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M13 5l-6 6 6 6"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronRightIcon({
  size = 18,
  color = DEFAULT_ICON_COLOR,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M6 4l5 5-5 5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchIcon({ size = DEFAULT_ICON_SIZE, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx={9} cy={9} r={6} stroke={color} strokeWidth={1.6} />
      <Path d="M14 14l3.5 3.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function MapPinIcon({ size = 12, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M7 1C4.5 1 2.5 3 2.5 5.5 2.5 9 7 13 7 13s4.5-4 4.5-7.5C11.5 3 9.5 1 7 1z"
        stroke={color}
        strokeWidth={1.3}
      />
      <Circle cx={7} cy={5.4} r={1.5} stroke={color} strokeWidth={1.3} />
    </Svg>
  );
}

export function CalendarIcon({ size = 16, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Rect x={2} y={3} width={11} height={10} rx={1.5} stroke={color} strokeWidth={1.3} />
      <Path
        d="M2 6h11M5 1.5v2.5M10 1.5v2.5"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function HeartIcon({
  size = DEFAULT_ICON_SIZE,
  color = DEFAULT_ICON_COLOR,
  filled = false,
}: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M11 19S3 14 3 8.5A3.8 3.8 0 0111 6a3.8 3.8 0 018 2.5C19 14 11 19 11 19z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TrashIcon({ size = 15, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EditIcon({ size = 18, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function StarOutlineIcon({ size = 88, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3z"
        stroke={color}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Path shared by the filled and outlined star, so the two always align. */
const STAR_PATH = 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3z';

export interface StarIconProps extends IconProps {
  /** Solid when true, outlined when false. */
  filled?: boolean;
}

/**
 * The star used by every rating in the app.
 *
 * Vector, never a glyph. A star character in a string renders differently per
 * font and platform, and — as this project found the hard way — survives exactly
 * one mis-encoded file save before turning into three unrelated symbols on
 * screen. An SVG path has no such failure mode.
 */
export function StarIcon({ size = 20, color = DEFAULT_ICON_COLOR, filled = true }: StarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={STAR_PATH}
        fill={filled ? color : 'none'}
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={filled ? 0 : 1.5}
      />
    </Svg>
  );
}

export function CouponIcon({ size = 18, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M4 5h12v3a2 2 0 000 4v3H4v-3a2 2 0 000-4V5z"
        stroke={color}
        strokeWidth={1.5}
      />
    </Svg>
  );
}

export function TicketIcon({ size = DEFAULT_ICON_SIZE, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4V8z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path
        d="M15 6.5v11"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeDasharray="0.5 3"
      />
    </Svg>
  );
}

export function GlobeIcon({ size = 13, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Circle cx={7} cy={7} r={6} stroke={color} strokeWidth={1.2} />
      <Path
        d="M1 7h12M7 1c1.8 2 1.8 10 0 12M7 1c-1.8 2-1.8 10 0 12"
        stroke={color}
        strokeWidth={1.1}
      />
    </Svg>
  );
}

export function FollowersIcon({ size = 12, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Circle cx={5} cy={4} r={2} stroke={color} strokeWidth={1.2} />
      <Path d="M1.5 12c0-2 1.6-3.2 3.5-3.2S8.5 10 8.5 12" stroke={color} strokeWidth={1.2} />
    </Svg>
  );
}

/** Empty-state artwork: an unopened box. */
export function EmptyBoxIcon({ size = 120, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" stroke={color} strokeWidth={1.3} />
      <Path d="M3 7l9 5 9-5M12 12v10" stroke={color} strokeWidth={1.3} />
    </Svg>
  );
}

/** Empty-state artwork: a shopping bag. */
export function EmptyBagIcon({ size = 90, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 7h12l-1 13H7L6 7zM9 7V5a3 3 0 016 0v2"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Empty-state artwork: an outlined heart. */
export function EmptyHeartIcon({ size = 88, color = DEFAULT_ICON_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20S3 15 3 8.5A4 4 0 0112 6a4 4 0 019 2.5C21 15 12 20 12 20z"
        stroke={color}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
