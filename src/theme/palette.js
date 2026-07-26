/**
 * Single source of truth for the budd colour palette.
 *
 * Authored as CommonJS so `tailwind.config.js` can `require()` it while the
 * typed re-export in `./colors.ts` keeps application code type-safe. Changing a
 * value here updates both the Tailwind classes and the JS tokens at once.
 *
 * Values are taken verbatim from the "App com identidade dark verde neon"
 * design so the visual identity is preserved exactly.
 */
module.exports = {
  // Surfaces ---------------------------------------------------------------
  bg: '#000000',
  surface: '#0E0E0E',
  'surface-alt': '#161616',
  'surface-raised': '#1C1C1C',
  'surface-muted': '#2A2A2A',
  'surface-nav': '#121216',
  'surface-sheet': '#0D0D0D',

  // Brand green ------------------------------------------------------------
  primary: '#33D13A',
  'primary-tint': '#12240F',
  'primary-border': '#2A4A22',
  'primary-surface': '#0C1A08',

  // Flame accents (loading animation) --------------------------------------
  flame: '#76EB3C',
  'flame-light': '#8FF75A',
  'flame-dark': '#5FD62E',

  // Borders ----------------------------------------------------------------
  border: '#262626',
  'border-subtle': '#1A1A1A',
  'border-muted': '#1E1E1E',
  'border-green': '#1F3319',

  // Text -------------------------------------------------------------------
  text: '#FFFFFF',
  'text-softer': '#E5E5E5',
  'text-soft': '#CFCFCF',
  'text-muted': '#9A9A9A',
  'text-dim': '#7A7A7A',
  'text-faint': '#5A5A5A',
  'text-ghost': '#4A4A4A',

  // Status -----------------------------------------------------------------
  danger: '#FF5A5A',
  'danger-alt': '#FF6B6B',
  'danger-solid': '#C02626',
  'danger-border': '#5A2020',

  // Misc identity ----------------------------------------------------------
  'badge-bar': '#F26A3A',
  location: '#2F8FFF',
  whatsapp: '#25D366',
  'map-backdrop': '#E9EAEC',
};
