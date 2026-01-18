# Execution Tree - Parent-Child Hierarchy Using `parentNodeId`

## ✅ **IMPLEMENTED: True Parent-Child Tree Structure**

The Execution Tree now uses **true parent-child relationships** via `parentNodeId` to build a proper hierarchical tree where:
- Each node appears **exactly once**
- Divergence is detected by `children.length > 1`
- No flat lists or artificial grouping

---

## 🎯 **Data Model**

### **SimulationNode (with ancestry)**

```typescript
interface SimulationNode {
  nodeId: string;
  parentNodeId: string | null;  // ← CRITICAL: Points to immediate parent
  branchId: string;
  turnNumber: number;
  
  // Message content
  userMessage?: string;
  agentMessage?: string;
  
  // Execution data
  executionResult: ExecutionResult;
  controllerOutput: ControllerOutput;
  
  // Metadata
  timestamp: string;
  status: 'VALID' | 'DRIFTED' | 'INVALID';
  // ... other fields
}
```

### **How `parentNodeId` is Set**

**First node in a branch:**
```typescript
parentNodeId = null
```

**Subsequent nodes in the same branch:**
```typescript
parentNodeId = lastNodeIdInThatBranch
```

**Fork (alternate reply):**
```typescript
// New branch's first node points back to divergence point
parentNodeId = forkAnchorUserNodeId
```

**Example:**
```
Main branch:
  node-001: parentNodeId = null
  node-002: parentNodeId = "node-001"
  node-003: parentNodeId = "node-002"

Fork from node-002:
  node-004: parentNodeId = "node-002"  ← Points to divergence!
  node-005: parentNodeId = "node-004"
```

---

## 🏗️ **Tree Building Algorithm**

### **Type Definition**

```typescript
type TreeNode = SimulationNode & {
  children: TreeNode[];
};
```

### **`buildTree()` Implementation**

```typescript
function buildTree(nodes: SimulationNode[]): TreeNode[] {
  // Step 1: Index all nodes by nodeId
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach(node => {
    nodeMap.set(node.nodeId, { ...node, children: [] });
  });

  // Step 2: Build parent-child relationships
  const roots: TreeNode[] = [];
  
  nodes.forEach(node => {
    const treeNode = nodeMap.get(node.nodeId)!;
    
    if (node.parentNodeId === null) {
      // Root node
      roots.push(treeNode);
    } else {
      // Attach to parent
      const parent = nodeMap.get(node.parentNodeId);
      if (parent) {
        parent.children.push(treeNode);
      } else {
        // Orphaned node - treat as root
        console.warn(`Orphaned node: ${node.nodeId}`);
        roots.push(treeNode);
      }
    }
  });

  // Step 3: Sort children by timestamp
  const sortChildren = (node: TreeNode) => {
    node.children.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    node.children.forEach(sortChildren);
  };
  roots.forEach(sortChildren);

  return roots;
}
```

**Key Points:**
- **O(n) time complexity** - single pass to build relationships
- **No recursion in building** - just array/map operations
- **Handles orphans gracefully** - treats them as roots
- **Sorts children** - ensures consistent visual ordering

---

## 🔍 **Divergence Detection**

