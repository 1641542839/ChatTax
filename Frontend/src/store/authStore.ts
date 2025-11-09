/**
 * Authentication Store
 * 
 * Global state management for user authentication using Zustand.
 * Handles user session, tokens, and authentication status.
 * 
 * @module store/authStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserResponse } from '@/types/api';

/**
 * Authentication state interface
 */
interface AuthState {
  /** Current authenticated user */
  user: UserResponse | null;
  /** JWT access token */
  token: string | null;
  /** Is user authenticated */
  isAuthenticated: boolean;
  /** Is authentication being checked */
  isLoading: boolean;
}

/**
 * Authentication actions interface
 */
interface AuthActions {
  /** Set user and token after login */
  setUser: (user: UserResponse) => void;
  /** Set authentication token */
  setToken: (token: string) => void;
  /** Clear authentication state (logout) */
  logout: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Initialize auth from localStorage */
  initialize: () => void;
}

/**
 * Initial authentication state
 */
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

/**
 * Authentication store with persistence
 * 
 * @example
 * ```typescript
 * // In a component
 * const { user, isAuthenticated, setUser, logout } = useAuthStore();
 * 
 * // After login
 * setUser(userData);
 * setToken(accessToken);
 * 
 * // Check auth status
 * if (!isAuthenticated) {
 *   router.push('/login');
 * }
 * 
 * // Logout
 * logout();
 * ```
 */
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,

      /**
       * Set current user
       */
      setUser: (user) => set({ 
        user, 
        isAuthenticated: true,
        isLoading: false 
      }),

      /**
       * Set authentication token
       */
      setToken: (token) => set({ 
        token,
        isAuthenticated: !!token,
        isLoading: false
      }),

      /**
       * Clear authentication state
       */
      logout: () => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }

        // Reset state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      /**
       * Set loading state
       */
      setLoading: (loading) => set({ isLoading: loading }),

      /**
       * Initialize authentication from localStorage
       */
      initialize: () => {
        if (typeof window === 'undefined') {
          set({ isLoading: false });
          return;
        }

        const token = localStorage.getItem('access_token');
        
        if (token) {
          // Token exists, verify it's valid
          try {
            // Decode JWT to check expiry
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiryTime = payload.exp * 1000;
            
            if (Date.now() < expiryTime) {
              // Token is valid
              set({ 
                token,
                isAuthenticated: true,
                isLoading: false
              });
            } else {
              // Token expired
              set({ 
                token: null,
                isAuthenticated: false,
                isLoading: false
              });
            }
          } catch (e) {
            // Invalid token format
            set({ 
              token: null,
              isAuthenticated: false,
              isLoading: false
            });
          }
        } else {
          // No token
          set({ 
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ 
        // Only persist user and token
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Selector hooks for specific auth state
 */
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
