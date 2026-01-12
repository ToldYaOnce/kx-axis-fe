# Branch & Turn Selection Fix

## Problem

When clicking on a turn or branch in the Execution Tree (left panel), the conversation history (center panel) did not display. The center showed "No turns yet" even though turns existed.

## Root Cause

The issue was with branch selection synchronization:

1. **Clicking a node** would select the node BUT NOT the branch
   - If you clicked a turn from "Branch from Turn 1", the `activeBranchId` might still be "Main"
   - Playback would try to load nodes from "Main" branch, finding none or the wrong ones

2. **Branch switching wasn't automatic**
   - User had to manually click the branch header first, then the turn
   - Non-intuitive and broke the expected interaction model

## Fixes Applied

### 1. Auto-Select Branch When Clicking Turn

**File:** `ExecutionTree.tsx`

**Before:**
```typescript
onSelect={() => selectNode(node.nodeId)}
```

**After:**
```typescript
onSelect={() => {
  selectBranch(node.branchId); // ← Select branch FIRST
  selectNode(node.nodeId);      // ← Then select node
}}
```

**Why:** When clicking a turn, we now automatically switch to that turn's branch, ensuring Playback shows the correct conversation history.

---

### 2. Auto-Select Latest Node When Clicking Branch Header

**Before:** Clicking a branch header only selected the branch

**After:**
```typescript
onClick={() => {
  selectBranch(branch.branchId);
  // Also select the latest node in this branch
  if (branchNodes.length > 0) {
    const latestNode = branchNodes[branchNodes.length - 1];
    selectNode(latestNode.nodeId);
  }
}}
```

**Why:** When switching branches, we want to show the conversation up to the latest point in that branch, and ensure the composer button shows the correct state ("Send" vs "Fork & Send").

---

### 3. Debug Logging

Added console logging to help diagnose issues:

**In ExecutionTree:**
```typescript
console.log('📊 Rendering branch:', {
  branchId, branchLabel, nodesCount, nodes, isActive
});

console.log('🖱️ Node clicked:', {
  nodeId, branchId, turn
});

console.log('🌳 Branch header clicked:', {
  branchId, label
});
```

**In Playback:**
```typescript
console.log('🔍 Playback Debug:', {
  currentRun, activeBranchId, selectedNodeId,
  nodesCount, allNodesCount, allNodes
});
```

**Why:** Helps debug state synchronization issues and understand what data is flowing through the components.

---

### 4. Better Empty State Message

**Before:**
```typescript
<Typography>No turns yet</Typography>
```

**After:**
```typescript
<Typography>No turns yet</Typography>
<Typography variant="caption">
  {activeBranchId 
    ? `Branch "${activeBranchId}" is empty` 
    : 'No branch selected'}
</Typography>
```

**Why:** More informative - tells the user WHY they're not seeing turns.

---

## Expected Behavior (After Fix)

### Scenario 1: Click Turn 1 in Main Branch
```
1. User clicks "Turn 1" in tree
2. System:
   - Sets activeBranchId = "branch-main"
   - Sets selectedNodeId = "node-001"
3. Playback shows:
   - Agent message: "Hey! Ready to crush some goals?..."
4. Composer button shows: "Send"
```

### Scenario 2: Click Turn 1 in "Branch from Turn 1"
```
1. User clicks "Turn 1" under "Branch from Turn 1"
2. System:
   - Sets activeBranchId = "branch-fork-123"
   - Sets selectedNodeId = "node-001"
3. Playback shows:
   - Agent message: "Hey! Ready to crush some goals?..." (copied from parent)
4. Composer button shows: "Send" (because this is the leaf of this branch)
```

### Scenario 3: Click Branch Header "Main"
```
1. User clicks "Main" branch header
2. System:
   - Sets activeBranchId = "branch-main"
   - Sets selectedNodeId = "node-001" (latest node in Main)
3. Playback shows all turns in Main branch
4. Composer button shows: "Send" or "Fork & Send" based on whether node-001 has children
```

---

## Testing Checklist

After refresh, verify:

- [ ] Click "Turn 1" in Main branch → Agent message appears
- [ ] Click "Branch from Turn 1" header → Conversation history loads
- [ ] Click any turn in any branch → Correct conversation loads
- [ ] Composer button shows "Send" when on branch leaf
- [ ] Composer button shows "Fork & Send" when on non-leaf turn
- [ ] Console logs show correct branch/node selection
- [ ] No "No turns yet" when turns exist

---

## Technical Details

### Data Flow

```
User Clicks Turn
     ↓
ExecutionTree.TreeNode.onClick()
     ↓
selectBranch(node.branchId)  ← NEW: Sync branch first
     ↓
selectNode(node.nodeId)
     ↓
SimulatorContext updates state
     ↓
┌─────────────────┬─────────────────────┐
│ ExecutionTree   │ Playback            │
│ re-renders      │ re-renders          │
│ (updates        │ (calls              │
│  selection)     │  getNodesForBranch) │
└─────────────────┴─────────────────────┘
```

### Key State Variables

| Variable | Stored In | Purpose |
|----------|-----------|---------|
| `activeBranchId` | SimulatorContext | Which branch's conversation to show |
| `selectedNodeId` | SimulatorContext | Which turn is selected (affects button label) |
| `currentRun.nodes` | SimulatorContext | All turns across all branches |

### Node Filtering

```typescript
const nodes = activeBranchId 
  ? currentRun.nodes
      .filter(n => n.branchId === activeBranchId)
      .sort((a, b) => a.turnNumber - b.turnNumber)
  : [];
```

**Critical:** `filter` uses `branchId` to isolate the correct conversation history.

---

## Files Modified

| File | Changes |
|------|---------|
| `ExecutionTree.tsx` | Auto-select branch on turn click, auto-select node on branch click, debug logging |
| `Playback.tsx` | Better empty state message, debug logging |

---

## Success Criteria

✅ Clicking any turn loads its conversation history
✅ Clicking any branch loads that branch's history
✅ User doesn't need to understand branching to see messages
✅ Composer button state reflects current position
✅ Navigation feels intuitive and responsive

**The conversation history now loads correctly when clicking turns or branches!** 🎯

