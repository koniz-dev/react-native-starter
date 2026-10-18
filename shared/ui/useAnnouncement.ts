import { useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Reads `message` out to the screen reader when it appears or changes, for
 * an error or status that shows up without moving focus. Pair it with
 * `accessibilityLiveRegion="polite"` on the text that shows it: Android and
 * the web announce a live region themselves, so this speaks only on iOS,
 * which has no live regions.
 */
export function useAnnouncement(
  message: string | null | undefined,
  /** Change it to read the same message out again. */
  repeatKey?: unknown
): void {
  useEffect(() => {
    if (message && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [message, repeatKey]);
}
