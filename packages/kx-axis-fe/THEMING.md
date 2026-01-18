# Theming Guide for KxAxis Composer

The KxAxis Composer supports full MUI theme customization, allowing you to integrate it seamlessly with your existing application theme.

## Table of Contents
- [Quick Start](#quick-start)
- [Using Parent Theme](#using-parent-theme)
- [Custom Theme](#custom-theme)
- [Pre-built Themes](#pre-built-themes)
- [Integration Examples](#integration-examples)

---

## Quick Start

### Default Theme (Out of the Box)

```tsx
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';

// Uses built-in light theme automatically
<KxAxisComposer
  initialConfig={myFlow}
  goalLensRegistry={myLenses}
/>
```

---

## Using Parent Theme

If your app already has a MUI `ThemeProvider`, you can disable KxAxis's internal theme provider:

```tsx
import { ThemeProvider } from '@mui/material';
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';
import myAppTheme from './theme';

<ThemeProvider theme={myAppTheme}>
  <KxAxisComposer
    initialConfig={myFlow}
    goalLensRegistry={myLenses}
    disableThemeProvider={true}  // ← Inherits parent theme
  />
</ThemeProvider>
```

**When to use:**
- ✅ You want KxAxis to match your app's existing theme
- ✅ You already have a `ThemeProvider` at root level
- ✅ You need consistent styling across your entire app

---

## Custom Theme

### Option 1: Pass a Theme Prop

```tsx
import { createTheme } from '@mui/material';
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';

const myTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#A6E22E' },
    background: {
      default: '#1B1B1B',
      paper: '#2B2B2B',
    },
  },
});

<KxAxisComposer
  theme={myTheme}
  initialConfig={myFlow}
  goalLensRegistry={myLenses}
/>
```

### Option 2: Use createKxAxisTheme Helper

```tsx
import { createKxAxisTheme, KxAxisComposer } from '@toldyaonce/kx-axis-fe';

const myTheme = createKxAxisTheme({
  palette: {
    primary: { main: '#FF0059' },
    secondary: { main: '#A6E22E' },
  },
});

<KxAxisComposer theme={myTheme} {...props} />
```

---

## Pre-built Themes

### 1. Default Light Theme

```tsx
import { defaultLightTheme, KxAxisComposer } from '@toldyaonce/kx-axis-fe';

<KxAxisComposer theme={defaultLightTheme} {...props} />
```

**Colors:**
- Background: `#FAFAFA` (soft gray)
- Paper: `#FFFFFF` (white cards)
- Text: `#212121` (dark gray)
- Divider: `#E0E0E0` (light gray)

**Best for:** Clean, minimal, professional interfaces

---

### 2. KxGrynde Theme

```tsx
import { kxgryndeTheme, KxAxisComposer } from '@toldyaonce/kx-axis-fe';

<KxAxisComposer theme={kxgryndeTheme} {...props} />
```

**Colors:**
- Background: `#F6F7F8` (light gray background)
- Paper: `#1B1B1B` (jet black cards - high contrast!)
- Primary: `#5F9F10` (dark lime green)
- Secondary: `#FF0059` (magenta accent)
- Text: Dark on light background, lime green accents

**Best for:** Bold, high-contrast, modern designs with striking visual hierarchy

---

## Integration Examples

### Example 1: kx-forms-fe Integration

If you're integrating into an existing project like `kx-forms-fe`:

```tsx
// In your kx-forms-fe app
import { ThemeProvider } from '@mui/material';
import theme from './theme'; // Your existing theme
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* Your existing app UI */}
      <KxAxisComposer
        disableThemeProvider={true}  // Use parent theme
        initialConfig={conversationFlow}
        goalLensRegistry={lenses}
      />
    </ThemeProvider>
  );
}
```

---

### Example 2: Dark Mode Support

```tsx
import { createTheme, ThemeProvider } from '@mui/material';
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';
import { useMemo, useState } from 'react';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: { main: darkMode ? '#A6E22E' : '#5F9F10' },
          background: {
            default: darkMode ? '#121212' : '#FAFAFA',
            paper: darkMode ? '#1E1E1E' : '#FFFFFF',
          },
        },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <button onClick={() => setDarkMode(!darkMode)}>
        Toggle Dark Mode
      </button>
      <KxAxisComposer
        disableThemeProvider={true}
        {...props}
      />
    </ThemeProvider>
  );
}
```

---

### Example 3: Multi-Tenant Theming

```tsx
import { kxgryndeTheme, defaultLightTheme } from '@toldyaonce/kx-axis-fe';

const TENANT_THEMES = {
  acme: kxgryndeTheme,
  default: defaultLightTheme,
};

function TenantApp({ tenantId }) {
  const theme = TENANT_THEMES[tenantId] || TENANT_THEMES.default;

  return (
    <KxAxisComposer
      theme={theme}
      {...props}
    />
  );
}
```

---

## Customizing Node Colors

Node type colors are currently hardcoded for semantic consistency. To customize:

```tsx
// This feature is coming soon - for now, node colors are fixed:
// EXPLANATION: Green
// REFLECTIVE_QUESTION: Orange
// GOAL_DEFINITION: Blue
// BASELINE_CAPTURE: Blue
// DEADLINE_CAPTURE: Purple
// GOAL_GAP_TRACKER: Pink
// ACTION_BOOKING: Slate blue
// HANDOFF: Red
```

**Note:** Future versions will support theme-based node color customization via `theme.palette.nodeTypes`.

---

## API Reference

### KxAxisComposerProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `Theme \| undefined` | `defaultLightTheme` | Custom MUI theme object |
| `disableThemeProvider` | `boolean` | `false` | If `true`, won't wrap in `ThemeProvider` (inherits parent theme) |

### Exported Themes

| Export | Description |
|--------|-------------|
| `defaultLightTheme` | Clean, minimal light theme (default) |
| `kxgryndeTheme` | Bold, high-contrast theme with dark cards |
| `createKxAxisTheme(options)` | Helper to create custom themes |

---

## Troubleshooting

### Theme Not Applying

**Problem:** Changes to theme aren't visible.

**Solution:** 
1. Check if `disableThemeProvider={true}` is set - this means you need a parent `ThemeProvider`
2. Ensure MUI's `CssBaseline` is included (KxAxis includes it by default)
3. Clear browser cache and hard refresh

### Dark Mode Issues

**Problem:** Some elements look wrong in dark mode.

**Solution:**
- Ensure `palette.mode: 'dark'` is set in your theme
- Consider using `kxgryndeTheme` as a starting point for dark/high-contrast designs
- Some components may need explicit color overrides in `theme.components`

### Conflicting Styles

**Problem:** Parent app styles conflict with KxAxis styles.

**Solution:**
- Use `disableThemeProvider={true}` and provide a merged theme at the parent level
- Use CSS modules or scoped styles for your app components
- Consider using MUI's `sx` prop for component-level overrides

---

## Best Practices

1. **Use `disableThemeProvider`** when integrating into existing apps
2. **Test with both light and dark modes** if your app supports theme switching
3. **Keep node colors consistent** across your app for user familiarity
4. **Use theme tokens** (e.g., `theme.palette.primary.main`) instead of hardcoded colors
5. **Provide fallbacks** for custom theme properties

---

## Feedback

Theme customization issues? [Open an issue](https://github.com/toldyaonce/kx-axis-fe/issues) or contribute to the project!



