/**
 * useAuthSession Hook
 * Reads the current authentication session through authService and exposes logout
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { authService, type AuthResponse } from '@/services/auth';

export type AuthSession =
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'signedIn'; user: AuthResponse['user'] | null };

interface UseAuthSessionResult {
  session: AuthSession;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * useAuthSession reports whether a session is stored (token in secure storage)
 * and who is signed in (profile in AsyncStorage). It reads on mount; call
 * `refresh` when the screen regains focus, e.g. after returning from login.
 * A storage failure is treated as signed out.
 *
 * @example
 * ```tsx
 * const { session, refresh, logout } = useAuthSession();
 * useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
 * ```
 */
export function useAuthSession(): UseAuthSessionResult {
  const [session, setSession] = useState<AuthSession>({
    status: 'loading',
    user: null,
  });
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    const next = await readSession();
    if (isMountedRef.current) {
      setSession(next);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    await refresh();
  }, [refresh]);

  useEffect(() => {
    isMountedRef.current = true;
    readSession().then(next => {
      if (isMountedRef.current) {
        setSession(next);
      }
    });
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { session, refresh, logout };
}

async function readSession(): Promise<AuthSession> {
  try {
    if (await authService.isAuthenticated()) {
      return { status: 'signedIn', user: await authService.getCurrentUser() };
    }
    return { status: 'signedOut', user: null };
  } catch {
    return { status: 'signedOut', user: null };
  }
}
