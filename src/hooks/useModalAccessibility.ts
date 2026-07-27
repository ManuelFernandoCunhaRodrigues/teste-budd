import { useEffect, useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Text } from 'react-native';

/**
 * Announces a modal and moves accessibility focus to its heading after mount.
 *
 * Native modals render asynchronously; a short defer avoids trying to focus a
 * node before the host view exists.
 */
export function useModalAccessibility(
  visible: boolean,
  announcement: string,
  restoreFocusTarget?: number | null,
) {
  const titleRef = useRef<ComponentRef<typeof Text>>(null);
  const wasVisible = useRef(false);
  const lastRestoreTarget = useRef<number | null>(restoreFocusTarget ?? null);

  useEffect(() => {
    if (!visible) return;

    if (restoreFocusTarget) {
      lastRestoreTarget.current = restoreFocusTarget;
    }

    const timer = setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(announcement);

      const node = findNodeHandle(titleRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 80);

    return () => clearTimeout(timer);
  }, [announcement, restoreFocusTarget, visible]);

  useEffect(() => {
    const shouldRestore = wasVisible.current && !visible && lastRestoreTarget.current;
    wasVisible.current = visible;

    if (!shouldRestore) return;

    // Wait for the native Modal host to be dismissed before moving focus back
    // to the control on the underlying screen.
    const timer = setTimeout(() => {
      if (lastRestoreTarget.current) {
        AccessibilityInfo.setAccessibilityFocus(lastRestoreTarget.current);
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [visible]);

  return titleRef;
}
