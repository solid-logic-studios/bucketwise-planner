# Theme-Aware Colors: Component Migration Checklist

## Completed Components ✅

- [x] **HelpDrawer** (2 colors)
  - Title: `c="dimmed"` → `c={textMuted}`
  - Badges: `color="gray"` → `color={badgeSecondary}`

- [x] **TransactionsView** (2 colors)
  - Past fortnight badge: `color="gray"` → `color={badgeSecondary}`
  - Added missing hotkeys setup

- [x] **PlanCard** (7 colors)
  - Bucket spending amounts: `c="dimmed"` → `c={textMuted}`
  - Recurring expenses labels: `c="dimmed"` → `c={textMuted}`
  - Payment amounts: `c="dimmed"` → `c={textMuted}` (4 instances)

## Components to Evaluate

### High Priority (Hardcoded Shades)

- [ ] **TransactionsTable** (in TransactionsView)
  - Line ~65: `color="gray"` on clear button
  - Status: Uses semantic color, likely OK but check

### Medium Priority (Semantic Colors - Usually OK)

- [ ] **ProfileMenu**
  - Line ~68: `color="red"` on logout button
  - Status: ✅ Semantic color, intentional

- [ ] **ErrorAlert**
  - Uses `color="red"` 
  - Status: ✅ Semantic color, intentional

- [ ] **OwnHomeView**
  - Line ~122: `c="teal.4"` (Fire Extinguisher amount)
  - Line ~134: `c="green.4"` (Interest saved)
  - Line ~127: `c="orange.4"` (Time saved)
  - Status: 🟡 Semantic colors, check if readable in light mode

- [ ] **DeleteConfirmationModal**
  - `color="red"` buttons
  - Status: ✅ Semantic color, intentional

- [ ] **SkipPaymentModal**
  - `color="red"` button
  - Status: ✅ Semantic color, intentional

- [ ] **ChatWidget**
  - Line ~204: `color="red"` alert
  - Status: ✅ Semantic color, intentional

### Optional Enhancements

- [ ] **Create `errorText` Virtual Color**
  - For skip reason messages in PlanCard
  - Current: `c="red"` (works but could be theme-aware)
  - Benefit: Consistent error styling across app

- [ ] **Create `cardBackground` Virtual Color**
  - For HelpDrawer background: `style={{ background: 'var(--mantine-color-dark-7)' }}`
  - Would auto-adapt to light mode

- [ ] **Create `successText` Virtual Color**
  - For success messages, positive feedback
  - Pairs with `errorText` for consistency

## How to Add New Virtual Colors

### 1. Define in `theme.ts`

```typescript
colors: {
  // Existing virtual colors...
  errorText: virtualColor({
    name: 'errorText',
    dark: 'red.5',      // Brighter red in dark mode
    light: 'red.7',     // Darker red in light mode
  }),
}
```

### 2. Update `useThemeColors()` Hook

```typescript
export function useThemeColors() {
  return {
    // Existing colors...
    errorText: 'errorText',
    // ...
  };
}
```

### 3. Use in Components

```typescript
const { errorText } = useThemeColors();
<Text c={errorText}>Error message</Text>
```

## Semi-Automatic Migration Script

To find potential hardcoded colors in a component:

```bash
# Find all color references
grep -r "c=\"\|color=\"" frontend/src/components/ | grep -v "node_modules"

# Find specifically gray references
grep -r "c=\"gray\|color=\"gray" frontend/src/components/

# Find specific shades that need attention
grep -r "gray\.[0-3]\|gray\.[7-9]\|night\." frontend/src/components/
```

## Testing Strategy

For each component migration:

1. **Run TypeScript check**
   ```bash
   pnpm exec tsc --noEmit
   ```

2. **Manual testing**
   - Toggle theme button in navbar
   - Verify text is readable in both light and dark modes
   - Check contrast with developer tools (DevTools → Colors → Contrast)
   - Test on different screen sizes

3. **Specific checks**
   - [ ] Text is not invisible in light mode
   - [ ] Text is not washed out in dark mode
   - [ ] Badges are visible and properly styled
   - [ ] No layout shifts when toggling theme
   - [ ] Animations still work smoothly

4. **Git workflow**
   ```bash
   git checkout -b feat/theme-aware-[component-name]
   # Make changes
   git add -A
   git commit -m "refactor: use virtual colors in [component]"
   ```

## Performance Considerations

- ✅ **No performance impact** - Virtual colors are CSS variables
- ✅ **No re-renders needed** - Colors adjust at CSS level
- ✅ **No bundle size increase** - Uses existing Mantine CSS
- ✅ **No runtime overhead** - All work done at compile time

## Documentation Updates

When completing each component:

1. Update this checklist
2. Add before/after screenshots to [VIRTUAL_COLORS_REFERENCE.md](VIRTUAL_COLORS_REFERENCE.md)
3. Update [THEME_COLORS_SYSTEM.md](THEME_COLORS_SYSTEM.md) if new patterns emerge

## References

- 📖 [Mantine Virtual Colors Docs](https://mantine.dev/theming/colors/#virtual-colors)
- 📖 [Color Schemes Guide](https://mantine.dev/theming/color-schemes/)
- 📋 [THEME_COLORS_SYSTEM.md](THEME_COLORS_SYSTEM.md) - Detailed usage guide
- 📋 [VIRTUAL_COLORS_REFERENCE.md](VIRTUAL_COLORS_REFERENCE.md) - Visual reference
- 📋 [THEME_MIGRATION_SUMMARY.md](THEME_MIGRATION_SUMMARY.md) - Work completed

## Questions & Troubleshooting

**Q: Why not just use Mantine's built-in `c="dimmed"`?**  
A: Mantine's `dimmed` color may not provide optimal contrast in all themes. Virtual colors give us explicit control.

**Q: Will this work with custom themes?**  
A: Yes! The virtual colors are defined relative to gray shades, so they'll adapt if gray palette changes.

**Q: Can I use CSS variables directly?**  
A: Not recommended. The virtual color system is cleaner and more maintainable.

**Q: What about browser support?**  
A: CSS variables are supported in all modern browsers. Mantine handles fallbacks automatically.

---

**Last Updated**: 2026-01-14  
**Total Completed**: 3 components  
**Total to Evaluate**: 7 components  
**Optional Enhancements**: 3 new virtual colors
