import { create } from 'zustand';
import * as authService from '@/core/services/auth.service';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  initializeSession: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const AUTH_INITIAL_STATE: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...AUTH_INITIAL_STATE,

  login: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.loginWithGoogle();
      set({ isAuthenticated: true, user, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({ isAuthenticated: false, user: null, isLoading: false, error: errorMessage });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ isAuthenticated: false, user: null, error: null });
  },

  initializeSession: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.getStoredSession();
      set({
        isAuthenticated: !!user,
        user,
        isLoading: false,
      });

      // Start background token refresh if authenticated
      if (user) {
        get().refreshToken();
      }
    } catch (error) {
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  refreshToken: async () => {
    try {
      await authService.refreshTokenIfNeeded();
    } catch (error) {
      console.error('Background token refresh failed:', error);
      // Don't update state - allow offline usage
    }
  },

  clearError: () => set({ error: null }),
}));

// Selectors
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useAuthActions = () =>
  useAuthStore((state) => ({
    login: state.login,
    logout: state.logout,
    initializeSession: state.initializeSession,
    refreshToken: state.refreshToken,
    clearError: state.clearError,
  }));

// Start periodic token refresh (every 30 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const { isAuthenticated, refreshToken } = useAuthStore.getState();
    if (isAuthenticated) {
      refreshToken();
    }
  }, 30 * 60 * 1000);
}
