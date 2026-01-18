# True Hierarchy via Divergence Nodes

## ✅ **IMPLEMENTED: Structurally Truthful Tree**

The Execution Tree now uses **true hierarchical divergence nodes** where user messages with multiple paths appear **once** with continuations nested beneath.

---

## 🎯 **Problem Solved**

### **Before (Flat with Branch Headers):**
```
📁 Main (3 turns)
  ├─ T1 - ADVANCE
  ├─ T2 - ADVANCE 👤 "I want to bench 300 lbs"
  └─ T3 - ADVANCE

📁 Alt from T2: "I want to lose weight" (2 turns)
  ├─ T2 - ADVANCE 👤 "I want to lose weight"  ← DUPLICATE T2!
  └─ T3 - ADVANCE
```

**Problem:** T2 appears twice with no visual connection. User must infer the relationship.

---

### **After (True Hierarchy):**
```
Main
  T1 - ADVANCE
    🤖 "Hey! Ready to crush some goals?..."
  
  T2 - ADVANCE 👤  ← DIVERGENCE NODE (appears once)
    👤 "I want to bench 300 lbs"
    
    3 paths:
    ├─ Main path
    │  └─ T3 - ADVANCE
    │     🤖 "Great goal! Let's break it down..."
    │
    ├─ Alt: "I want to lose weight"
    │  └─ T3 - ADVANCE
    │     🤖 "Perfect! Weight loss requires..."
    │
    └─ Alt: "How much does it cost?"
       └─ T3 - ADVANCE
          🤖 "Our coaching starts at..."
```

**Solution:** T2 appears **once** as a divergence node. All alternate continuations nest beneath it with visual connectors.

---

## 🏗️ **Architecture**

### **Core Invariant:**
**Hierarchy is anchored at USER replies where alternates exist.**

### **Node Types:**

1. **Regular Node:** A turn with no forks
   - Renders once
   - No nesting

2. **Divergence Node:** A user message where branches split
   - Renders once
   - Shows "N paths:"
   - Nests all continuations beneath it
   - Uses visual connectors (├─, └─)

3. **Path Continuation:** The nodes following a divergence
   - Indented
   - Left border for visual connection
   - Labeled ("Main path" or "Alt: [snippet]")

---

## 🔍 **Divergence Detection Algorithm**

```typescript
// 1. Build map of nodeId → branches that fork from it
const branchesByForkNode = new Map<string, SimulationBranch[]>();
currentRun.branches.forEach((branch) => {
  if (branch.forkFromNodeId) {
    branchesByForkNode.set(branch.forkFromNodeId, [
      ...branchesByForkNode.get(branch.forkFromNodeId) || [],
      branch
    ]);
  }
});

// 2. During render, check if node is a divergence point
const isDivergencePoint = (node: SimulationNode): boolean => {
  const forks = branchesByForkNode.get(node.nodeId) || [];
  return forks.length > 0 && node.userMessage !== undefined;
};

// 3. If divergence, render once with nested paths
if (isDivergencePoint(node)) {
  // Render node
  // Render "N paths:"
  // Render main continuation (indented)
  // Render each alternate branch (indented)
}
```

---

## 🎨 **Visual Structure**

### **Indentation:**
- Base depth 0: No indent
- Depth +1: +16px (2 MUI units)
- Path continuations: +16px additional + left border

### **Connectors:**
```
├─ Main path       ← Tree branch (not last)
│  └─ Nodes...     ← Nested under path
│
├─ Alt: "..."      ← Tree branch (not last)
│  └─ Nodes...     ← Nested under path
│
└─ Alt: "..."      ← Tree branch (last, uses └─)
   └─ Nodes...     ← Nested under path
```

### **Left Borders:**
- `2px solid divider` between sibling paths
- Last path has no border (└─ connector indicates end)
- Extends full height of nested content

---

## 📊 **Rendering Rules**

### **1. Regular Node (No Forks):**
```jsx
<Box sx={{ ml: depth * 2 }}>
  <TreeNode node={node} />
</Box>
```

### **2. Divergence Node (Has Forks):**
```jsx
<Box sx={{ ml: depth * 2 }}>
  {/* Show user message once */}
  <TreeNode node={node} />
  
  {/* Show path count */}
  <Typography>3 paths:</Typography>
  
  {/* Main continuation */}
  <Box sx={{ ml: 2, borderLeft: '2px solid divider', pl: 1.5 }}>
    <Typography>├─ Main path</Typography>
    {renderNodeHierarchy(currentBranch, nextIndex, depth + 1)}
  </Box>
  
  {/* Alternate branches */}
  {alternateBranches.map((branch, idx) => {
    const isLast = idx === alternateBranches.length - 1;
    return (
      <Box sx={{ ml: 2, borderLeft: isLast ? 'none' : '2px solid divider', pl: 1.5 }}>
        <Typography>{isLast ? '└─' : '├─'} Alt: "{snippet}"</Typography>
        {renderNodeHierarchy(branch.branchId, 0, depth + 1)}
      </Box>
    );
  })}
</Box>
```

