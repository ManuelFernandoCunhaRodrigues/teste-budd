import { ScreenSkeleton, type LoadingVariant } from './ScreenSkeleton';

export interface LoadingStateProps {
  /** Which screen's shape to stand in for. */
  variant?: LoadingVariant;
  /** Overrides the variant's default screen-reader announcement. */
  label?: string;
}

/**
 * The app's only loading treatment.
 *
 * Kept as the entry point every screen already imports, but it no longer draws
 * a flame, three pulsing dots or a title: those said that *something* was
 * happening while hiding *what*. It now renders a placeholder shaped like the
 * screen being loaded, so the layout is already in place when the data lands
 * instead of shoving itself in.
 */
export function LoadingState({ variant = 'role', label }: LoadingStateProps) {
  return <ScreenSkeleton label={label} variant={variant} />;
}
