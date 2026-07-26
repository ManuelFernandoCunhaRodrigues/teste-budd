import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

import { type IconProps } from './types';

/** Glyphs for the profile menu and settings screens. Green by default. */

const GREEN = colors.primary;

export function BagIcon({ size = 22, color = GREEN }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 8h12l-1 12H7L6 8z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M9 8V6a3 3 0 016 0v2" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function HeartMenuIcon({ size = 22, color = GREEN }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20S3 15 3 8.5A4 4 0 0112 6a4 4 0 019 2.5C21 15 12 20 12 20z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function StarMenuIcon({ size = 22, color = GREEN }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SlidersIcon({ size = 22, color = GREEN }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8h10M18 8h2M4 16h4M12 16h8"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Circle cx={15} cy={8} r={2.2} stroke={color} strokeWidth={1.6} />
      <Circle cx={9} cy={16} r={2.2} stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function GearIcon({ size = 22, color = GREEN }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.6} />
      <Path
        d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BellIcon({ size = 22, color = GREEN }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a5 5 0 015 5c0 5 2 6 2 6H5s2-1 2-6a5 5 0 015-5zM10 19a2 2 0 004 0"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShieldIcon({ size = 22, color = GREEN }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LogoutIcon({ size = 22, color = GREEN }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 3H5a2 2 0 00-2 2v14a2 2 0 002 2h8M16 8l4 4-4 4M9 12h11"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WhatsAppIcon({ size = 22, color = colors.whatsapp }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a9 9 0 00-7.7 13.6L3 21l4.5-1.2A9 9 0 1012 3z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 8.5c0 4 3 7 7 7 .6 0 1-.6.8-1.1l-.6-1.3-1.6.5c-1.2-.5-2.2-1.5-2.7-2.7l.5-1.6-1.3-.6c-.5-.2-1.1.2-1.1.8z"
        fill={color}
      />
    </Svg>
  );
}

export function PixIcon({ size = 26, color = GREEN }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.6} />
      <Rect x={14} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.6} />
      <Rect x={3} y={14} width={7} height={7} rx={1} stroke={color} strokeWidth={1.6} />
      <Rect x={15} y={15} width={4} height={4} fill={color} />
    </Svg>
  );
}

export function BellHeaderIcon({ size = 22, color = GREEN }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M11 3a5 5 0 015 5c0 5 2 6 2 6H4s2-1 2-6a5 5 0 015-5zM9 18a2 2 0 004 0"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CalendarHeaderIcon({ size = 18, color = GREEN }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Rect x={2} y={3} width={14} height={13} rx={2} stroke={color} strokeWidth={1.4} />
      <Path d="M2 7h14M6 1.5v3M12 1.5v3" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}
