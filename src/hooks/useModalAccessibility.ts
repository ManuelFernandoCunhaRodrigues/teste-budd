import { useEffect, useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Text } from 'react-native';

/**
 * Announces a modal and moves accessibility focus to its heading after mount.
 *
 * Native modals render asynchronously; a short defer avoids trying to focus a
 * node before the host view exists.
 */
export function useModalAccessibility(visible: boolean, announcement: string) {
  const titleRef = useRef<ComponentRef<typeof Text>>(null);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(announcement);

      const node = findNodeHandle(titleRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 80);

    return () => clearTimeout(timer);
  }, [announcement, visible]);

  return titleRef;
}
