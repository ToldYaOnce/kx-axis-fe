# User Turn Composer Visibility Fix

## Problem
The User Turn Composer (textbox for typing messages) was being cut off by the browser window and not visible to users.

## Root Cause
CSS flexbox layout issues causing the composer to render below the visible viewport:
1. Parent containers not properly constraining to viewport height
2. Missing `minHeight: 0` on flex children (prevents proper shrinking)
3. Composer not marked as `flexShrink: 0` (was being squeezed out)

## Fixes Applied

### 1. ExecutionMode Container (`ExecutionMode.tsx`)

**Before:**
```typescript
<Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
```

**After:**
```typescript
<Box sx={{ 
  height: '100%',  // Changed from 100vh to 100% to respect parent
  display: 'flex', 
  flexDirection: 'column',
  overflow: 'hidden'
}}>
```

**Why:** ExecutionMode is already inside a flex container (`DemoApp`), so it should fill its parent rather than the entire viewport.

---

### 2. Playback Root Container (`Playback.tsx`)

**Added:**
```typescript
<Box sx={{ 
  flex: 1, 
  display: 'flex', 
  flexDirection: 'column', 
  minHeight: 0  // ← Critical: allows flex child to shrink
}}>
```

**Why:** Without `minHeight: 0`, flex children default to `min-height: auto`, which prevents them from shrinking below their content size.

---

### 3. Conversation History Area

**Added:**
```typescript
<Box sx={{
  flex: 1,
  overflowY: 'auto',
  p: 2,
  backgroundColor: '#ffffff',
  minHeight: 0,  // ← Allows scrolling to work properly
}}>
```

**Why:** The scrollable area needs `minHeight: 0` to actually scroll instead of expanding.

---

### 4. User Input Composer (Critical Fix)

**Final Implementation:**
```typescript
const renderComposer = () => (
  <Box
    sx={{
      borderTop: '2px solid',  // Debug: highly visible blue border
      borderColor: 'primary.main',
      p: 2,
      backgroundColor: '#f0f0f0',  // Debug: gray background
      flexShrink: 0,  // ← CRITICAL: prevents being squeezed out
      minHeight: 100,  // ← CRITICAL: ensures visibility
      maxHeight: 150,
    }}
  >
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
      <TextField
        fullWidth
        multiline
        maxRows={3}
        placeholder="Type as the lead…"
        // ... other props
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'white',  // Debug: white input background
          }
        }}
      />
      <Button
        variant="contained"
        endIcon={<SendIcon />}
        // ... other props
        sx={{ minWidth: 140, height: 40 }}
      >
        {isSending ? 'Sending...' : (isLeafNode() ? 'Send' : 'Fork & Send')}
      </Button>
    </Box>
  </Box>
);
```

**Key Properties:**
- ✅ `flexShrink: 0` → Never gets squeezed out by flex layout
- ✅ `minHeight: 100` → Always takes up space
- ✅ `maxHeight: 150` → Doesn't grow too large
- ✅ Gray background + blue border → Highly visible for debugging
- ✅ White input field → Stands out visually

---

### 5. Always Render Composer (Even Without Run)

**Change:** Composer now renders even when `!currentRun`

**Before:** Early return with just a message
```typescript
if (!currentRun) {
  return (
    <Box>
      <Typography>Start a simulation to begin playback</Typography>
    </Box>
  );
}
```

**After:** Composer always renders (but disabled when no run)
```typescript
if (!currentRun) {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ flex: 1, /* ... */ }}>
        <Typography>Start a simulation to begin playback</Typography>
      </Box>
      {renderComposer()}  // ← Still renders, but disabled
    </Box>
  );
}
```

**Why:** Makes debugging easier and ensures the layout is always consistent.

---

## Visual Changes (Debug Mode)

To make the composer **impossible to miss**, we applied temporary debug styling:

| Element | Debug Style | Purpose |
|---------|-------------|---------|
| Composer Container | `backgroundColor: '#f0f0f0'` (gray) | Highly visible background |
| Top Border | `borderTop: '2px solid primary.main'` (blue) | Clear visual separator |
| Min Height | `minHeight: 100` | Guarantees presence in viewport |
| Text Field | `backgroundColor: 'white'` | Stands out against gray |
| Button | `height: 40` | Fixed height for consistency |

---

## Layout Hierarchy

```
DemoApp (height: 100vh)
├── Mode Toggle (fixed height)
└── Content Area (flex: 1, overflow: hidden)
    └── ExecutionMode (height: 100%, overflow: hidden)
        ├── ScenarioBar (fixed height)
        └── Main Content (flex: 1, minHeight: 0)
            ├── ExecutionTree (280px)
            ├── Playback (flex: 1, minHeight: 0)
            │   ├── History (flex: 1, minHeight: 0, overflowY: auto)
            │   └── Composer (flexShrink: 0, minHeight: 100) ← FIXED
            └── ReadinessPanel (320px)
```

---

## Testing Checklist

After refresh, verify:

- [ ] Gray bar appears at bottom of center panel
- [ ] Blue border visible above gray bar
- [ ] White text input field visible
- [ ] "Type as the lead…" placeholder visible
- [ ] Blue "Send" button visible on right
- [ ] Composer stays fixed when scrolling history
- [ ] Can type in the text field
- [ ] Button enables when text is entered
- [ ] Button changes to "Fork & Send" when selecting past turn

---

## Debug Steps (If Still Not Visible)

1. **Open Browser DevTools** (F12)
2. **Inspect Element** on the center panel
3. **Search for** `"Type as the lead"` in HTML
4. **Check computed styles** on the composer Box
5. **Look for:**
   - `display: flex` ✅
   - `flexShrink: 0` ✅
   - `minHeight: 100px` ✅
   - `backgroundColor: rgb(240, 240, 240)` ✅
6. **Check parent containers:**
   - All should have `minHeight: 0` or `overflow: hidden`
7. **Verify no `display: none` or `visibility: hidden`**

---

## Files Modified

| File | Changes |
|------|---------|
| `ExecutionMode.tsx` | Changed container height from `100vh` to `100%` |
| `Playback.tsx` | Added `minHeight: 0`, `flexShrink: 0`, debug styling, always-render logic |

---

## Next Steps

Once visibility is confirmed:

1. ✅ Test typing and sending messages
2. ✅ Test fork behavior from past turns
3. ⚠️ Remove debug styling (gray background, blue border)
4. ⚠️ Reduce `minHeight` to `80` for production
5. ⚠️ Change `backgroundColor` to `background.paper`
6. ⚠️ Change `borderColor` to `divider`

---

## Success Criteria

✅ User can see textbox at bottom of center panel
✅ User can type messages
✅ Button changes label based on context
✅ Composer never gets cut off or hidden
✅ Composer stays visible while scrolling history
✅ Layout works on all viewport sizes

**The composer should now be IMPOSSIBLE to miss!** 🎯




