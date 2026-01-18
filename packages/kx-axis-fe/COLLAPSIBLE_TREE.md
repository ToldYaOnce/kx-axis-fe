# Collapsible Execution Tree

## ✅ **IMPLEMENTED: Progressive Disclosure for Deep Trees**

The Execution Tree now supports intelligent collapsibility to maintain readability as conversation branches and depth increase.

---

## 🎯 **Core Principles**

1. **Coarse-grained collapsibility** - Not every node, only meaningful groupings
2. **Smart auto-collapse** - Deep structures start collapsed
3. **Auto-expand to selection** - Selected paths always visible
4. **Global controls** - Quick expand/collapse all

---

## 🔧 **Configuration Constants**

```typescript
LINEAR_FOLD_THRESHOLD = 6      // Fold linear runs longer than this
AUTO_COLLAPSE_DEPTH = 2        // Auto-collapse divergences deeper than this
LINEAR_FOLD_SHOW_EDGES = 2     // Show first N and last N in folded runs
```

---

## 📦 **Collapsible Elements**

### **A) Divergence Groups (Primary)**

**What:** Any node with multiple children (`children.length > 1`)

**Visual:**
- "N paths" badge becomes clickable
- Chevron icon (▶ collapsed, ▼ expanded)
- Collapsed state shows: "Collapsed: 3 paths • 8 turns hidden • Expand"

**Interaction:**
- Click badge or chevron to toggle
- Clicking anywhere in collapsed summary expands

**Auto-behavior:**
- Auto-collapse divergences at depth > 2
- Always keep selected path expanded

---

### **B) Linear Run Folding**

**What:** Straight-line segments (each node has exactly 1 child) longer than 6 nodes

**Visual (Collapsed):**
```
T1 [first node]
T2 [second node]
⋯ Show 7 more…
T10 [second-to-last]
T11 [last node]
```

**Visual (Expanded):**
```
T1 [first node]
  ⋯ Fold 11 turns  ← clickable to collapse
T2 [node]
T3 [node]
...
T11 [last node]
```

**Interaction:**
- Click "⋯ Show N more…" to expand
- Click "⋯ Fold N turns" to collapse
- Only first node shows fold control when expanded

---

## 🧠 **State Model**

```typescript
type CollapseKey = string; // 'diverge:nodeId' | 'linear:startNodeId'
const collapsed: Set<CollapseKey>;
```

**Key Formats:**
- Divergence: `diverge:${nodeId}`
- Linear run: `linear:${startNodeId}` (nodeId of first node in run)

**State is UI-only** - No backend changes required

---

## 🎮 **Global Controls**

Located in tree header:

### **Expand All** (⬍ icon)
- Expands all divergence groups
- Unfolds all linear runs
- Makes entire tree visible

### **Collapse All** (⬌ icon)
- Collapses all divergence groups (except ancestry to selected)
- Leaves linear runs unfolded by default
- Keeps active path visible

---

## 🔍 **Auto-Expand to Selection**

**Problem:** What if user selects a node inside a collapsed group?

**Solution:** Automatic expansion of ancestors

**Algorithm:**
1. Compute ancestry path from root to selected node
2. For each ancestor in path, check if its divergence is collapsed
3. If collapsed, expand it
4. Result: Selected node always visible

**Trigger:** `useEffect` on `selectedNodeId` change

---

## 📊 **Auto-Collapse on Mount**

**Problem:** Large trees overwhelming on first load

**Solution:** Progressive disclosure based on depth

**Algorithm:**
1. Traverse tree, tracking depth
2. For divergences at depth > AUTO_COLLAPSE_DEPTH:
   - If NOT in ancestry path → collapse
   - If in ancestry path → keep expanded
3. Result: Shallow structure visible, deep branches collapsed

**Trigger:** `useEffect` on tree structure change

---

## 🛠️ **Helper Functions**

### **isDivergence(node: TreeNode): boolean**
Returns `true` if node has multiple children

### **computeLinearRun(node: TreeNode): TreeNode[]**
Returns array of nodes in straight-line segment starting from `node`
Stops at first divergence or leaf

### **getAncestryPath(nodeId, nodeIndex): Set<string>**
Returns set of all node IDs from root to target node

### **countSubtreeTurns(node: TreeNode): number**
Returns total number of nodes in subtree (for "N turns hidden" display)

---

## 🎨 **Visual Design**

### **Divergence Badge**
```
[▼ icon] [3 paths]
         ↑ clickable chip with hover effect
```

