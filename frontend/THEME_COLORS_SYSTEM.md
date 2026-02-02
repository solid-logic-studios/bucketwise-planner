# Theme-Aware Colors System

## Overview

This application uses Mantine's **Virtual Colors** feature to automatically adapt text colors and component styling based on the current theme (light/dark mode). This eliminates the need for hardcoded colors that look bad in one mode or the other.

## Virtual Colors Defined

The theme now includes theme-aware virtual colors that automatically adjust:

| Virtual Color | Dark Mode | Light Mode | Use Case |
|---|---|---|---|
| `textMuted` | `gray.5` | `gray.7` | Dimmed/secondary text |
| `textSubtle` | `gray.6` | `gray.6` | Subtle text labels |
| `textSecondary` | `gray.4` | `gray.8` | Secondary text content |
| `badgeSecondary` | `gray` | `gray` | Badge backgrounds (light variant) |

## How Mantine Virtual Colors Work

Virtual colors automatically switch values based on the current color scheme:

```typescript
// In theme.ts
textMuted: virtualColor({
  name: 'textMuted',
  dark: 'gray.5',    // Used in dark mode
  light: 'gray.7',   // Used in light mode
})
```

When the theme toggles, Mantine automatically uses the appropriate shade without any component re-renders needed.

## Usage in Components

### Method 1: Use the `useThemeColors()` Hook

```tsx
import { useThemeColors } from '../hooks/useThemeColors';
import { Text, Badge } from '@mantine/core';

function MyComponent() {
  const { textMuted, badgeSecondary } = useThemeColors();

  return (
    <>
      <Text c={textMuted}>This text will be properly styled in both modes</Text>
      <Badge variant="light" color={badgeSecondary}>
        Tag
      </Badge>
    </>
  );
}
```

### Method 2: Use Virtual Color Names Directly

```tsx
import { Text, Badge } from '@mantine/core';

function MyComponent() {
  return (
    <>
      <Text c="textMuted">This text adapts to theme</Text>
      <Badge variant="light" color="badgeSecondary">
        Tag
      </Badge>
    </>
  );
}
```

## Replacing Hardcoded Colors

### Before (Problematic)
```tsx
// ❌ Gray.2 is light, looks bad in light mode
<Text c="gray.2">Secondary text</Text>
<Badge color="gray" variant="light">Tag</Badge>
```

### After (Theme-Aware)
```tsx
// ✅ Automatically adapts to current theme
<Text c="textMuted">Secondary text</Text>
<Badge variant="light" color="badgeSecondary">Tag</Badge>
```

## Adding New Virtual Colors

To add a new theme-aware color:

1. **Define in theme.ts:**
```typescript
colors: {
  // ... existing colors ...
  newColorName: virtualColor({
    name: 'newColorName',
    dark: 'color-name.shade',  // Dark mode value
    light: 'color-name.shade',  // Light mode value
  }),
}
```

2. **Add to useThemeColors() hook:**
```typescript
export function useThemeColors() {
  return {
    // ... existing colors ...
    newColorName: 'newColorName',
    values: {
      // ... existing values ...
      newColorName: theme.colors.newColorName,
    },
  };
}
```

3. **Use in components:**
```tsx
const { newColorName } = useThemeColors();
<Text c={newColorName}>Content</Text>
```

## Common Color Scenarios

### Text Colors
- **Muted/secondary text**: Use `textMuted` (dimmed explanations, descriptions)
- **Subtle labels**: Use `textSubtle` (labels, tags, small descriptions)
- **Secondary content**: Use `textSecondary` (body text, content)
- **Primary text**: Omit color prop (uses default text color)

### Badge Colors
- **Secondary badges**: Use `badgeSecondary` with `variant="light"`
- **Semantic colors**: Use named colors like `red`, `blue`, `green` (auto-adjust based on theme)
- **Custom colors**: Define new virtual colors as needed

### Background & Borders
- Use Mantine's built-in props (they're already theme-aware)
- Use `style={{ background: 'var(--mantine-color-dark-7)' }}` for custom backgrounds (⚠️ needs updating)

## Why Not Use `dimmed`?

Mantine's `c="dimmed"` is a pre-defined color that may not adjust optimally. Our virtual colors provide more control and explicit theme-awareness.

## Best Practices

1. ✅ Use virtual colors for any text that needs to adapt to theme
2. ✅ Use semantic color names (`red`, `blue`, `green`) for state/intent (auto-adapts)
3. ✅ Remove hardcoded gray/night color references
4. ✅ Test both light and dark modes after changes
5. ❌ Don't use `c="gray.2"`, `c="gray.7"`, etc. anymore
6. ❌ Don't use inline `c` props with hardcoded shades

## Testing

Switch between light and dark modes (click the theme toggle in the header) and verify:
- Text is readable in both modes
- Badges and badges display properly
- No text becomes invisible or hard to read
- Overall visual consistency is maintained

## References

- [Mantine Virtual Colors Documentation](https://mantine.dev/theming/colors/#virtual-colors)
- [Color Schemes Guide](https://mantine.dev/theming/color-schemes/)
- [Mantine Theme Object](https://mantine.dev/theming/theme-object/)
