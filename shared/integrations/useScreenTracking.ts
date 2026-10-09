import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { getAnalytics } from './analytics';

/**
 * Reports a screen view to the analytics seam whenever the route changes.
 * Mounted once in app/_layout.tsx.
 */
export function useScreenTracking(): void {
  const pathname = usePathname();

  useEffect(() => {
    getAnalytics().screen(pathname);
  }, [pathname]);
}
