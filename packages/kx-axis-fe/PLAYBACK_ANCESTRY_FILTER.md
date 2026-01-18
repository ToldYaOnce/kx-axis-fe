# Playback Ancestry Filtering

## ✅ **IMPLEMENTED: Path-Specific Playback**

The Playback component now shows **only the ancestry chain** of the selected node, not sibling branches.

---

## 🎯 **Problem Solved**

### **Before (BROKEN):**
When selecting one T2 in a divergence:
```
Tree (left):
  T1 (divergence)
    ├─ T2 "I want to bench 300 lbs"  ← Selected
    └─ T2 "Different reply"

Playback (center):
  T1: Agent message
  T2: "I want to bench 300 lbs"     ← Shows selected
  T2: "Different reply"              ← Also shows sibling! ❌
```

**Problem:** Playback showed **both paths**, confusing which one was selected.

---

### **After (FIXED):**
When selecting one T2 in a divergence:
```
Tree (left):
  T1 (divergence)
    ├─ T2 "I want to bench 300 lbs"  ← Selected
    └─ T2 "Different reply"

Playback (center):
  T1: Agent message
  T2: "I want to bench 300 lbs"     ← Only shows selected path ✅
```

**Solution:** Playback shows **only the ancestry chain** leading to the selected node.

---

## 🏗️ **Implementation**

### **Ancestry Chain Algorithm**

```typescript
const nodes = useMemo(() => {
  if (!currentRun || !selectedNodeId) return [];
  
  // Step 1: Build ancestry chain from selected node back to root
  const ancestryChain: string[] = [];
  let currentNodeId: string | null = selectedNodeId;
  
  while (currentNodeId) {
    ancestryChain.unshift(currentNodeId);  // Add to beginning
    const node = currentRun.nodes.find(n => n.nodeId === currentNodeId);
    currentNodeId = node?.parentNodeId || null;  // Move to parent
  }
  
  // Step 2: Filter nodes to only include those in ancestry chain
  return currentRun.nodes
    .filter(n => ancestryChain.includes(n.nodeId))
    .sort((a, b) => ancestryChain.indexOf(a.nodeId) - ancestryChain.indexOf(b.nodeId));
}, [currentRun, selectedNodeId]);
```

---

## 📊 **Example**

### **Tree Structure:**
```
node-1 (root)
  ├─ node-2 (user: "I want to bench 300 lbs")
  │    └─ node-3 (agent: "Nice! 300...")
  └─ node-4 (user: "I want to lose weight")
       └─ node-5 (agent: "Perfect! Weight loss...")
```

### **When node-3 is selected:**

**Ancestry Chain:**
```typescript
[
  'node-1',  // root (parentNodeId = null)
  'node-2',  // parent of node-3
  'node-3'   // selected node
]
```

**Filtered Nodes (shown in Playback):**
```typescript
[
  { nodeId: 'node-1', ... },
  { nodeId: 'node-2', ... },
  { nodeId: 'node-3', ... }
]
// node-4 and node-5 are NOT included (sibling branch)
```

**Visual Result:**
```
T1: "Hey! Ready..."          ← node-1
T2: "I want to bench 300"    ← node-2
T3: "Nice! 300..."           ← node-3

// NOT shown: node-4 and node-5 (alternate branch)
```

---

### **When node-5 is selected:**

**Ancestry Chain:**
```typescript
[
  'node-1',  // root
  'node-4',  // parent of node-5
  'node-5'   // selected node
]
```

**Filtered Nodes:**
```typescript
[
  { nodeId: 'node-1', ... },
  { nodeId: 'node-4', ... },
  { nodeId: 'node-5', ... }
]
// node-2 and node-3 are NOT included (sibling branch)
```

**Visual Result:**
```
T1: "Hey! Ready..."              ← node-1
T2: "I want to lose weight"      ← node-4
T3: "Perfect! Weight loss..."    ← node-5

// NOT shown: node-2 and node-3 (alternate branch)
```

---

## 🔄 **No Node Selected (Default Behavior)**

If no node is selected, show the **first root-to-leaf path**:

```typescript
if (!selectedNodeId) {
  // Find root
  const root = currentRun.nodes.find(n => n.parentNodeId === null);
  
  // Follow first child until leaf
  const path = [root.nodeId];
  let current = root.nodeId;
  while (true) {
    const child = currentRun.nodes.find(n => n.parentNodeId === current);
    if (!child) break;
    path.push(child.nodeId);
    current = child.nodeId;
  }
  
  return filtered path;
}
```

---

## 🎨 **User Experience**

### **Interaction Flow:**

1. **User clicks T2 (first branch) in tree**
   → Playback shows: T1 → T2 (first message) → T3 (first response)

2. **User clicks T2 (second branch) in tree**
   → Playback updates to: T1 → T2 (second message) → T3 (second response)

3. **User clicks divergence node (T1)**
   → Playback shows: T1 only (no children, since T1 is selected)

---

## ✅ **Benefits**

✅ **Clear path selection** - Only see the conversation you selected  
✅ **No confusion** - Sibling branches are hidden  
✅ **Consistent state** - Tree selection matches playback content  
✅ **Easy comparison** - Switch between branches to see differences  
✅ **Correct context** - Composer operates on the selected path  

---

## 🔧 **Technical Details**

### **Performance:**
- **Time Complexity:** O(n) where n = number of nodes
  - Building ancestry: O(depth) ≈ O(n) worst case
  - Filtering: O(n)
  - Sorting: O(n log n) but typically small n
- **Memoized:** Only recomputes when `currentRun` or `selectedNodeId` changes

### **Dependencies:**
- `useMemo` - Memoizes filtered nodes
- `currentRun.nodes` - All nodes in simulation
- `selectedNodeId` - Currently selected node in tree
- `parentNodeId` - Ancestry links

---

## 📂 **Files Modified**

1. **`src/components/Simulator/Playback.tsx`**
   - Added `useMemo` import
   - Replaced branch-based filtering with ancestry-based filtering
   - Updated `isLeafNode()` to check against all nodes
   - Added default path selection when no node selected

---

## 🚀 **Testing Checklist**

1. **Select first branch:**
   - ✅ Playback shows only first path
   - ✅ Second branch hidden

2. **Select second branch:**
   - ✅ Playback updates to second path
   - ✅ First branch hidden

3. **Select divergence node:**
   - ✅ Playback shows only nodes up to divergence
   - ✅ No children shown

4. **Select deep nested node:**
   - ✅ Playback shows full ancestry chain
   - ✅ Sibling subtrees hidden

5. **No selection:**
   - ✅ Playback shows first root-to-leaf path by default

---

**Implementation Status:** ✅ Complete  
**Date:** 2026-01-12  
**Package:** `@toldyaonce/kx-axis-fe`  
**Component:** `Playback.tsx`

**Method:** Ancestry chain filtering via `parentNodeId`  
**Trigger:** `selectedNodeId` changes  
**Result:** Only selected path visible in playback



