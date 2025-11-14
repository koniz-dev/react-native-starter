/**
 * Auth Slice
 *
 * Manages authentication state including user data, token, and loading states.
 * Integrates with the existing authService for API calls.
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  authService,
  type LoginCredentials,
  type AuthResponse,
} from '@/services/auth';
import { getItem, STORAGE_KEYS } from '@/services/storage';
import type { RootState } from '../index';

/**
 * Auth State Interface
 */
interface AuthState {
  user: AuthResponse['user'] | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

/**
 * Initial State
 */
const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

/**
 * Async Thunk: Login
 *
 * Handles login flow by calling authService and updating state.
 * The authService handles token storage automatically.
 */
export const loginAsync = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authService.login(credentials);
    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Login failed. Please try again.';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Async Thunk: Logout
 *
 * Handles logout flow by calling authService to clear storage.
 */
export const logoutAsync = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authService.logout();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Logout failed.';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Async Thunk: Check Authentication
 *
 * Checks if user is authenticated by verifying token in storage.
 */
export const checkAuthAsync = createAsyncThunk<
  { user: AuthResponse['user'] | null; token: string | null },
  void,
  { rejectValue: string }
>('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const isAuthenticated = await authService.isAuthenticated();
    if (isAuthenticated) {
      const user = await authService.getCurrentUser();
      const token = await getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
      return { user: user || null, token: token || null };
    }
    return { user: null, token: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to check authentication.';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Auth Slice
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Set user data manually
     * Useful for restoring user from storage on app start
     */
    setUser: (state, action: PayloadAction<AuthResponse['user']>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    /**
     * Set token manually
     */
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    /**
     * Clear error state
     */
    clearError: state => {
      state.error = null;
    },
    /**
     * Reset auth state to initial
     */
    resetAuth: state => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: builder => {
    // Login cases
    builder
      .addCase(loginAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
      });

    // Logout cases
    builder
      .addCase(logoutAsync.pending, state => {
        state.loading = true;
      })
      .addCase(logoutAsync.fulfilled, state => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Logout failed';
      });

    // Check auth cases
    builder
      .addCase(checkAuthAsync.pending, state => {
        state.loading = true;
      })
      .addCase(checkAuthAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = !!action.payload.token;
        state.error = null;
      })
      .addCase(checkAuthAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to check authentication';
        state.isAuthenticated = false;
      });
  },
});

/**
 * Actions
 */
export const { setUser, setToken, clearError, resetAuth } = authSlice.actions;

/**
 * Selectors
 *
 * Use these selectors to access auth state in components.
 */
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectToken = (state: RootState) => state.auth.token;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;

/**
 * Reducer
 */
export default authSlice.reducer;
