# Execution Tree - True Hierarchical Model

## ✅ **IMPLEMENTED: Explicit Tree Model + Recursive Rendering**

The Execution Tree now uses a **proper tree data structure** with explicit divergence nodes that appear exactly once, with alternate continuations nested beneath.

---

## 🎯 **Problem Solved**

### **Previous Attempts (ALL BROKEN):**

**Attempt 1: Flat list**
```
T1 - ADVANCE
T2 - ADVANCE
T2 - ADVANCE  ← Duplicate!
T2 - ADVANCE  ← Duplicate!
```

**Attempt 2: Branch headers**
```
📁 Main (3 turns)
  T1, T2, T3

📁 Alt from T2 (2 turns)
  T2, T3  ← T2 appears again!
```

**Attempt 3: "Hierarchical" grouping (still flat)**
```
Main
  T1
  T2 👤  ← First T2
  T3

Alt from T2
  T2 👤  ← Second T2 (still a sibling!)
  T3
```

**All failed because:** T2 appears multiple times at the same depth without true parent-child nesting.

---

### **Current Implementation (CORRECT):**

```
Main
  T1  🤖 "Hey! Ready..."
  
  T2  👤 "I want to bench 300 lbs"  ← APPEARS ONCE
     [2 paths]
     ├─ Main path
     │  └─ T3  🤖 "Nice! 300 on bench is solid..."
     │
     └─ Alt: "I want to lose weight"
        └─ T3  🤖 "Perfect! Weight loss requires..."
```

**Key difference:** T2 appears **exactly once**. The split happens **beneath** it, not as siblings.

---

## 🏗️ **Tree Model (Explicit Data Structure)**

```typescript
type TreeNode = 
  | { kind: 'turn'; node: SimulationNode; children: TreeNode[] }
  | { kind: 'divergence'; userNode: SimulationNode; paths: TreePath[] };

type TreePath = {
  label: string;       // "Main path" or "Alt: [snippet]"
  branchId: string;    // Which branch this path represents
  children: TreeNode[]; // Continuation of this path
};
```

### **Node Types:**

1. **Turn Node:** Regular node with no forks
   ```typescript
   {
     kind: 'turn',
     node: SimulationNode,
     children: []  // Empty for regular turns
   }
   ```

2. **Divergence Node:** User message where branches split
   ```typescript
   {
     kind: 'divergence',
     userNode: SimulationNode,  // The user message (shown once)
     paths: [
       {
         label: 'Main path',
         branchId: 'main',
         children: [/* main continuation */]
       },
       {
         label: 'Alt: "Different reply"',
         branchId: 'branch-2',
         children: [/* alternate continuation */]
       }
     ]
   }
   ```

---

## 🔍 **Divergence Detection Algorithm**

```typescript
function buildExecutionTreeModel(
  run: SimulationRun,
  branchId: string,
  startIndex: number = 0
): TreeNode[] {
  // Step 1: Build map of nodeId → branches that fork from it
  const branchesByForkNode = new Map<string, SimulationBranch[]>();
  run.branches.forEach(branch => {
    if (branch.forkFromNodeId) {
      branchesByForkNode.set(branch.forkFromNodeId, [
        ...branchesByForkNode.get(branch.forkFromNodeId) || [],
        branch
      ]);
    }
  });

  // Step 2: Process nodes in order
  const branchNodes = run.nodes
    .filter(n => n.branchId === branchId)
    .sort((a, b) => a.turnNumber - b.turnNumber);

  const treeNodes: TreeNode[] = [];

  for (let i = startIndex; i < branchNodes.length; i++) {
    const node = branchNodes[i];
    const forks = branchesByForkNode.get(node.nodeId) || [];

    // Step 3: Check if this is a divergence point
    if (forks.length > 0 && node.userMessage) {
      // DIVERGENCE NODE
      const paths: TreePath[] = [];

      // Path 1: Main continuation (current branch, next index)
      paths.push({
        label: 'Main path',
        branchId: branchId,
        children: buildExecutionTreeModel(run, branchId, i + 1)
      });

      // Path 2+: Alternate branches (start at index 0)
      forks.forEach(forkBranch => {
        const snippet = extractSnippet(forkBranch);
        paths.push({
          label: `Alt: "${snippet}"`,
          branchId: forkBranch.branchId,
          children: buildExecutionTreeModel(run, forkBranch.branchId, 0)
        });
      });

      treeNodes.push({
        kind: 'divergence',
        userNode: node,
        paths
      });

      // CRITICAL: Stop processing this branch
      // Rest is handled in recursive calls
      break;
    } else {
      // REGULAR TURN NODE
      treeNodes.push({
        kind: 'turn',
        node,
        children: []
      });
    }
  }

  return treeNodes;
}
```

