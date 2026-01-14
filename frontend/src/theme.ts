import type { MantineColorsTuple, MantineThemeOverride } from '@mantine/core';
import { createTheme, virtualColor } from '@mantine/core';

const night: MantineColorsTuple = [
  '#f0f5ff',
  '#d5ddf2',
  '#b7c3e4',
  '#97a7d6',
  '#7c8dc9',
  '#6272b0',
  '#4d598a',
  '#384163',
  '#242a3f',
  '#101624',
];

const accent: MantineColorsTuple = [
  '#e7fff8',
  '#c8f5e6',
  '#9ee9d1',
  '#6bd8b7',
  '#35c69a',
  '#12b07f',
  '#0a8f67',
  '#0a7052',
  '#0a5741',
  '#063129',
];

const amber: MantineColorsTuple = [
  '#fff6e8',
  '#ffe9c6',
  '#ffd38d',
  '#ffbd54',
  '#f9a11c',
  '#df8604',
  '#b66a00',
  '#8c5204',
  '#6f410a',
  '#59350c',
];

const sharedThemeConfig: MantineThemeOverride = {
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily:
      'Space Grotesk, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: '600',
  },
  colors: {
    night,
    accent,
    amber,
    // Virtual colors that switch based on theme
    textMuted: virtualColor({
      name: 'textMuted',
      dark: 'gray.5',
      light: 'gray.7',
    }),
    textSubtle: virtualColor({
      name: 'textSubtle',
      dark: 'gray.6',
      light: 'gray.6',
    }),
    textSecondary: virtualColor({
      name: 'textSecondary',
      dark: 'gray.4',
      light: 'gray.8',
    }),
    badgeSecondary: virtualColor({
      name: 'badgeSecondary',
      dark: 'gray',
      light: 'gray',
    }),
  },
  primaryColor: 'accent',
  primaryShade: { light: 5, dark: 5 },
  defaultRadius: 'md',
};

export const darkTheme = createTheme({
  ...sharedThemeConfig,
});

export const theme = darkTheme;
