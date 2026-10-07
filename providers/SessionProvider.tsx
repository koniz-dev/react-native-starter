/**
 * The app's single source of truth for the authentication session.
 *
 * SessionProvider (mounted once in app/_layout.tsx) restores the stored
 * session on cold start, signs in and out through authService, and follows
 * session-expired events from the HTTP client (services/session.ts). Screens
 * read it with useSession(); route groups use `session.status` as the guard
 * for Stack.Protected.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  authService,
  type AuthResponse,
  type LoginCredentials,
} from '@/services/auth';
import { onSessionExpired } from '@/services/session';
import { getErrorReporter } from '@/integrations/errorReporter';

export type SessionUser = AuthResponse['user'];

export type Session =
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'signedIn'; user: SessionUser | null };

export interface SessionContextValue {
  session: Session;
  /** Signs in; rejects with the API error (e.g. wrong credentials). */
  signIn(credentials: LoginCredentials): Promise<void>;
  /** Clears the stored session. */
  signOut(): Promise<void>;
  /**
   * Reloads the user from the auth backend. Rejects with the API error; a 401
   * also signs out (the HTTP client emits session-expired).
   */
  refreshUser(): Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const SIGNED_OUT: Session = { status: 'signedOut', user: null };

/** Reads the stored session; a storage failure counts as signed out. */
async function readStoredSession(): Promise<Session> {
  try {
    if (await authService.isAuthenticated()) {
      return { status: 'signedIn', user: await authService.getCurrentUser() };
    }
  } catch {
    // Fall through to signed out.
  }
  return SIGNED_OUT;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({
    status: 'loading',
    user: null,
  });
  const isMountedRef = useRef(true);
  // Set once sign-in, sign-out, or expiry changes the session, so the
  // cold-start restore (which may resolve later) can't overwrite it.
  const changedRef = useRef(false);

  const update = useCallback((next: Session) => {
    changedRef.current = true;
    if (isMountedRef.current) {
      setSession(next);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    readStoredSession().then(restored => {
      if (!changedRef.current && isMountedRef.current) {
        setSession(restored);
      }
    });
    // The HTTP client has already cleared the stored session.
    const unsubscribe = onSessionExpired(() => update(SIGNED_OUT));
    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [update]);

  // Attach error reports to the signed-in user (by id only).
  const userId = session.user ? String(session.user.id) : null;
  useEffect(() => {
    if (session.status === 'loading') return;
    try {
      getErrorReporter().setUser(userId ? { id: userId } : null);
    } catch {
      // Reporting must never break the session.
    }
  }, [session.status, userId]);

  const signIn = useCallback(
    async (credentials: LoginCredentials) => {
      const { user } = await authService.login(credentials);
      update({ status: 'signedIn', user });
    },
    [update]
  );

  const signOut = useCallback(async () => {
    await authService.logout();
    update(SIGNED_OUT);
  }, [update]);

  const refreshUser = useCallback(async () => {
    const user = await authService.fetchProfile();
    if (isMountedRef.current) {
      setSession(current =>
        current.status === 'signedIn' ? { status: 'signedIn', user } : current
      );
    }
  }, []);

  const value = useMemo(
    () => ({ session, signIn, signOut, refreshUser }),
    [session, signIn, signOut, refreshUser]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

/** The current session and the sign-in/sign-out actions. */
export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used inside <SessionProvider>');
  }
  return value;
}
