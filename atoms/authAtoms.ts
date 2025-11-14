/**
 * Auth Atoms
 * Jotai atoms for authentication state management
 * Demonstrates primitive atoms, derived atoms, and async write atoms
 */
import { atom } from 'jotai';
import { authService, type AuthResponse } from '@/services/auth';

/**
 * Primitive atom: User data
 * Stores the current authenticated user information
 */
export const userAtom = atom<AuthResponse['user'] | null>(null);

/**
 * Primitive atom: Auth token
 * Stores the authentication token
 */
export const tokenAtom = atom<string | null>(null);

/**
 * Derived atom: Is authenticated
 * Computed from tokenAtom - automatically updates when token changes
 * This demonstrates Jotai's atomic composition approach
 */
export const isAuthenticatedAtom = atom(get => {
  const token = get(tokenAtom);
  return token !== null && token.length > 0;
});

/**
 * Async write atom: Login
 * Handles login operation and updates both userAtom and tokenAtom
 * This demonstrates Jotai's async atom pattern
 */
export const loginAtom = atom(
  null,
  async (get, set, credentials: { email: string; password: string }) => {
    const response = await authService.login(credentials);
    // Update both atoms atomically
    set(userAtom, response.user);
    set(tokenAtom, response.token);
    return response;
  }
);

/**
 * Write atom: Logout
 * Action atom that clears auth state
 * This demonstrates Jotai's write-only atom pattern
 */
export const logoutAtom = atom(null, async (get, set) => {
  try {
    await authService.logout();
    // Clear both atoms atomically
    set(userAtom, null);
    set(tokenAtom, null);
  } catch (error) {
    // Log error but still clear local state
    console.error('Logout error:', error);
    set(userAtom, null);
    set(tokenAtom, null);
  }
});
