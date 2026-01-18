# Integration Example: kx-axis-fe → kx-forms-fe

This guide shows how to integrate the KxAxis Composer into your existing kx-forms-fe project.

## Prerequisites

Your kx-forms-fe project already has:
- ✅ MUI v5 with ThemeProvider
- ✅ Custom theme (`C:\projects\KxGrynde\kx-forms-fe\src\theme.ts`)
- ✅ React 18+
- ✅ TypeScript

---

## Step 1: Install Package

```bash
cd C:\projects\KxGrynde\kx-forms-fe
npm install @toldyaonce/kx-axis-fe
```

Or if using a local workspace:

```json
// In kx-forms-fe/package.json
{
  "dependencies": {
    "@toldyaonce/kx-axis-fe": "file:../kx-axis-fe/packages/kx-axis-fe"
  }
}
```

---

## Step 2: Basic Integration (Use Parent Theme)

```tsx
// In your kx-forms-fe component (e.g., ConversationFlowPage.tsx)
import React from 'react';
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';
import type { ConversationFlow, GoalLensRegistry } from '@toldyaonce/kx-axis-fe';

// Your existing kx-forms-fe already has ThemeProvider at the root level
// KxAxis will inherit that theme automatically

export function ConversationFlowPage() {
  const [flow, setFlow] = React.useState<ConversationFlow>({
    id: 'flow-1',
    name: 'Fitness Onboarding',
    description: 'Goal-based fitness intake flow',
    nodes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const lensRegistry: GoalLensRegistry = {
    industry: 'Fitness',
    lenses: [
      // Your goal lenses here
    ],
  };

  const handleFlowChange = (updatedFlow: ConversationFlow) => {
    setFlow(updatedFlow);
    // Optionally sync to backend
  };

  return (
    <KxAxisComposer
      initialConfig={flow}
      goalLensRegistry={lensRegistry}
      onChange={handleFlowChange}
      disableThemeProvider={true}  // ← Key: Use parent theme from kx-forms-fe
    />
  );
}
```

---

## Step 3: Theme Compatibility

Your kx-forms-fe theme uses:
- **Background**: `#F6F7F8` (light gray)
- **Paper**: `#1B1B1B` (jet black - dark cards)
- **Primary**: `#5F9F10` (dark lime green)
- **Secondary**: `#FF0059` (magenta)

KxAxis will automatically adapt to these colors because:
- Canvas uses `theme.palette.background.default`
- Cards use `theme.palette.background.paper`
- Lane headers use adaptive alpha blending
- All dividers use `theme.palette.divider`

**Result:** Dark cards on light background - visually striking! ✨

---

## Step 4: Full-Page Integration

```tsx
// In kx-forms-fe/src/pages/ConversationFlowPage.tsx
import { Box } from '@mui/material';
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';

export function ConversationFlowPage() {
  return (
    <Box sx={{ height: '100vh', width: '100vw' }}>
      <KxAxisComposer
        initialConfig={myFlow}
        goalLensRegistry={myLenses}
        disableThemeProvider={true}
        onChange={(flow) => console.log('Flow updated:', flow)}
        onPublish={(flow) => {
          // Save to backend
          fetch('/api/flows', {
            method: 'POST',
            body: JSON.stringify(flow),
          });
        }}
      />
    </Box>
  );
}
```

---

## Step 5: Route Setup

```tsx
// In kx-forms-fe/src/App.tsx or router config
import { ConversationFlowPage } from './pages/ConversationFlowPage';

// Add route
<Route path="/conversation-flow" element={<ConversationFlowPage />} />
```

---

## Alternative: Use KxGrynde Pre-built Theme

If you want KxAxis to have its own isolated theme that matches kx-forms-fe:

```tsx
import { KxAxisComposer, kxgryndeTheme } from '@toldyaonce/kx-axis-fe';

<KxAxisComposer
  theme={kxgryndeTheme}  // ← Uses pre-built KxGrynde theme
  initialConfig={flow}
  goalLensRegistry={lenses}
/>
```