### **3. Agent Messages:**
- Always appear as children of a branch path
- Never top-level in a divergence
- Render with regular node styling

---

## 🔄 **Recursive Traversal**

```typescript
function renderNodeHierarchy(
  branchId: string,
  startIndex: number,
  depth: number
): React.ReactNode[] {
  const branchNodes = getNodesForBranch(branchId);
  const elements = [];
  
  for (let i = startIndex; i < branchNodes.length; i++) {
    const node = branchNodes[i];
    const forks = branchesByForkNode.get(node.nodeId) || [];
    
    if (forks.length > 0 && node.userMessage) {
      // DIVERGENCE NODE
      elements.push(renderDivergenceNode(node, forks, depth));
      break; // Rest is handled in nested renders
    } else {
      // REGULAR NODE
      elements.push(renderRegularNode(node, depth));
    }
  }
  
  return elements;
}
```

**Key Points:**
- `startIndex`: Where to begin in the branch (allows skipping already-rendered nodes)
- `depth`: Current indentation level
- When divergence found, render it and **break** (continuations are nested)

---

## 🎯 **Path Labels**

### **Main Path:**
```
├─ Main path
```
- No snippet needed
- Represents the continuation of the original branch

### **Alternate Paths:**
```
├─ Alt: "I want to lose weight"
└─ Alt: "How much does it cost?"
```
- Shows first 30 characters of the user's alternate message
- Truncates with "..." if longer
- Makes divergence immediately obvious

**Derivation:**
```typescript
const divBranchNodes = getNodesForBranch(alternateBranch.branchId);
const firstUserNode = divBranchNodes.find(n => n.userMessage);
const snippet = firstUserNode?.userMessage?.substring(0, 30) + '...' || 'Alt path';
```

---

## ✅ **Acceptance Criteria Met**

✅ **No repeated "T2" rows without hierarchy**  
- Turn 2 appears once as divergence node
- Continuations nest beneath it

✅ **Divergence points are visually obvious**  
- "N paths:" indicator
- Visual connectors (├─, └─)
- Left borders showing structure

✅ **User can identify where paths split without looking at chat**  
- Path labels show alternate message snippets
- Tree structure makes branching clear
- Indentation shows parent-child relationships

✅ **Structurally truthful**  
- Tree reflects actual conversation structure
- No artificial grouping or headers
- True parent-child nesting

---

## 🚀 **Testing**

### **Scenario 1: Single Linear Path**
```
Main
  T1 - ADVANCE
  T2 - ADVANCE
  T3 - ADVANCE
```
**Expected:** Flat list (no divergence)

### **Scenario 2: One Divergence Point**
```
Main
  T1 - ADVANCE
  T2 - ADVANCE 👤 (divergence)
    2 paths:
    ├─ Main path
    │  └─ T3 - ADVANCE
    └─ Alt: "Different reply"
       └─ T3 - ADVANCE
```
**Expected:** T2 appears once, two paths nest beneath

### **Scenario 3: Multiple Divergences**
```
Main
  T1 - ADVANCE
  T2 - ADVANCE 👤 (divergence 1)
    3 paths:
    ├─ Main path
    │  └─ T3 - ADVANCE 👤 (divergence 2)
    │      2 paths:
    │      ├─ Main path
    │      │  └─ T4 - ADVANCE
    │      └─ Alt: "Another fork"
    │         └─ T4 - ADVANCE
    ├─ Alt: "First alternate"
    │  └─ T3 - ADVANCE
    └─ Alt: "Second alternate"
       └─ T3 - ADVANCE
```
**Expected:** Nested divergences, proper indentation, clear structure

---

## 📂 **Files Modified**

1. **`ExecutionTree.tsx`**
   - Removed flat branch header rendering
   - Implemented `renderNodeHierarchy()` recursive function
   - Added divergence detection via `branchesByForkNode` map
   - Added visual connectors (├─, └─)
   - Added path labels with snippets
   - Implemented proper indentation and nesting

2. **`TRUE_HIERARCHY.md`** (NEW)
   - Complete documentation of true hierarchy approach

---

## 🎨 **Visual Design**

### **Path Count Indicator:**
```tsx
<Typography 
  variant="caption" 
  sx={{ 
    ml: 2, 
    fontSize: '0.65rem',
    color: 'text.secondary',
    fontWeight: 600
  }}
>
  3 paths:
</Typography>
```

### **Path Label:**
```tsx
<Typography 
  variant="caption" 
  sx={{ 
    fontSize: '0.65rem', 
    color: 'primary.main',  // Blue for alternate paths
    fontWeight: 600
  }}
>
  ├─ Alt: "I want to lose weight"
</Typography>
```

### **Visual Connectors:**
- **Not last:** `├─` (branch continues)
- **Last:** `└─` (branch ends)
- **Left border:** `2px solid divider` (except last)

---

**Implementation Status:** ✅ Complete  
**Date:** 2026-01-12  
**Package:** `@toldyaonce/kx-axis-fe`  
**Component:** `ExecutionTree.tsx`



