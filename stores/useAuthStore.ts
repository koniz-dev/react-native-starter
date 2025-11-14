/**
 * Auth Store
 * Zustand store for authentication state management
 * Includes persistence for auth token and user data
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  authService,
  type LoginCredentials,
  type AuthResponse,
} from '@/services/auth';
import { setItem, getItem, STORAGE_KEYS } from '@/services/storage';

interface AuthState {
  // State
  user: AuthResponse['user'] | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthResponse['user']) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

/**
 * Auth store with persistence middleware
 * Persists user and token to AsyncStorage automatically
 */
export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      // Initial state
      user: null,
      token: null,
      loading: false,
      error: null,

      // Login action - integrates with authService
      login: async (credentials: LoginCredentials) => {
        set({ loading: true, error: null });
        try {
          const response = await authService.login(credentials);
          // Note: authService already stores token and user in AsyncStorage
          // We also update Zustand state for immediate UI updates
          set({
            user: response.user,
            token: response.token,
            loading: false,
            error: null,
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'Login failed. Please try again.';
          set({
            loading: false,
            error: errorMessage,
          });
          throw err;
        }
      },

      // Logout action - integrates with authService
      logout: async () => {
        set({ loading: true });
        try {
          await authService.logout();
          set({
            user: null,
            token: null,
            loading: false,
            error: null,
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Logout failed.';
          set({
            loading: false,
            error: errorMessage,
          });
        }
      },

      // Update user data
      setUser: (user: AuthResponse['user']) => {
        set({ user });
        // Also update storage to keep in sync
        setItem(STORAGE_KEYS.USER_DATA, user).catch(console.error);
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Check authentication status from storage
      checkAuth: async () => {
        set({ loading: true });
        try {
          const isAuthenticated = await authService.isAuthenticated();
          if (isAuthenticated) {
            const user = await authService.getCurrentUser();
            const token = await getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
            set({
              user: user || null,
              token: token || null,
              loading: false,
            });
          } else {
            set({
              user: null,
              token: null,
              loading: false,
            });
          }
        } catch {
          set({
            loading: false,
            error: 'Failed to check authentication status',
          });
        }
      },
    }),
    {
      name: 'auth-storage', // Storage key in AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user and token, not loading/error states
      partialize: state => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

// Selectors for computed values (optional but recommended)
export const useAuthUser = () => useAuthStore(state => state.user);
export const useAuthToken = () => useAuthStore(state => state.token);
export const useIsAuthenticated = () =>
  useAuthStore(state => !!state.token && !!state.user);
export const useAuthLoading = () => useAuthStore(state => state.loading);
export const useAuthError = () => useAuthStore(state => state.error);