### **Key Insight:**

When a divergence is found:
1. Create **one** divergence node for the user message
2. Create a "main path" that continues with `buildExecutionTreeModel(branchId, i + 1)`
   - Same branch, next index
3. Create "alternate paths" that start with `buildExecutionTreeModel(forkBranch.branchId, 0)`
   - Different branch, index 0
4. **Break** the loop - rest is in nested recursive calls

This ensures the divergence turn appears **exactly once**.

---

## 🎨 **Recursive Renderer**

```typescript
function renderTreeNode(treeNode: TreeNode, depth: number): React.ReactNode {
  if (treeNode.kind === 'turn') {
    // Regular turn - simple card
    return (
      <Box sx={{ ml: depth * 2 }}>
        <TurnCard node={treeNode.node} />
      </Box>
    );
  }

  if (treeNode.kind === 'divergence') {
    // Divergence node - render once with paths beneath
    const { userNode, paths } = treeNode;
    
    return (
      <Box sx={{ ml: depth * 2 }}>
        {/* User message (shown once) */}
        <TurnCard node={userNode} />
        
        {/* Path count badge */}
        <Chip label={`${paths.length} paths`} />
        
        {/* Render each path */}
        {paths.map((path, idx) => {
          const isLast = idx === paths.length - 1;
          
          return (
            <Box
              sx={{
                ml: 2,
                borderLeft: isLast ? 'none' : '2px solid divider',
                pl: 1.5
              }}
            >
              {/* Path label */}
              <Typography>
                {isLast ? '└─' : '├─'} {path.label}
              </Typography>
              
              {/* Path children (recursive!) */}
              {path.children.map(child => renderTreeNode(child, depth + 1))}
            </Box>
          );
        })}
      </Box>
    );
  }
}
```

### **Rendering Rules:**

1. **Indentation:** `ml: depth * 2` (16px per level)
2. **Connectors:**
   - `├─` Not last path
   - `└─` Last path
3. **Left border:** `2px solid divider` (except last path)
4. **Recursion:** `renderTreeNode(child, depth + 1)` increases depth

---

## ✅ **Hard UI Acceptance Test**

### **Test 1: No Divergence**
```
Main
  T1  🤖 "Hey!"
  T2  👤 "I want to bench 300"
  T3  🤖 "Nice!"
```
✅ **Pass:** Linear list, no duplicates

---

### **Test 2: Single Divergence**
```
Main
  T1  🤖 "Hey!"
  T2  👤 "I want to bench 300"  ← Shows once
     [2 paths]
     ├─ Main path
     │  └─ T3  🤖 "Nice! 300 on bench..."
     └─ Alt: "I want to lose weight"
        └─ T3  🤖 "Perfect! Weight loss..."
```
✅ **Pass:**
- T2 appears **exactly once**
- Two paths **beneath** T2 (not as siblings)
- Proper indentation
- Visual connectors

---