**Note:** This creates an isolated theme just for KxAxis, which can be useful if you want to experiment with different styles without affecting the rest of your app.

---

## Troubleshooting

### Cards are white instead of dark

**Problem:** Cards appear white instead of jet black.

**Solution:** Ensure `disableThemeProvider={true}` is set and your parent `ThemeProvider` wraps the `KxAxisComposer`.

```tsx
// In kx-forms-fe/src/App.tsx
import theme from './theme';

<ThemeProvider theme={theme}>
  <KxAxisComposer disableThemeProvider={true} {...props} />
</ThemeProvider>
```

---

### Typography looks different

**Problem:** Font family doesn't match.

**Solution:** Your kx-forms-fe theme uses 'Inter Tight' and 'Oswald'. KxAxis will inherit these automatically when `disableThemeProvider={true}` is set.

---

### Lane colors are too subtle

**Problem:** Lane headers don't have enough contrast.

**Solution:** KxAxis adapts lane colors based on `theme.palette.mode`. Since your theme is light mode, it uses pastel lane tints. These should work well with your dark cards. If you want to customize, you can override in your theme:

```tsx
// In kx-forms-fe/src/theme.ts
components: {
  MuiBox: {
    styleOverrides: {
      root: {
        // Custom overrides if needed
      }
    }
  }
}
```

---

## Expected Visual Result

With your kx-forms-fe theme, KxAxis will render:
- **Canvas background**: Soft gray (`#F6F7F8`)
- **Node cards**: Jet black (`#1B1B1B`) with white text
- **Lane headers**: Pastel tints (green, yellow, blue, purple)
- **Primary actions**: Dark lime green (`#5F9F10`)
- **Accents**: Magenta (`#FF0059`)

This creates a **bold, high-contrast** interface that stands out! 🚀

---

## Next Steps

1. ✅ Integrate into kx-forms-fe
2. Define your `GoalLensRegistry` for your industry
3. Set up backend endpoints for flow persistence
4. Test with real conversation data
5. Deploy!

---

## Questions?

- Check [`THEMING.md`](./THEMING.md) for advanced theming options
- Check [`USAGE.md`](./USAGE.md) for API reference
- Open an issue if you encounter integration problems

---

## Working Example

```tsx
// Complete working example for kx-forms-fe
import React from 'react';
import { ThemeProvider } from '@mui/material';
import theme from './theme'; // Your existing kx-forms-fe theme
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';
import type { ConversationFlow, GoalLensRegistry } from '@toldyaonce/kx-axis-fe';

function App() {
  const flow: ConversationFlow = {
    id: 'flow-1',
    name: 'Fitness Onboarding',
    description: 'Adaptive fitness goal capture',
    nodes: [
      {
        id: 'welcome',
        kind: 'EXPLANATION',
        title: 'Welcome & Introduction',
        purpose: 'Greet user and explain coaching approach',
      },
      {
        id: 'capture-contact',
        kind: 'BASELINE_CAPTURE',
        title: 'Capture Contact',
        produces: ['contact_email', 'contact_phone'],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const lenses: GoalLensRegistry = {
    industry: 'Fitness',
    lenses: [
      {
        id: 'strength-pr',
        name: 'Strength PR',
        description: 'Hit a new personal record on a compound lift',
        industry: 'Fitness',
        metricBundle: {
          baselineMetrics: [
            { id: 'current_lift', name: 'Current Max', dataType: 'number', required: true },
          ],
          targetMetrics: [
            { id: 'target_lift', name: 'Target Max', dataType: 'number', required: true },
          ],
          deadlinePolicy: 'EXACT_DATE',
        },
      },
    ],
  };

  return (
    <ThemeProvider theme={theme}>
      <KxAxisComposer
        initialConfig={flow}
        goalLensRegistry={lenses}
        disableThemeProvider={true}
        onChange={(updatedFlow) => {
          console.log('Flow changed:', updatedFlow);
        }}
        onPublish={(finalFlow) => {
          console.log('Publishing flow:', finalFlow);
          // POST to your backend
        }}
      />
    </ThemeProvider>
  );
}

export default App;
```

That's it! 🎉



