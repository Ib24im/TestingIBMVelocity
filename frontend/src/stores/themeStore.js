import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      isDark: false,
      
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
      
      setTheme: (isDark) => set({ isDark }),
      
      // Initialize theme based on system preference
      initializeTheme: () => {
        if (typeof window !== 'undefined') {
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          set({ isDark: systemDark });
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ isDark: state.isDark }),
    }
  )
);
