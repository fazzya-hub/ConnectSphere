import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'connectsphere:theme-mode';

const useThemeStore = create((set, get) => ({
  mode: 'dark',
  isHydrated: false,

  hydrateTheme: async () => {
    try {
      const storedMode = await AsyncStorage.getItem(STORAGE_KEY);
      set({
        mode: storedMode === 'light' ? 'light' : 'dark',
        isHydrated: true,
      });
    } catch (error) {
      console.error('[themeStore] hydrateTheme error:', error.message);
      set({ isHydrated: true });
    }
  },

  setMode: async (mode) => {
    const nextMode = mode === 'light' ? 'light' : 'dark';
    set({ mode: nextMode });
    await AsyncStorage.setItem(STORAGE_KEY, nextMode);
  },

  toggleMode: async () => {
    const nextMode = get().mode === 'dark' ? 'light' : 'dark';
    set({ mode: nextMode });
    await AsyncStorage.setItem(STORAGE_KEY, nextMode);
  },
}));

export default useThemeStore;
