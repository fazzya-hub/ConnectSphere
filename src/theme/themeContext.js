import React, { createContext, useContext, useEffect, useMemo } from 'react';
import useThemeStore from '../store/themeStore';

export const darkColors = {
  primary: '#FFC107',
  primaryDark: '#D4A005',
  primaryLight: '#FFE4AF',
  secondary: '#9CA3AF',
  background: '#121212',
  surface: '#1E1E24',
  surfaceLight: '#27272A',
  surfaceBright: '#3F382D',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textInverse: '#121212',
  error: '#ffb4ab',
  liked: '#E53935',
  success: '#23C55E',
  warning: '#FFC107',
  border: '#27272A',
};

export const lightColors = {
  primary: '#B77900',
  primaryDark: '#7A4F00',
  primaryLight: '#FFE4AF',
  secondary: '#6B7280',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceLight: '#F3F4F6',
  surfaceBright: '#FFF5D6',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textInverse: '#FFFFFF',
  error: '#B42318',
  liked: '#D92D20',
  success: '#15803D',
  warning: '#D97706',
  border: '#E5E7EB',
};

const ThemeContext = createContext({ mode: 'dark', colors: darkColors });

export function ThemeProvider({ children }) {
  const mode = useThemeStore((state) => state.mode);
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme);

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  const value = useMemo(
    () => ({ mode, colors: mode === 'light' ? lightColors : darkColors }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
