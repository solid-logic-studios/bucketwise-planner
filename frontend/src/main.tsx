import '@mantine/charts/styles.css';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './styles/theme-transitions.css';
import { darkTheme } from './theme.js';

function getInitialColorScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('bucketwise-theme');
  return stored === 'light' ? 'light' : 'dark';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider 
      theme={darkTheme}
      defaultColorScheme={getInitialColorScheme()}
    >
      <App />
    </MantineProvider>
  </StrictMode>
);