### **Test 3: Nested Divergence**
```
Main
  T1  🤖 "Hey!"
  T2  👤 "I want to bench 300"  ← First divergence
     [2 paths]
     ├─ Main path
     │  └─ T3  👤 "When?"  ← Second divergence (nested)
     │       [2 paths]
     │       ├─ Main path
     │       │  └─ T4  🤖 "Great!"
     │       └─ Alt: "ASAP"
     │          └─ T4  🤖 "Let's start today!"
     └─ Alt: "I want to lose weight"
        └─ T3  🤖 "Perfect! Weight loss..."
```
✅ **Pass:**
- T2 appears once at depth 0
- T3 (first path) appears once at depth 1
- Proper nesting: T3's paths are at depth 2
- No duplicate turn numbers at same depth

---

## 📊 **Visual Structure**

### **Components:**

1. **Turn Card:**
   - Shows turn number, decision, status, message snippet
   - Indented based on depth
   - Blue left border for user messages

2. **Divergence Node:**
   - Turn card (user message)
   - Path count chip ("2 paths")
   - Path labels with connectors

3. **Path Container:**
   - Left border (except last)
   - Indented by 2 units (16px)
   - Label row with connector symbol
   - Children nested recursively

### **Indentation Strategy:**

```
Depth 0: ml: 0
  Depth 1: ml: 2 (16px)
    Depth 2: ml: 4 (32px)
      Depth 3: ml: 6 (48px)
```

### **Connector Symbols:**

```
├─  Branch continues (not last)
└─  Branch ends (last)
│   Left border visual
```

---

## 🔧 **Implementation Details**

### **Files Modified:**

1. **`ExecutionTree.tsx`**
   - Added `TreeNode` and `TreePath` type definitions
   - Implemented `buildExecutionTreeModel()` function
   - Implemented `renderTreeNode()` recursive renderer
   - Replaced flat rendering with tree model

### **Functions:**

1. **`buildExecutionTreeModel(run, branchId, startIndex)`**
   - Returns: `TreeNode[]`
   - Purpose: Build explicit tree model from execution data
   - Key: Detects divergences and creates hierarchical structure

2. **`renderTreeNode(treeNode, depth)`**
   - Returns: `React.ReactNode`
   - Purpose: Recursively render tree model
   - Key: Handles turn vs divergence nodes, manages depth

---

## 🎯 **Non-Goals Met**

✅ **No backend changes** - uses existing `SimulationRun` structure  
✅ **No new concepts** - just organizes existing data hierarchically  
✅ **Structurally truthful** - reflects actual branching structure  

---

## 🚀 **Testing Checklist**

1. **Start simulation** → Verify linear tree (T1, T2, T3)
2. **Create first fork** → Verify divergence node appears
3. **Check divergence:**
   - ✅ User message shows once
   - ✅ "2 paths" badge visible
   - ✅ "├─ Main path" label
   - ✅ "└─ Alt: [snippet]" label
   - ✅ Paths indented beneath divergence
   - ✅ No duplicate T2 at same depth
4. **Create nested fork** → Verify nested divergences work
5. **Click nodes** → Verify selection works at all depths

---

## 📝 **Divergence Detection Explanation**

**Method:** Parent pointer mapping (forkFromNodeId)

**Process:**
1. Build map: `nodeId → branches that fork from it`
2. For each node, check if `branchesByForkNode.get(nodeId)` returns forks
3. If yes + user message → create divergence node
4. If no → create regular turn node

**Why this works:**
- Backend provides `branch.forkFromNodeId` - the node where the fork occurred
- We aggregate all branches by their fork point
- This gives us exact divergence points without prefix matching

**Alternative (not needed):**
- Prefix matching: Compare node sequences to find shared history
- Not required because `forkFromNodeId` explicitly marks divergences

---

**Implementation Status:** ✅ Complete  
**Date:** 2026-01-12  
**Package:** `@toldyaonce/kx-axis-fe`  
**Component:** `ExecutionTree.tsx`

**Tree Model:** Explicit hierarchical structure  
**Rendering:** Recursive with depth tracking  
**Divergence Detection:** Parent pointer mapping via `forkFromNodeId`

