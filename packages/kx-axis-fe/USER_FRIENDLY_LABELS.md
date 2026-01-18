# User-Friendly Display Labels for Node References

## Issue
In the Node Inspector, the "Must know before" section was showing raw node IDs like:
- `book-consultation-1768740813608`
- `contact-1768740813509`
- `goal-gap-1768740813410`

This was confusing for users who expect to see human-readable names like:
- `Book Consultation`
- `Contact Capture`
- `Goal Gap Tracker`

## Solution
Added a `getDisplayLabel` prop to `ChipListEditor` component that maps internal values (IDs) to user-friendly display labels (titles) while preserving the actual IDs for backend operations.

---

## Changes Made

### **1. ChipListEditor Component (`src/components/shared/ChipListEditor.tsx`)**

#### **Added Prop:**
```typescript
interface ChipListEditorProps {
  // ... existing props ...
  getDisplayLabel?: (value: string) => string; // Map value to user-friendly display label
}
```

#### **Updated Chip Rendering:**
```typescript
// Before:
<Chip label={value} />

// After:
<Chip label={getDisplayLabel ? getDisplayLabel(value) : value} />
```

---

### **2. SimplifiedNodeInspector Component (`src/components/Inspector/SimplifiedNodeInspector.tsx`)**

#### **Added Helper Function:**
```typescript
// Helper to get user-friendly display label for node IDs
const getNodeDisplayLabel = (nodeId: string): string => {
  const foundNode = flow.nodes.find((n) => n.id === nodeId);
  return foundNode?.title || nodeId; // Fallback to ID if node not found
};
```

#### **Passed to ChipListEditor:**
```typescript
<ChipListEditor
  label="Must know before"
  values={node.requires || []}
  // ... other props ...
  getDisplayLabel={getNodeDisplayLabel} // ← NEW
/>
```

---

## How It Works

### **Before:**
```
┌─────────────────────────────────────┐
│ Must know before                    │
├─────────────────────────────────────┤
│ [book-consultation-1768740813608 ×] │ ← Raw ID (confusing!)
└─────────────────────────────────────┘
```

### **After:**
```
┌─────────────────────────────────────┐
│ Must know before                    │
├─────────────────────────────────────┤
│ [Book Consultation ×]               │ ← User-friendly title!
└─────────────────────────────────────┘
```

---

## Technical Details

### **Behind the Scenes:**
- **Stored:** Node ID (`book-consultation-1768740813608`)
- **Displayed:** Node title (`Book Consultation`)
- **Lookup:** `flow.nodes.find(n => n.id === nodeId)`

### **Fallback Behavior:**
If a node is deleted or not found, the display will fall back to showing the raw ID to prevent breaking the UI.

### **Performance:**
- Lookup happens during render (fast O(n) search)
- Could be optimized with a `useMemo` Map for large flows (100+ nodes)
- Current implementation is sufficient for typical flows (5-20 nodes)

---

## Benefits

### **User Experience:**
- ✅ **Clearer:** Users see recognizable names instead of cryptic IDs
- ✅ **Professional:** UI looks polished and production-ready
- ✅ **Intuitive:** No need to memorize or decode IDs
- ✅ **Consistent:** Titles match what users see in the canvas

### **Developer Experience:**
- ✅ **Reusable:** `getDisplayLabel` prop can be used for any ChipListEditor
- ✅ **Type-safe:** TypeScript ensures the mapping function is correct
- ✅ **Flexible:** Easy to add custom display logic (e.g., icons, badges)
- ✅ **Backward compatible:** Works without the prop (shows raw values)

---

## Usage Examples

### **Mapping Node IDs to Titles:**
```typescript
const getNodeDisplayLabel = (nodeId: string): string => {
  const node = flow.nodes.find((n) => n.id === nodeId);
  return node?.title || nodeId;
};

<ChipListEditor
  values={node.requires || []}
  getDisplayLabel={getNodeDisplayLabel}
/>
```

### **Custom Display Logic:**
```typescript
const getGateDisplayLabel = (gateId: string): string => {
  const gateMap = {
    CONTACT: '📧 Contact Info',
    BOOKING: '📅 Booking Complete',
    HANDOFF: '🤝 Handoff Done',
  };
  return gateMap[gateId] || gateId;
};

<ChipListEditor
  values={node.satisfies?.gates || []}
  getDisplayLabel={getGateDisplayLabel}
/>
```

### **Without Custom Display (Default):**
```typescript
// No getDisplayLabel prop = shows raw values
<ChipListEditor
  values={node.produces || []}
  // Shows: "email", "booking_date", etc. (already user-friendly)
/>
```

---

## Future Enhancements

### **Short-term:**
- Add tooltips showing full ID on hover (for debugging)
- Add icons/colors based on node type
- Optimize lookup with `useMemo` Map for large flows

### **Medium-term:**
- Add "Jump to node" button in chip (navigate to node on canvas)
- Show node status (completed, in-progress, blocked)
- Add preview of node details on hover

### **Long-term:**
- AI-powered suggestions based on node relationships
- Visual relationship graph showing dependencies
- Bulk operations on related nodes

---

## Testing Checklist

- [x] Node IDs display as titles in "Must know before" section
- [x] Clicking "×" removes the prerequisite correctly
- [x] Adding prerequisites works and displays titles
- [x] Fallback to ID if node not found
- [x] No TypeScript errors
- [x] No runtime errors

---

## Files Modified

1. **`src/components/shared/ChipListEditor.tsx`**
   - Added `getDisplayLabel` prop
   - Updated chip rendering to use custom label

2. **`src/components/Inspector/SimplifiedNodeInspector.tsx`**
   - Added `getNodeDisplayLabel` helper function
   - Passed function to ChipListEditor for "Must know before" section

---

## Notes

- Only "Must know before" (node.requires) uses this feature currently
- "Data captured" (node.produces) doesn't need it - those values are already user-friendly
- The internal logic still uses IDs - only the display changes
- Backward compatible: ChipListEditor works without `getDisplayLabel`

---

## Related Components

- `ChipListEditor` - Generic component for editing string arrays
- `SimplifiedNodeInspector` - Node details panel in the Inspector
- `Canvas` - Shows node cards with titles
- `ConversationItemsPalette` - Shows items with titles before adding