**Rule:** A node is a divergence point if:
1. `node.children.length > 1` (multiple children)
2. `node.userMessage !== undefined` (it's a user message)

**Why this works:**
- When a user creates an alternate reply, two nodes will have the **same parentNodeId**
- Both become children of the divergence node
- The tree builder automatically creates this structure

**Example:**
```typescript
// After buildTree():
node-002 (user message) {
  children: [
    node-003,  // Main continuation
    node-004   // Alternate reply (same parentNodeId!)
  ]
}

// Divergence detected: children.length === 2
```

---

## 🎨 **Recursive Rendering**

### **`renderNode()` Implementation**

```typescript
function renderNode(node: TreeNode, depth: number): React.ReactNode {
  const isDivergence = node.children.length > 1;
  const isUserMessage = node.userMessage !== undefined;

  if (isDivergence && isUserMessage) {
    // DIVERGENCE NODE
    return (
      <Box sx={{ ml: depth * 2 }}>
        {/* User message (shown once) */}
        <TurnCard node={node} />
        
        {/* Path count badge */}
        <Chip label={`${node.children.length} paths`} />
        
        {/* Render each child path */}
        {node.children.map((child, idx) => {
          const isLast = idx === node.children.length - 1;
          const pathLabel = child.userMessage 
            ? `Alt: "${truncate(child.userMessage)}"`
            : 'Main path';
          
          return (
            <Box sx={{ ml: 2, borderLeft: isLast ? 'none' : '2px solid divider', pl: 1.5 }}>
              <Typography>{isLast ? '└─' : '├─'} {pathLabel}</Typography>
              {renderNode(child, depth + 1)}  {/* Recursive! */}
            </Box>
          );
        })}
      </Box>
    );
  } else {
    // REGULAR NODE
    return (
      <Box>
        <Box sx={{ ml: depth * 2 }}>
          <TurnCard node={node} />
        </Box>
        {node.children.map(child => renderNode(child, depth))}
      </Box>
    );
  }
}
```

**Key Points:**
- **Divergence nodes:** Render once with paths beneath
- **Regular nodes:** Render node + children (same depth)
- **Indentation:** `ml: depth * 2` (16px per level)
- **Visual connectors:** `├─` (not last), `└─` (last)

---

## ✅ **Acceptance Criteria Met**

### **1. Every node except root has parentNodeId**
✅ **Verified:** All fixtures have `parentNodeId` set
- Root nodes: `parentNodeId = null`
- All others: `parentNodeId = <parent's nodeId>`

### **2. Forked branch points back to divergence**
✅ **Verified:** When forking from a user message:
```typescript
// Original: node-002 (user message)
// Fork creates: node-004
node-004.parentNodeId = "node-002"  // Points to divergence!
```

### **3. Existing behavior unchanged**
✅ **Verified:** Only metadata added, no execution logic changes

### **4. Tree structure is correct**
✅ **Verified:** Tree shows clear split underneath divergence:
```
Main
  T1  🤖
  T2  👤 "I want to bench 300"  ← Shows once
     [2 paths]
     ├─ Main path
     │  └─ T3  🤖
     └─ Alt: "I want to lose weight"
        └─ T3  🤖
```

### **5. No duplicate T2 at same depth**
✅ **Verified:** T2 appears exactly once. Alternates are nested children.

### **6. Selection works at all depths**
✅ **Verified:** Clicking any node updates playback, regardless of depth

---

## 🔄 **Example Tree Structure**

### **Input (nodes with parentNodeId)**

```typescript
[
  { nodeId: 'n1', parentNodeId: null, userMessage: null, agentMessage: 'Hey!' },
  { nodeId: 'n2', parentNodeId: 'n1', userMessage: 'I want to bench 300', agentMessage: null },
  { nodeId: 'n3', parentNodeId: 'n2', userMessage: null, agentMessage: 'Nice!' },
  { nodeId: 'n4', parentNodeId: 'n2', userMessage: 'I want to lose weight', agentMessage: null },
  { nodeId: 'n5', parentNodeId: 'n4', userMessage: null, agentMessage: 'Perfect!' }
]
```

### **After `buildTree()`**

```typescript
[
  {
    nodeId: 'n1',
    parentNodeId: null,
    agentMessage: 'Hey!',
    children: [
      {
        nodeId: 'n2',
        parentNodeId: 'n1',
        userMessage: 'I want to bench 300',
        children: [
          {
            nodeId: 'n3',
            parentNodeId: 'n2',
            agentMessage: 'Nice!',
            children: []
          },
          {
            nodeId: 'n4',
            parentNodeId: 'n2',
            userMessage: 'I want to lose weight',
            children: [
              {
                nodeId: 'n5',
                parentNodeId: 'n4',
                agentMessage: 'Perfect!',
                children: []
              }
            ]
          }
        ]
      }
    ]
  }
]
```

**Key:** n2 has 2 children → Divergence detected!

### **Rendered Output**

```
Main
  T1  🤖 "Hey!"
  T2  👤 "I want to bench 300"
     [2 paths]
     ├─ Main path
     │  └─ T3  🤖 "Nice!"
     └─ Alt: "I want to lose weight"
        └─ T5  🤖 "Perfect!"
```

---

## 📊 **Visual Design**

### **Regular Node**
```tsx
<Box sx={{ ml: depth * 2 }}>
  <TurnCard node={node} />
</Box>
```
- Indented by depth
- No special decoration

### **Divergence Node**
```tsx
<Box sx={{ ml: depth * 2 }}>
  <TurnCard node={node} />
  <Chip label="2 paths" />
  {/* Children with connectors */}
</Box>
```
- User message shown once
- Path count badge
- Children indented further

### **Path Container**
```tsx
<Box sx={{ ml: 2, borderLeft: '2px solid divider', pl: 1.5 }}>
  <Typography>├─ Alt: "Message"</Typography>
  {/* Child nodes */}
</Box>
```
- Left border for visual connection
- Connector symbol (├─ or └─)
- Path label with snippet

---

## 🎯 **Performance Characteristics**

**Tree Building:**
- Time: **O(n)** where n = number of nodes
- Space: **O(n)** for nodeMap + tree structure
- No expensive operations (no sorting except children)

**Rendering:**
- Time: **O(n)** - each node rendered once
- Space: **O(d)** where d = max depth (recursion stack)
- React efficiently handles subtree updates

---

## 📂 **Files Modified**

1. **`src/types/simulator.ts`**
   - ✅ Already had `parentNodeId` field

2. **`src/fixtures/simulatorFixtures.ts`**
   - ✅ Already set `parentNodeId` correctly

3. **`src/components/Simulator/ExecutionTree.tsx`**
   - ✅ Implemented `buildTree()` function
   - ✅ Implemented `renderNode()` recursive renderer
   - ✅ Removed old branch-based logic
   - ✅ Uses parent-child relationships exclusively

4. **`PARENT_CHILD_TREE.md`** (NEW)
   - ✅ Complete documentation

---

## 🚀 **Testing Checklist**

1. **Linear conversation:**
   ```
   Main
     T1 → T2 → T3
   ```
   ✅ No divergence, straight line

2. **Single divergence:**
   ```
   Main
     T1 → T2 (divergence)
            ├─ T3 (main)
            └─ T3 (alt)
   ```
   ✅ T2 appears once, 2 paths beneath

3. **Nested divergence:**
   ```
   Main
     T1 → T2 (div 1)
            ├─ T3 (div 2)
            │    ├─ T4
            │    └─ T4
            └─ T3 (alt)
   ```
   ✅ Proper nesting, no duplicates at same depth

4. **Multiple forks from same node:**
   ```
   Main
     T1 → T2 (divergence)
            ├─ Path A
            ├─ Path B
            └─ Path C
   ```
   ✅ All 3 paths shown, proper connectors

---

## 🎓 **Key Learnings**

### **Why This Works**

1. **Single Source of Truth:** `parentNodeId` explicitly defines hierarchy
2. **No Inference:** Don't need to match branches or compute shared history
3. **Automatic Divergence:** Multiple nodes with same `parentNodeId` = divergence
4. **Simple Algorithm:** Just index, link, sort - no complex logic

### **Comparison to Previous Approach**

**Old (Branch-Based):**
- ❌ Required tracking branch forks
- ❌ Needed manual detection of divergence points
- ❌ Complex recursive calls with startIndex
- ❌ Could create duplicate nodes

**New (Parent-Child):**
- ✅ Direct parent-child relationships
- ✅ Automatic divergence detection (children > 1)
- ✅ Simple one-pass tree builder
- ✅ Each node appears exactly once

---

**Implementation Status:** ✅ Complete  
**Date:** 2026-01-12  
**Package:** `@toldyaonce/kx-axis-fe`  
**Component:** `ExecutionTree.tsx`

**Method:** Parent-child relationships via `parentNodeId`  
**Divergence Detection:** `children.length > 1`  
**Rendering:** Recursive with depth tracking




