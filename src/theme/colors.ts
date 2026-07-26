import palette from './palette';

/**
 * Typed access to the palette for code that cannot use Tailwind classes:
 * SVG `fill`/`stroke` props, map marker styling, `StyleSheet` objects and
 * native navigation options.
 *
 * Prefer Tailwind classes (`className="bg-primary"`) in JSX — reach for these
 * tokens only where an API demands a raw colour string.
 */
export const colors = {
  background: palette.bg,
  surface: palette.surface,
  surfaceAlt: palette['surface-alt'],
  surfaceRaised: palette['surface-raised'],
  surfaceMuted: palette['surface-muted'],
  surfaceNav: palette['surface-nav'],
  surfaceSheet: palette['surface-sheet'],

  primary: palette.primary,
  primaryTint: palette['primary-tint'],
  primaryBorder: palette['primary-border'],
  primarySurface: palette['primary-surface'],

  flame: palette.flame,
  flameLight: palette['flame-light'],
  flameDark: palette['flame-dark'],

  border: palette.border,
  borderSubtle: palette['border-subtle'],
  borderMuted: palette['border-muted'],
  borderGreen: palette['border-green'],

  text: palette.text,
  textSofter: palette['text-softer'],
  textSoft: palette['text-soft'],
  textMuted: palette['text-muted'],
  textDim: palette['text-dim'],
  textFaint: palette['text-faint'],
  textGhost: palette['text-ghost'],

  danger: palette.danger,
  dangerAlt: palette['danger-alt'],
  dangerSolid: palette['danger-solid'],
  dangerBorder: palette['danger-border'],

  badgeBar: palette['badge-bar'],
  location: palette.location,
  whatsapp: palette.whatsapp,
  mapBackdrop: palette['map-backdrop'],
} as const;

export type ColorToken = keyof typeof colors;
