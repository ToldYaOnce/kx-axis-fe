# Execution Tree - Hierarchical Branch Display

## ✅ **FIXED: Confusing Flat "Turn 2, Turn 2, Turn 2" List**

The Execution Tree (left panel) now displays a **clear hierarchical structure** that makes branching obvious at a glance.

---

## 🎯 **Problem Solved**

**Before (BROKEN):**
```
Turn 1 - ADVANCE
Turn 2 - ADVANCE
Turn 2 - ADVANCE  ← Confusing! Which Turn 2?
Turn 2 - ADVANCE  ← Same number, no context
Turn 3 - ADVANCE
```

**After (FIXED):**
```
📁 Main (3 turns)
  ├─ T1 - ADVANCE
  │  🤖 "Hey! Ready to crush some goals?..."
  ├─ T2 - ADVANCE 👤
  │  👤 "I want to bench 300 lbs"
  └─ T3 - ADVANCE
     🤖 "Great goal! Let's break it down..."

📁 Alt from T2: "I want to lose weight" (2 turns)
  ├─ T2 - ADVANCE 👤
  │  👤 "I want to lose weight"
  └─ T3 - ADVANCE
     🤖 "Perfect! Weight loss requires..."
```

---

## 📊 **What Changed**

### 1. **Branch Headers (NEW)**

Each branch now has a **prominent header** showing:

**For Main Branch:**
```
Main | 3 turns
```

**For Alternate Branches:**
```
🔀 Alt from T2: "I want to lose weight" | 2 turns
```

**Visual Design:**
- **Active branch:** Bold blue background, white text, elevated shadow
- **Inactive branch:** Light grey background
- **Fork icon** for alternate branches
- **Turn count** always visible

**Behavior:**
- Clicking a branch header selects that branch and jumps to its latest turn

---

### 2. **Branch Grouping (CORE FIX)**

Turns are now **grouped under their branch**, eliminating confusion:

```typescript
// Turns are scoped to their parent branch
Main
  ├─ Turn 1
  ├─ Turn 2
  └─ Turn 3

Alt from T2
  ├─ Turn 2  ← Different Turn 2, clearly under different branch
  └─ Turn 3
```

**Key Insight:** Turn numbers may repeat across branches, but they're always **visually grouped** under their branch header, making context clear.

---

### 3. **Divergence Information (CRITICAL)**

For alternate branches, the header shows:

1. **Divergence point:** "from T2" (which turn was the fork point)
2. **User message snippet:** First 35 characters of the alternate user reply

**Example Labels:**
- `Alt from T2: "I want to lose weight"`
- `Alt from T3: "How much does coaching cost?"`
- `Alt from T1: "I'm not sure what I want"`

**Derivation Logic:**
```typescript
// 1. Find the fork node (parent branch node)
const forkNode = currentRun.nodes.find(n => n.nodeId === branch.forkFromNodeId);

// 2. Get the first user message in the new branch (the alternate reply)
const firstUserNode = branchNodes.find(n => n.userMessage);

// 3. Truncate and display
const snippet = firstUserNode.userMessage.substring(0, 35) + '...';
const label = `Alt from T${forkNode.turnNumber}: "${snippet}"`;
```

---

### 4. **Enhanced Turn Cards**

Each turn card now shows:

**Header Row:**
- Status icon (✓ VALID, ⚠️ DRIFTED, ❌ INVALID)
- Turn number: `T2` (compact format)
- Fork icon (if user message)
- Decision badge (color-coded: ADVANCE, STALL, EXPLAIN, etc.)

**Message Snippet Row:**
- 👤 icon for user messages (blue text)
- 🤖 icon for agent messages (grey italic text)
- First 30 characters of the message

**Example:**
```
┌──────────────────────────────────┐
│ ✓ T2 🔀         [ADVANCE]       │
│ 👤 I want to bench 300 lbs       │
└──────────────────────────────────┘
```

**Visual Cues:**
- **User turns:** Thick blue left border (4px) - these are branch points
- **Agent turns:** Thin grey left border (2px)
- **Selected turn:** Blue border, light blue background

---

## 🌳 **Hierarchical Structure**

### **Nesting Rules:**

1. **Main branch** (no parent) renders at depth 0
2. **Child branches** indent by 3 units (24px)
3. **Turns within a branch** inherit branch indentation

