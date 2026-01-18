# User Turn Composer - Implementation Complete

## Overview

The User Turn Composer is the primary interaction point in KxAxis Execution Mode. It allows the human operator to impersonate the lead and drive the conversation simulation forward.

**Location:** Fixed at the bottom of the center Playback panel

## Core Rules Enforced

✅ **Execution Mode always allows user input**
   - Composer is always visible and accessible
   - Never auto-generates user messages
   - Operator types every lead message

✅ **Conversation history is immutable**
   - Cannot edit past turns
   - Sending from non-leaf node automatically forks
   - No append to history

✅ **Automatic forking (no confirmation)**
   - UI decides based on cursor position
   - No modal dialogs
   - Seamless branch creation

## UI Specifications

### Visual Components

```
┌─────────────────────────────────────────────┐
│ [Type as the lead…                        ] │
│ [                                         ] │
│                            [Fork & Send] ▶ │
└─────────────────────────────────────────────┘
```

**Textarea:**
- Placeholder: `"Type as the lead…"`
- Multi-line (`maxRows: 3`)
- Full width
- Auto-expanding

**Action Button:**
- Right-aligned
- Dynamic label:
  - `"Send"` → when selected node is branch leaf
  - `"Fork & Send"` → when selected node is NOT the leaf
- Disabled when input is empty or sending
- Shows `"Sending..."` during API calls

### Keyboard Behavior

| Key Combination | Action |
|-----------------|--------|
| `Enter` | Send / Fork & Send |
| `Shift + Enter` | New line |

## Behavior Logic

### Leaf Detection

```typescript
const isLeafNode = () => {
  if (!selectedNodeId) return true;
  const selectedNode = nodes.find(n => n.nodeId === selectedNodeId);
  if (!selectedNode) return true;
  
  // Check if any node has this as parent
  return !nodes.some(n => n.parentNodeId === selectedNodeId);
};
```

A node is a "leaf" if no other node references it as a parent.

### Send Handler

```typescript
const handleSendMessage = async () => {
  if (!userInput.trim() || isSending) return;

  const isLeaf = isLeafNode();

  setIsSending(true);
  try {
    // If not a leaf, fork automatically (no confirmation)
    if (!isLeaf && selectedNodeId) {
      const selectedNode = nodes.find(n => n.nodeId === selectedNodeId);
      const branchLabel = `Fork ${Date.now()} (from Turn ${selectedNode?.turnNumber || '?'})`;
      await forkSimulation(selectedNodeId, branchLabel);
    }
    
    // Send message (either on current branch or new fork)
    await stepSimulation(userInput);
    setUserInput('');
  } catch (error) {
    console.error('Failed to send:', error);
    alert('Failed to send message. Check console for details.');
  } finally {
    setIsSending(false);
  }
};
```

**Flow:**
1. Check if selected node is a leaf
2. If **not a leaf** → fork automatically (no prompt)
3. Send user message via `/simulator/step`
4. Clear input field
5. Keep focus in composer

## Integration with Execution Tree

### Fork-on-Send Behavior

When sending from a non-leaf node:

1. **Automatic fork creation**
   - New branch label: `"Fork {timestamp} (from Turn {N})"`
   - No modal confirmation
   - Immediate execution

2. **Tree updates automatically**
   - New branch appears in Execution Tree
   - Cursor moves to new branch leaf
   - History up to fork point is preserved

3. **Playback advances**
   - New user turn node added
   - New agent response node added
   - Readiness panel updates
   - Inspector data available for new turns

### State Synchronization

The composer is wired to `SimulatorContext`:

```typescript
const {
  currentRun,
  activeBranchId,
  selectedNodeId,
  selectNode,
  stepSimulation,
  forkSimulation,
  getNodesForBranch
} = useSimulator();
```

**On send:**
- `stepSimulation(userInput)` → POST `/simulator/step`
- `forkSimulation(nodeId, label)` → POST `/simulator/fork` (if needed)

**Context automatically:**
- Updates `nodes` array
- Advances `selectedNodeId` to new leaf
- Triggers re-render of ExecutionTree, Playback, ReadinessPanel

## API Payloads

### /simulator/step

```json
{
  "runId": "run_abc123",
  "branchId": "branch_xyz",
  "cursorNodeId": "node_current_leaf",
  "userMessage": "text typed by operator"
}
```

**Backend returns:**
- New user turn node
- New agent turn node (with executionDecision, reasoning, etc.)
- Updated knownFacts
- Updated readiness delta

### /simulator/fork

```json
{
  "runId": "run_abc123",
  "fromNodeId": "node_history_point",
  "branchLabel": "Fork 1736227461534 (from Turn 3)"
}
```

**Backend returns:**
- New `branchId`
- Copy of history up to fork point
- New leaf node ready for continuation

## Example Interactions

### Scenario 1: Send at Leaf (Normal)

```
1. User types: "I want to lose 10 pounds"
2. Cursor is on Turn 5 (current leaf)
3. Button shows: "Send"
4. User clicks Send
5. → POST /simulator/step
6. → New Turn 6 (user) + Turn 7 (agent) appear
7. → Input cleared, focus retained
```

### Scenario 2: Send from History (Fork)

```
1. User clicks Turn 2 in ExecutionTree
2. Cursor moves to Turn 2 (NOT a leaf)
3. Button shows: "Fork & Send"
4. User types: "Actually, I'm not interested"
5. User clicks "Fork & Send"
6. → POST /simulator/fork (from Turn 2)
7. → POST /simulator/step
8. → New branch "Fork 1736... (from Turn 2)" appears in tree
9. → New Turn 3' (user) + Turn 4' (agent) on new branch
10. → Input cleared, cursor on new branch leaf
```

## What This Component Does NOT Do

❌ Does NOT auto-generate user messages
❌ Does NOT allow editing past turns
❌ Does NOT show fork confirmation dialogs
❌ Does NOT expose system internals to the "lead"
❌ Does NOT provide undo/redo for history
❌ Does NOT collapse or merge branches

## Component Location

**File:** `packages/kx-axis-fe/src/components/Simulator/Playback.tsx`

**Lines:**
- 238-243: `handleKeyPress` (keyboard behavior)
- 204-210: `isLeafNode` (leaf detection)
- 212-236: `handleSendMessage` (send/fork logic)
- 290-320: UI rendering (textarea + button)

## Testing Checklist

- [ ] Textarea accepts multi-line input
- [ ] Enter sends message (at leaf)
- [ ] Shift+Enter creates new line
- [ ] Button shows "Send" when at leaf
- [ ] Button shows "Fork & Send" when on non-leaf
- [ ] Fork happens automatically (no dialog)
- [ ] New branch appears in ExecutionTree
- [ ] Input clears after send
- [ ] Focus stays in composer
- [ ] Playback advances to new turn
- [ ] ReadinessPanel updates with new facts
- [ ] Inspector shows data for new turns
- [ ] Disabled when input is empty
- [ ] Shows "Sending..." during API call

## Success Criteria

✅ A first-time operator can:
1. Select a scenario
2. Type as the lead
3. See agent responses
4. Navigate history
5. Fork from any point
6. Understand causality

✅ Without:
- Reading documentation
- Understanding internals
- Modal interruptions
- Ambiguous button states

**The User Turn Composer makes Execution Mode a true simulator.**



