// features/auth/hooks/useAnalyticsIdentity.ts
import { useEffect } from 'react';
import { getAnalytics } from '@/shared/integrations/analytics';
import { useSession } from '@/shared/session/SessionProvider';

/** Identifies the signed-in user to analytics; clears it on sign-out. */
export function useAnalyticsIdentity(): void {
  const { session } = useSession();
  const userId = session.user ? String(session.user.id) : null;
  useEffect(() => {
    if (session.status === 'loading') return;
    getAnalytics().identify(userId);
  }, [session.status, userId]);
}
