import { ActionIcon, Tooltip } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeProvider.js';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip label={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
      <ActionIcon
        onClick={toggleTheme}
        variant="default"
        size="lg"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
      </ActionIcon>
    </Tooltip>
  );
}