### **Collapsed Summary**
```
┌─────────────────────────────────────────┐
│ Collapsed: 3 paths • 8 turns hidden •   │
│ Expand                                   │
└─────────────────────────────────────────┘
  ↑ Gray box, clickable, shows on hover
```

### **Linear Fold Indicator (Collapsed)**
```
┌────────────────┐
│ ⋯ Show 7 more… │
└────────────────┘
  ↑ Gray box, centered, clickable
```

### **Linear Fold Control (Expanded)**
```
⋯ Fold 11 turns
  ↑ Text link, gray → blue on hover
```

---

## 🧪 **Testing Scenarios**

### **Test 1: Divergence Collapse**
1. Load simulator with complex mock data
2. Navigate to T1 (divergence with 3 paths)
3. Click "3 paths" badge
4. **Verify:** Chevron changes, children hidden, collapsed summary shown
5. Click collapsed summary
6. **Verify:** Expands, children visible

---

### **Test 2: Auto-Collapse Deep**
1. Load simulator
2. **Verify:** First-level divergences expanded
3. **Verify:** Nested divergences (depth > 2) start collapsed
4. Click collapsed nested divergence
5. **Verify:** Expands correctly

---

### **Test 3: Auto-Expand to Selection**
1. Collapse a divergence group manually
2. Click a node deep inside that collapsed group in playback
3. **Verify:** Tree auto-expands to show selected node
4. **Verify:** Selected node scrolls into view (if applicable)

---

### **Test 4: Linear Run Folding**
1. Create a conversation with 10+ linear turns (no branching)
2. **Verify:** Shows first 2, fold indicator, last 2
3. Click "Show N more…"
4. **Verify:** Expands to show all turns
5. **Verify:** First node shows "Fold N turns" control
6. Click "Fold N turns"
7. **Verify:** Collapses back to first 2 + last 2

---

### **Test 5: Global Expand All**
1. Manually collapse several divergences
2. Click "Expand All" (⬍ icon) in header
3. **Verify:** All divergences expand
4. **Verify:** All linear folds expand

---

### **Test 6: Global Collapse All**
1. Expand all manually
2. Select a deep node
3. Click "Collapse All" (⬌ icon) in header
4. **Verify:** All divergences collapse except ancestry to selected
5. **Verify:** Selected node remains visible

---

## 📈 **Performance Considerations**

### **State Updates**
- `collapsed` is a `Set` for O(1) lookups
- Keys are stable across renders (based on nodeId)
- No unnecessary re-renders

### **Memoization**
- `nodeIndex` memoized with `useMemo`
- `ancestryPath` recomputed only when selection changes
- Tree roots built once per tree structure change

### **Recursive Rendering**
- Early returns for collapsed groups (skip subtree rendering)
- Linear runs computed once per render of that segment
- No expensive operations in render loop

---

## 🚀 **Future Enhancements (Optional)**

### **Branch Root Collapsibility**
Currently not implemented, but could add:
- Clickable branch labels (e.g., "Alt: 'I want to bench 300 lbs'")
- Collapse entire alternate branch
- Key format: `branch:${branchId}`

### **Persistence**
- Save collapsed state to localStorage
- Restore on page reload
- Key: `collapsed_${runId}`

### **Keyboard Shortcuts**
- `E` - Expand all
- `C` - Collapse all
- `Space` - Toggle selected divergence

### **Animation**
- Smooth expand/collapse transitions
- Fade in/out for collapsed summaries
- Slide animation for linear folds

---

## ✅ **Implementation Status**

**Core Features:** ✅ Complete
- ✅ Divergence group collapse/expand
- ✅ Linear run folding
- ✅ Auto-collapse by depth
- ✅ Auto-expand to selection
- ✅ Global Expand/Collapse All
- ✅ Clickable badges and chevrons
- ✅ Collapsed state summaries
- ✅ Turn count in collapsed groups

**Future Enhancements:** 🔄 Optional
- ⬜ Branch root collapsibility
- ⬜ Persistence to localStorage
- ⬜ Keyboard shortcuts
- ⬜ Expand/collapse animations

---

## 📁 **Files Modified**

1. **`ExecutionTree.tsx`**
   - Added collapse state management
   - Updated `renderNode` for divergence collapse
   - Added linear run folding logic
   - Added global Expand/Collapse All controls
   - Added helper functions (isDivergence, computeLinearRun, etc.)

---

**Date:** 2026-01-12  
**Status:** ✅ Complete  
**Complexity:** Medium-High  
**Lines Changed:** ~200  
**New Dependencies:** None (uses existing MUI icons)



