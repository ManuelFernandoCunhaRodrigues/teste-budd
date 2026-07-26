import { usePathname, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { colors } from '@/theme';

import { IconButton, type IconButtonVariant } from '../ui/IconButton';
import { ChevronLeftIcon } from '../ui/icons';

export interface BackButtonProps {
  /** Overrides the default behaviour entirely. */
  onPress?: () => void;
  /**
   * Where to go when there is no history to pop.
   *
   * Screens reachable from outside the app — deep links, notifications — start a
   * fresh stack, so `router.back()` has nothing to return to. Pass the parent
   * screen; `DEFAULT_BACK_FALLBACK` is used when omitted.
   */
  fallbackHref?: Href;
  accessibilityLabel?: string;
  /** e.g. "Voltar para eventos", when the destination is not obvious. */
  accessibilityHint?: string;
  variant?: IconButtonVariant;
  className?: string;
}

/** The app's home surface — the only screen guaranteed to exist for a signed-in user. */
export const DEFAULT_BACK_FALLBACK: Href = '/role';

/**
 * Back control. Defaults to the green-tinted circle used by in-page headers;
 * pass `variant="overlay"` for the translucent version that sits on artwork.
 *
 * Always does something. The previous version called `router.back()` only when
 * `canGoBack()` was true and silently did nothing otherwise, so on a deep-linked
 * screen the button looked enabled and was inert (A-07).
 */
export function BackButton({
  onPress,
  fallbackHref = DEFAULT_BACK_FALLBACK,
  accessibilityLabel = 'Voltar',
  accessibilityHint,
  variant = 'tint',
  className,
}: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  // A second tap while the first navigation is in flight would navigate twice.
  const navigatingRef = useRef(false);
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The release timer must not outlive the component: a callback firing after
  // unmount is exactly the kind of stray work §4.6 asks to clean up.
  useEffect(
    () => () => {
      if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
    },
    [],
  );

  const handlePress = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;

    // Released on the next tick: by then the navigation has been dispatched, and
    // the screen is usually gone anyway.
    releaseTimerRef.current = setTimeout(() => {
      navigatingRef.current = false;
      releaseTimerRef.current = null;
    }, 0);

    if (onPress) {
      onPress();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    // Guard against a fallback that points at the screen we are already on,
    // which would look like a dead button and could loop.
    const target = typeof fallbackHref === 'string' ? fallbackHref : null;
    if (target && target === pathname) {
      router.replace(DEFAULT_BACK_FALLBACK);
      return;
    }

    // `replace`, not `push`: the fallback stands in for a parent that was never
    // on the stack, so it must not add another entry to go back through.
    router.replace(fallbackHref);
  }, [onPress, router, fallbackHref, pathname]);

  return (
    <IconButton
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      className={className}
      onPress={handlePress}
      variant={variant}
    >
      <ChevronLeftIcon color={variant === 'overlay' ? colors.text : colors.primary} size={20} />
    </IconButton>
  );
}
