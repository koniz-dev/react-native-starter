import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { logger } from '@/shared/lib/logger';
import { setAuthAdapter, type AuthAdapter } from '@/shared/session/authService';
import { emitSessionExpired } from '@/shared/session/session';
import { SessionProvider, useSession } from '@/shared/session/SessionProvider';
import { STORAGE_KEYS } from '@/shared/storage/storage';
import { secureStore } from '@/testing';

/** An adapter whose logout waits until the test finishes it. */
function slowLogoutAdapter() {
  const finishers: (() => void)[] = [];
  const adapter: AuthAdapter = {
    login: async ({ username }) => ({
      token: `token-${username}`,
      user: { id: username, email: `${username}@example.com`, name: username },
    }),
    normalizeUser: raw => raw as { id: string; email: string; name: string },
    logout: jest.fn(
      () => new Promise<void>(resolve => finishers.push(() => resolve()))
    ),
  };
  return { adapter, finishLogout: () => finishers.shift()?.() };
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <SessionProvider>{children}</SessionProvider>
);

async function renderSession() {
  const hook = await renderHook(() => useSession(), { wrapper });
  await waitFor(() =>
    expect(hook.result.current.session.status).toBe('signedOut')
  );
  return hook;
}

afterEach(() => {
  setAuthAdapter(null);
  jest.restoreAllMocks();
});

describe('SessionProvider sign-out', () => {
  it('is busy while signing out, and repeated calls share one sign-out', async () => {
    const { adapter, finishLogout } = slowLogoutAdapter();
    setAuthAdapter(adapter);
    const { result } = await renderSession();
    await act(() => result.current.signIn({ username: 'a', password: 'p' }));

    let first!: Promise<void>;
    let second!: Promise<void>;
    await act(() => {
      first = result.current.signOut();
      second = result.current.signOut();
    });
    expect(second).toBe(first);
    expect(result.current.signingOut).toBe(true);
    expect(result.current.session.status).toBe('signedIn');

    await act(async () => {
      finishLogout();
      await first;
    });
    expect(adapter.logout).toHaveBeenCalledTimes(1);
    expect(result.current.signingOut).toBe(false);
    expect(result.current.session.status).toBe('signedOut');
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
  });

  it('does not end a session that started while an earlier sign-out was pending', async () => {
    const { adapter, finishLogout } = slowLogoutAdapter();
    setAuthAdapter(adapter);
    const { result } = await renderSession();
    await act(() => result.current.signIn({ username: 'a', password: 'p' }));

    let pending!: Promise<void>;
    await act(() => {
      pending = result.current.signOut();
    });
    // A's session expires (a 401) while the backend is slow to sign out, and
    // B signs in from the Login screen.
    await act(async () => {
      emitSessionExpired();
    });
    expect(result.current.session.status).toBe('signedOut');
    await act(() => result.current.signIn({ username: 'b', password: 'p' }));
    expect(result.current.signingOut).toBe(false);

    await act(async () => {
      finishLogout();
      await pending;
    });
    expect(result.current.session).toMatchObject({
      status: 'signedIn',
      user: { id: 'b' },
    });
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('token-b');

    // B's own sign-out is a new one, not A's finished one.
    let own!: Promise<void>;
    await act(() => {
      own = result.current.signOut();
    });
    await act(async () => {
      finishLogout();
      await own;
    });
    expect(adapter.logout).toHaveBeenCalledTimes(2);
    expect(result.current.session.status).toBe('signedOut');
  });

  it('never rejects: a failure is logged and the user is signed out', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => {});
    setAuthAdapter({ ...slowLogoutAdapter().adapter, logout: undefined });
    const { result } = await renderSession();
    await act(() => result.current.signIn({ username: 'a', password: 'p' }));
    const failure = new Error('Keychain unavailable');
    jest.mocked(SecureStore.deleteItemAsync).mockRejectedValueOnce(failure);

    await act(() => result.current.signOut());

    expect(error).toHaveBeenCalledWith('Signing out failed', failure);
    expect(result.current.session.status).toBe('signedOut');
    expect(result.current.signingOut).toBe(false);
  });
});

it('useSession throws outside a SessionProvider', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(renderHook(() => useSession())).rejects.toThrow(
    'useSession must be used inside <SessionProvider>'
  );
});
