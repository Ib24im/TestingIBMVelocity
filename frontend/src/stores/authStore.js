import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/authService';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(email, password);
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(userData);
          set({ isLoading: false });
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        // Clear token from localStorage
        localStorage.removeItem('auth-token');
      },

      refreshUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const user = await authService.getCurrentUser();
          set({ user });
        } catch (error) {
          // If refresh fails, logout
          get().logout();
        }
      },

      // Initialize auth state from token
      initializeAuth: () => {
        const token = localStorage.getItem('auth-token');
        if (token) {
          set({ token, isAuthenticated: true });
          get().refreshUser();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
