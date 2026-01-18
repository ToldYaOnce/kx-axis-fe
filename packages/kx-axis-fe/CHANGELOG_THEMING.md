# Changelog: Theme Customization Support

**Date:** 2026-01-12  
**Version:** v1.1.0 (Theming Update)

---

## Summary

Added full theme customization support to `@toldyaonce/kx-axis-fe`, enabling seamless integration with existing MUI-based applications like `kx-forms-fe`.

---

## Changes

### 1. New Theme System

**Added:**
- `src/theme/index.ts` - Centralized theme configuration
- `defaultLightTheme` - Clean, minimal light theme (default)
- `kxgryndeTheme` - Bold, high-contrast theme (dark cards on light background)
- `createKxAxisTheme(options)` - Helper for custom themes

**Exports:**
```ts
export { 
  defaultLightTheme, 
  kxgryndeTheme, 
  createKxAxisTheme 
} from '@toldyaonce/kx-axis-fe';
```

---

### 2. KxAxisComposer API Changes

**New Props:**
```ts
interface KxAxisComposerProps {
  // ... existing props
  theme?: Theme;                  // Custom MUI theme
  disableThemeProvider?: boolean; // Use parent theme instead of internal
}
```

**Behavior:**
- **Default**: Uses `defaultLightTheme` with internal `ThemeProvider`
- **With `theme` prop**: Uses provided theme with internal `ThemeProvider`
- **With `disableThemeProvider={true}`**: Inherits parent theme (no internal `ThemeProvider`)

---

### 3. Removed Hardcoded Colors

**Before:**
```tsx
backgroundColor: '#FAFAFA',
backgroundImage: `radial-gradient(circle, #E0E0E0 1px, transparent 1px)`,
```

**After:**
```tsx
backgroundColor: 'background.default',
backgroundImage: `radial-gradient(circle, ${alpha(theme.palette.divider, 0.5)} 1px, transparent 1px)`,
```

**Files Updated:**
- `Canvas.tsx`: Now uses `useTheme()` and theme tokens
- `KxAxisComposer.tsx`: Conditionally wraps with `ThemeProvider`

---

### 4. Adaptive Lane Colors

Lane header colors now adapt based on theme mode:

**Light Mode:**
```ts
['#E8F5E9', '#FFF9C4', '#E3F2FD', '#F3E5F5'] // Pastel tints
```

**Dark Mode:**
```ts
[
  alpha(theme.palette.success.main, 0.08),  // Dark green tint
  alpha(theme.palette.warning.main, 0.08),  // Dark yellow tint
  alpha(theme.palette.info.main, 0.08),     // Dark blue tint
  alpha(theme.palette.secondary.main, 0.08),// Dark purple tint
]
```

---

### 5. Bug Fixes

- Fixed TypeScript errors related to `industryCaptureRegistry` → `goalLensRegistry`
- Fixed optional chaining for `event.active.data.current`
- Removed unused imports (`Button`, `AddCircleOutlineIcon`, `capturesOpen`)
- Fixed `DragOverlay` children type (changed `null` to conditional render)
- Fixed `Snackbar` children type (conditional render when snackbar exists)

---

### 6. New Documentation

**Added:**
- `THEMING.md` - Comprehensive theming guide
- `INTEGRATION_EXAMPLE.md` - Step-by-step kx-forms-fe integration guide
- `CHANGELOG_THEMING.md` - This file

---

## Migration Guide

### Existing Users (No Breaking Changes)

If you're already using KxAxis, **nothing breaks**. The default behavior is unchanged:

```tsx
// This still works exactly as before
<KxAxisComposer
  initialConfig={flow}
  goalLensRegistry={lenses}
/>
```

---

### New Users Integrating with Existing Apps

To use your app's existing theme:

```tsx
import { ThemeProvider } from '@mui/material';
import myTheme from './theme';
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';

<ThemeProvider theme={myTheme}>
  <KxAxisComposer
    disableThemeProvider={true}  // ← Add this
    initialConfig={flow}
    goalLensRegistry={lenses}
  />
</ThemeProvider>
```

---

### Custom Theme Without Parent Provider

To use a custom theme without setting up a parent ThemeProvider:

```tsx
import { KxAxisComposer, kxgryndeTheme } from '@toldyaonce/kx-axis-fe';

<KxAxisComposer
  theme={kxgryndeTheme}  // ← Use pre-built or custom theme
  initialConfig={flow}
  goalLensRegistry={lenses}
/>
```

---

## Technical Details

### Theme Token Usage

All colors now use MUI theme tokens:

| Component | Token Used |
|-----------|------------|
| Canvas background | `background.default` |
| Canvas dot grid | `alpha(theme.palette.divider, 0.5)` |
| Node cards | `background.paper` |
| Text | `text.primary`, `text.secondary` |
| Dividers | `divider` |
| Lane tints | Adaptive based on mode |
| Primary actions | `primary.main` |

---

### Node Colors

Node type colors (EXPLANATION, GOAL_GAP_TRACKER, etc.) remain as semantic constants in `NodeCard.tsx`:

```ts
const NODE_COLORS: Record<NodeKind, string> = {
  EXPLANATION: '#50C878',         // Green
  REFLECTIVE_QUESTION: '#F5A623', // Orange
  GOAL_DEFINITION: '#4A90E2',     // Blue
  // ... etc
};
```

**Future Enhancement:** These may become theme-customizable via `theme.palette.nodeTypes`.

---

## Testing

Tested with:
- ✅ Default light theme
- ✅ KxGrynde theme (dark cards on light background)
- ✅ Parent theme inheritance (`disableThemeProvider={true}`)
- ✅ Dark mode support (lane colors adapt)
- ✅ kx-forms-fe integration scenario

---

## Breaking Changes

**None.** This is a backward-compatible enhancement.

---

## Next Steps

### For Users
1. Read [`THEMING.md`](./THEMING.md) for customization options
2. Try `kxgryndeTheme` if you want bold, high-contrast UI
3. Integrate with your existing app using `disableThemeProvider`

### For Contributors
- Consider making node colors theme-customizable
- Add theme variants (e.g., `darkTheme`, `highContrastTheme`)
- Document custom theme creation patterns

---

## Credits

Theme system designed to support integration with `kx-forms-fe` dark-card-on-light-background aesthetic.

---

## Questions?

See:
- [`THEMING.md`](./THEMING.md) - Theming guide
- [`INTEGRATION_EXAMPLE.md`](./INTEGRATION_EXAMPLE.md) - Integration example
- [`USAGE.md`](./USAGE.md) - API reference




