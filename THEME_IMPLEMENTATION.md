# Mantine Dark & Light Theme Implementation

## Overview
Implemented a fully functional dark and light theme toggle using Mantine's theming engine with persistent theme preference storage.

## Changes Made

### 1. **Theme Configuration** (`frontend/src/theme.ts`)
- Extracted shared theme configuration into `sharedThemeConfig`
- Created `darkTheme` and `lightTheme` using `createTheme()`
- Both themes share the same color palettes (night, accent, amber) and typography
- Exported both themes for dynamic switching

### 2. **Theme Context Provider** (`frontend/src/contexts/ThemeProvider.tsx`)
- Created `ThemeProvider` component using React Context API
- Uses Mantine's `useLocalStorage` hook to persist theme preference
- Stores theme choice in localStorage under key `'bucketwise-theme'`
- Defaults to `'dark'` theme on first visit
- Custom `useTheme()` hook provides access to theme and `toggleTheme()` function
- Handles mount state to prevent hydration mismatches

### 3. **Theme Toggle Component** (`frontend/src/components/ThemeToggle.tsx`)
- New `ThemeToggle` action button with sun/moon icons
- Uses Tabler Icons (IconSun, IconMoon)
- Tooltip displays appropriate label based on current theme
- Integrated with `useTheme()` hook for theme switching
- Uses `useMantineColorScheme()` for color scheme detection

### 4. **Main Entry Point** (`frontend/src/main.tsx`)
- Wrapped app with `ThemeProvider`
- Created `ThemeRoot` component that:
  - Reads current theme from `useTheme()`
  - Dynamically selects `darkTheme` or `lightTheme`
  - Passes theme to `MantineProvider`
  - Sets `defaultColorScheme` based on current theme

### 5. **Header Integration** (`frontend/src/App.tsx`)
- Imported `ThemeToggle` component
- Added theme toggle button to navbar header
- Positioned between brand/nav and user menu
- Styled with `variant="default"` size `"lg"`

### 6. **Component Exports** (`frontend/src/components/index.ts`)
- Added `ThemeToggle` to barrel exports for easy importing

## Features

✅ **Dark/Light Theme Toggle** - Click sun/moon icon to switch themes  
✅ **Persistent Preference** - Theme choice saved to localStorage  
✅ **Smooth Transitions** - Mantine handles CSS transitions automatically  
✅ **Accessible** - Tooltips and proper aria-labels  
✅ **Type-Safe** - Full TypeScript support with no errors  
✅ **SSR Compatible** - Mount state handling prevents hydration issues  
✅ **Customizable Colors** - Both themes share color definitions (night, accent, amber)  

## Usage

### For Users
Click the theme toggle button (sun ☀️ / moon 🌙 icon) in the header to switch between dark and light modes. The preference is automatically saved.

### For Developers
```tsx
// Use theme hook in any component
import { useTheme } from './contexts/ThemeProvider';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

## File Structure
```
frontend/
├── src/
│   ├── contexts/
│   │   └── ThemeProvider.tsx (NEW)
│   ├── components/
│   │   ├── ThemeToggle.tsx (NEW)
│   │   └── index.ts (UPDATED)
│   ├── App.tsx (UPDATED)
│   ├── main.tsx (UPDATED)
│   └── theme.ts (UPDATED)
```

## Notes
- Both themes use identical color systems; styling is handled by Mantine's theme engine
- The implementation follows Mantine best practices from their theming documentation
- localStorage key `'bucketwise-theme'` can be customized in `ThemeProvider.tsx`
- To customize theme appearance, modify `sharedThemeConfig` in `theme.ts`
