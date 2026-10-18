import { useEffect } from 'react';
import { useSegments } from 'expo-router';
import { logger } from '@/shared/lib/logger';
import { getAnalytics } from './analytics';

/**
 * Reports a screen view to the analytics seam whenever the route pattern
 * changes (not for a change of params only).
 * Mounted once in app/_layout.tsx, disabled until the stored session has been
 * read: until then the route is the launch URL, which the session guards may
 * still redirect (a signed-out cold start at /profile shows Home).
 *
 * The screen name is the route pattern without groups, such as
 * `/orders/[id]`, not the path: values in the URL (ids, reset tokens) never
 * reach the analytics provider. A provider that throws is logged and never
 * breaks navigation.
 */
export function useScreenTracking({ enabled = true } = {}): void {
  const segments = useSegments();
  const name = `/${segments
    .filter(segment => !/^\(.*\)$/.test(segment))
    .join('/')}`;

  useEffect(() => {
    if (!enabled) return;
    // After this render's navigation settles: a guard's redirect replaces
    // the route right after the first render, and only where it lands is seen.
    const timer = setTimeout(() => {
      try {
        getAnalytics().screen(name);
      } catch (error) {
        logger.error('Analytics failed to record a screen view', error);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [enabled, name]);
}
