# Theme Demo Guide 🎨

Your demo app is now set up to showcase both theme options!

---

## 🚀 Running the Demo

The dev server is running at: **http://localhost:5175/**

---

## 🎨 Theme Toggle

Click the **palette icon** (🎨) in the top bar to switch between themes:

### **KxGrynde Theme** (Default in demo)
- 🖤 **Jet black cards** on light gray background
- 🟢 **Dark lime green** primary color
- 🔴 **Magenta** accents
- 💪 **Bold, high-contrast** aesthetic
- 📝 **'Oswald' + 'Inter Tight'** fonts

**Perfect for:**
- Modern, aggressive UIs
- High-contrast requirements
- Matching kx-forms-fe style

---

### **Default Light Theme**
- ⚪ **White cards** on soft gray background
- 🔵 **Standard blue** accents
- 🧘 **Calm, minimal** aesthetic
- 📝 **'Inter' + 'Roboto'** fonts

**Perfect for:**
- Enterprise apps
- Professional, conservative UIs
- Standard MUI look and feel

---

## 🧪 What to Test

### Visual Consistency
1. **Toggle themes** - Everything should adapt instantly
2. **Node cards** - Check card backgrounds (black vs white)
3. **Lane headers** - Pastel tints should work with both themes
4. **Text readability** - All text should be legible
5. **Drag & drop** - Overlay should respect theme

### Components to Check
- ✅ Canvas background and dot grid
- ✅ Node card backgrounds and borders
- ✅ Lane header backgrounds
- ✅ Inspector panel (right side)
- ✅ Left palette panel
- ✅ Top bar
- ✅ Drag overlay appearance

---

## 💡 For Consuming Apps

When you integrate into kx-forms-fe, you have 3 options:

### **Option 1: Inherit Parent Theme** ⭐ Recommended
```tsx
<ThemeProvider theme={myTheme}>
  <KxAxisComposer disableThemeProvider={true} {...props} />
</ThemeProvider>
```

### **Option 2: Use KxGrynde Theme**
```tsx
import { kxgryndeTheme } from '@toldyaonce/kx-axis-fe';
<KxAxisComposer theme={kxgryndeTheme} {...props} />
```

### **Option 3: Use Default Light Theme**
```tsx
<KxAxisComposer {...props} />  // Uses defaultLightTheme automatically
```

---

## 🎯 Key Benefits

1. **Zero config** - Works out of the box
2. **Fully customizable** - Pass any MUI theme
3. **Theme-aware** - All colors use theme tokens
4. **No hardcoded colors** - Everything adapts
5. **Dark mode ready** - Lane colors auto-adapt

---

## 🔍 Technical Details

### What Changed
All hardcoded colors replaced with theme tokens:

| Before | After |
|--------|-------|
| `backgroundColor: '#FAFAFA'` | `backgroundColor: 'background.default'` |
| `color: '#212121'` | `color: 'text.primary'` |
| Fixed lane colors | Adaptive based on theme mode |

### Lane Color Logic
```tsx
const laneColors = theme.palette.mode === 'dark' 
  ? [alpha(success, 0.08), alpha(warning, 0.08), ...]  // Dark mode
  : ['#E8F5E9', '#FFF9C4', '#E3F2FD', '#F3E5F5'];    // Light mode
```

---

## 🎨 Customizing Themes

### Create Your Own Theme
```tsx
import { createTheme } from '@mui/material';
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';

const myTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#YOUR_PRIMARY' },
    background: {
      default: '#YOUR_BG',
      paper: '#YOUR_CARDS',
    },
    text: {
      primary: '#YOUR_TEXT',
      secondary: '#YOUR_SECONDARY_TEXT',
    },
  },
  typography: {
    fontFamily: "'Your Font', sans-serif",
  },
});

<KxAxisComposer theme={myTheme} {...props} />
```

---

## 📚 More Info

- See [`THEMING.md`](./THEMING.md) for full theming guide
- See [`INTEGRATION_EXAMPLE.md`](./INTEGRATION_EXAMPLE.md) for integration steps
- See [`THEME_INTEGRATION_SUMMARY.md`](./THEME_INTEGRATION_SUMMARY.md) for overview

---

## 🎉 Ready to Test!

1. Open **http://localhost:5175/**
2. Click the **palette icon** (🎨) to toggle themes
3. Try both Design Mode and Execution Mode
4. Drag nodes, create items, test interactions
5. See how everything adapts to each theme

**Have fun exploring!** 🚀




