import { useMantineColorScheme } from '@mantine/core';
import { useEffect, useLayoutEffect } from 'react';

/**
 * Hook to manage theme state and persistence.
 * Initializes from localStorage and keeps it in sync with Mantine's color scheme.
 */
export function useTheme() {
  const { colorScheme, setColorScheme } = useMantineColorScheme({
    keepTransitions: true,
  });

  // Initialize from localStorage on mount (one-time)
  useLayoutEffect(() => {
    const stored = localStorage.getItem('bucketwise-theme');
    if (stored === 'light' || stored === 'dark') {
      if (stored !== colorScheme) {
        setColorScheme(stored);
      }
    }
  }, []);

  // Sync localStorage whenever colorScheme changes (e.g., user toggles theme)
  useEffect(() => {
    localStorage.setItem('bucketwise-theme', colorScheme);
  }, [colorScheme]);

  const toggleTheme = () => {
    const newTheme = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newTheme);
  };

  return {
    theme: colorScheme as 'light' | 'dark',
    toggleTheme,
  };
}
