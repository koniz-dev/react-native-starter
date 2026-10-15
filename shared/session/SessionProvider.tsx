/**
 * The app's single source of truth for the authentication session.
 *
 * SessionProvider (mounted once in app/_layout.tsx) restores the stored
 * session on cold start, signs in and out through authService, and follows
 * session-expired events from the HTTP client (shared/session/session.ts). Screens
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
} from '@/shared/session/authService';
import {
  clearSessionFromPreviousInstall,
  clearStoredSession,
  onSessionExpired,
} from '@/shared/session/session';
import { getErrorReporter } from '@/shared/integrations/errorReporter';
import { logger } from '@/shared/lib/logger';

export type SessionUser = AuthResponse['user'];

export type Session =
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'signedIn'; user: SessionUser | null };

export interface SessionContextValue {
  session: Session;
  /** Signs in; rejects with the API error (e.g. wrong credentials). */
  signIn(credentials: LoginCredentials): Promise<void>;
  /**
   * Signs out: the adapter's logout (if any), then clears the stored session.
   * Never rejects (a failure is logged); repeated calls share one sign-out.
   */
  signOut(): Promise<void>;
  /** True while a sign-out is in progress (show Log out loading, disabled). */
  signingOut: boolean;
  /**
   * Reloads the user from the auth backend. Rejects with the API error; a 401
   * also signs out (the HTTP client emits session-expired).
   */
  refreshUser(): Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const SIGNED_OUT: Session = { status: 'signedOut', user: null };

/**
 * Reads the stored session. A storage failure is logged and counts as signed
 * out for this launch; the stored session is left alone, so a passing failure
 * (such as a Keychain read while the device is locked) doesn't sign the user
 * out for good.
 */
async function readStoredSession(): Promise<Session> {
  try {
    await clearSessionFromPreviousInstall();
    if (await authService.isAuthenticated()) {
      return { status: 'signedIn', user: await authService.getCurrentUser() };
    }
    // No token, e.g. after a reload on web, where the token lives in memory
    // only: drop the profile left in AsyncStorage (localStorage on web).
    await clearStoredSession();
  } catch (error) {
    logger.error('Restoring the session failed', error);
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
    // readStoredSession never rejects: a failure restores "signed out".
    void readStoredSession().then(restored => {
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

  // One sign-out at a time: repeated taps share it. It never rejects: if
  // clearing storage fails, the error is reported and the app still shows
  // the user signed out.
  const signOutRef = useRef<Promise<void> | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const signIn = useCallback(
    async (credentials: LoginCredentials) => {
      const { user } = await authService.login(credentials);
      // A sign-out still pending from an earlier session (it expired
      // meanwhile) is not this session's: it must not end it, and this
      // session's own sign-out must not join it.
      signOutRef.current = null;
      if (isMountedRef.current) setSigningOut(false);
      update({ status: 'signedIn', user });
    },
    [update]
  );

  const signOut = useCallback(() => {
    if (!signOutRef.current) {
      const pending: Promise<void> = authService
        .logout()
        .catch(error => logger.error('Signing out failed', error))
        .finally(() => {
          if (signOutRef.current !== pending) return;
          signOutRef.current = null;
          if (isMountedRef.current) setSigningOut(false);
          update(SIGNED_OUT);
        });
      signOutRef.current = pending;
      setSigningOut(true);
    }
    return signOutRef.current;
  }, [update]);

  const refreshUser = useCallback(async () => {
    const user = await authService.fetchProfile();
    if (user && isMountedRef.current) {
      setSession(current =>
        current.status === 'signedIn' ? { status: 'signedIn', user } : current
      );
    }
  }, []);

  const value = useMemo(
    () => ({ session, signIn, signOut, signingOut, refreshUser }),
    [session, signIn, signOut, signingOut, refreshUser]
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
