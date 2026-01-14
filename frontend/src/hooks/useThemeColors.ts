import { useMantineTheme } from '@mantine/core';

/**
 * Hook to get theme-aware color values that automatically adjust between light and dark modes
 * Usage: const { textMuted, textSubtle } = useThemeColors();
 */
export function useThemeColors() {
  const theme = useMantineTheme();

  return {
    textMuted: 'textMuted',
    textSubtle: 'textSubtle',
    textSecondary: 'textSecondary',
    badgeSecondary: 'badgeSecondary',
    // Get actual color values if needed
    values: {
      textMuted: theme.colors.textMuted,
      textSubtle: theme.colors.textSubtle,
      textSecondary: theme.colors.textSecondary,
      badgeSecondary: theme.colors.badgeSecondary,
    },
  };
}
