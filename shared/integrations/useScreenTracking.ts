import { useEffect } from 'react';
import { useSegments } from 'expo-router';
import { logger } from '@/shared/lib/logger';
import { getAnalytics } from './analytics';

/**
 * Reports a screen view to the analytics seam whenever the route changes.
 * Mounted once in app/_layout.tsx.
 *
 * The screen name is the route pattern without groups, such as
 * `/orders/[id]`, not the path: values in the URL (ids, reset tokens) never
 * reach the analytics provider. A provider that throws is logged and never
 * breaks navigation.
 */
export function useScreenTracking(): void {
  const segments = useSegments();
  const name = `/${segments
    .filter(segment => !/^\(.*\)$/.test(segment))
    .join('/')}`;

  useEffect(() => {
    try {
      getAnalytics().screen(name);
    } catch (error) {
      logger.error('Analytics failed to record a screen view', error);
    }
  }, [name]);
}
