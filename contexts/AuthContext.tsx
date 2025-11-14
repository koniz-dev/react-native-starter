/**
 * Auth Context
 * Production-ready authentication context with TypeScript, async operations,
 * and proper error handling. Uses useReducer for complex state management.
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { authService, type AuthResponse, type LoginCredentials } from '@/services/auth';
import { getItem, STORAGE_KEYS } from '@/services/storage';

// ============================================================================
// Types
// ============================================================================

interface AuthState {
  user: AuthResponse['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: AuthResponse['user']; token: string } }
  | { type: 'AUTH_FAILURE'; payload: { error: string } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_INIT_START' }
  | { type: 'AUTH_INIT_SUCCESS'; payload: { user: AuthResponse['user'] | null; token: string | null } }
  | { type: 'AUTH_INIT_FAILURE' }
  | { type: 'SET_USER'; payload: { user: AuthResponse['user'] } }
  | { type: 'CLEAR_ERROR' };

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthResponse['user']) => void;
  clearError: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,
};

// ============================================================================
// Reducer
// ============================================================================

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
        isAuthenticated: false,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'AUTH_INIT_START':
      return {
        ...state,
        isInitializing: true,
      };

    case 'AUTH_INIT_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: action.payload.token !== null,
        isInitializing: false,
        error: null,
      };

    case 'AUTH_INIT_FAILURE':
      return {
        ...state,
        isInitializing: false,
        isAuthenticated: false,
      };

    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from storage on mount
  useEffect(() => {
    async function initializeAuth() {
      dispatch({ type: 'AUTH_INIT_START' });

      try {
        const [user, token] = await Promise.all([
          authService.getCurrentUser(),
          getItem<string>(STORAGE_KEYS.AUTH_TOKEN),
        ]);

        dispatch({
          type: 'AUTH_INIT_SUCCESS',
          payload: { user, token },
        });
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        dispatch({ type: 'AUTH_INIT_FAILURE' });
      }
    }

    initializeAuth();
  }, []);

  // Login action
  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await authService.login(credentials);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed. Please try again.';
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { error: errorMessage },
      });
      throw error; // Re-throw to allow component-level error handling
    }
  }, []);

  // Logout action
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  // Set user action (for updating user profile, etc.)
  const setUser = useCallback((user: AuthResponse['user']) => {
    dispatch({ type: 'SET_USER', payload: { user } });
  }, []);

  // Clear error action
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: AuthContextValue = React.useMemo(
    () => ({
      ...state,
      login,
      logout,
      setUser,
      clearError,
    }),
    [state, login, logout, setUser, clearError]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Hook to access auth context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