**Visual Example:**
```
Main (depth 0)
├─ Turns (depth 0)

  Alt from T2 (depth 1, indented 24px)
  ├─ Turns (depth 1, indented 24px)

    Alt from T3 (depth 2, indented 48px)
    └─ Turns (depth 2, indented 48px)
```

---

## 🎨 **Visual Design Decisions**

### **Branch Headers:**

**Active Branch:**
- Background: `primary.main` (blue)
- Text: White
- Border: `primary.dark` (2px)
- Elevation: 3 (shadow)

**Inactive Branch:**
- Background: `grey.100`
- Text: Black
- Border: Transparent
- Elevation: 0

**Hover (inactive):**
- Background: `grey.200`

---

### **Turn Cards:**

**Normal Turn:**
- Border: `divider` (2px)
- Background: White
- Left border: 2px (agent) or 4px (user)

**Selected Turn:**
- Border: `primary.main` (2px)
- Background: `primary.lighter`
- Maintains left border thickness

**Hover:**
- Border: `primary.light`
- Background: `action.hover` (if not selected)

---

## 🔄 **Active Cursor Indication**

### **What's Active:**

1. **Selected Branch:**
   - Blue background on branch header
   - White text
   - Shadow elevation

2. **Selected Turn:**
   - Blue border on turn card
   - Light blue background

3. **Combined Feedback:**
   ```
   📁 Main (3 turns)  ← Active branch (blue)
     ├─ T1 - ADVANCE
     ├─ T2 - ADVANCE  ← Selected turn (blue border)
     └─ T3 - ADVANCE
   ```

---

## 📝 **Branch Label Derivation**

### **Algorithm:**

```typescript
function getBranchLabel(branch: SimulationBranch): string {
  // Main branch
  if (!branch.parentBranchId) {
    return 'Main';
  }

  // Alternate branch
  const forkNode = findNodeById(branch.forkFromNodeId);
  const turnNumber = forkNode.turnNumber;
  
  // Find the first user message in this branch (the alternate reply)
  const branchNodes = getNodesForBranch(branch.branchId);
  const firstUserNode = branchNodes.find(n => n.userMessage);
  
  if (firstUserNode?.userMessage) {
    const snippet = truncate(firstUserNode.userMessage, 35);
    return `Alt from T${turnNumber}: "${snippet}"`;
  } else {
    return `Alt from Turn ${turnNumber}`;
  }
}
```

---

## ✅ **Acceptance Criteria Met**

✅ **Left panel is hierarchical** (branch → turns)  
✅ **Duplicate "Turn 2" rows no longer confusing** (grouped under branch headers)  
✅ **Each non-main branch shows divergence origin** (e.g., "from T2")  
✅ **User message snippet shown** (first 35 chars)  
✅ **Turn count visible** in branch header  
✅ **Active branch highlighted** (blue background)  
✅ **Active turn highlighted** (blue border)  
✅ **User can understand branching** without reading center chat area  

---

## 🚀 **Testing Checklist**

1. **Start simulation** → Verify "Main" branch appears
2. **Type first message** → Verify turn appears under Main
3. **Agent responds** → Verify both turns under Main
4. **Click fork icon** on Turn 2 → Enter alternate reply mode
5. **Type different message** → Submit
6. **Verify new branch:**
   - ✅ Branch header shows: `Alt from T2: "[message snippet]"`
   - ✅ Turn count shows correct number
   - ✅ Branch is highlighted (active)
   - ✅ Turns grouped under new branch header
   - ✅ Main branch still visible above
7. **Click Main branch header** → Verify switches to Main
8. **Create 3rd branch** → Verify proper nesting/indentation

---

## 🎯 **Key User Benefits**

### **Before:**
- "Why are there three Turn 2s?"
- "Which branch am I on?"
- "What did I say differently in this branch?"

### **After:**
- ✅ **Immediate branch context** (grouped under headers)
- ✅ **Clear divergence points** (turn number + snippet)
- ✅ **Visual hierarchy** (indentation shows structure)
- ✅ **Active cursor obvious** (blue highlights)
- ✅ **Turn count at a glance** (in header)

---

**Implementation Status:** ✅ Complete  
**Date:** 2026-01-12  
**Package:** `@toldyaonce/kx-axis-fe`  
**Component:** `ExecutionTree.tsx`




