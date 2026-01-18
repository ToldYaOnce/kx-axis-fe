# KxAxis Execution Mode - Compliance with Core Product Rules

This document outlines how the implementation enforces the non-negotiable product rules for the KxAxis Execution Mode.

## Rule 1: Design Mode and Execution Mode are Mutually Exclusive

**Requirement:** Execution Mode does NOT show the conversation canvas.

**Implementation:**
- `DemoApp.tsx` provides a mode toggle (button)
- When mode is "execution", only `<ExecutionMode />` is rendered
- When mode is "design", only `<KxAxisComposer />` is rendered
- The two UIs never overlap or coexist

**Code Location:** `packages/kx-axis-fe/src/demo/DemoApp.tsx`

---

## Rule 2: History is Immutable

**Requirement:** You cannot append to a past turn. Sending input from a past node MUST fork a new branch.

**Implementation:**
- Playback component checks if selected node is a leaf using `isLeafNode()`
- If node has children (non-leaf), user cannot append to it
- Attempting to send from non-leaf triggers automatic fork
- User is prompted with confirmation dialog before forking

**Code Location:** `packages/kx-axis-fe/src/components/Simulator/Playback.tsx`

```typescript
// Check if selected node is a leaf (no children)
const isLeafNode = () => {
  if (!selectedNodeId) return true;
  const selectedNode = nodes.find(n => n.nodeId === selectedNodeId);
  if (!selectedNode) return true;
  
  // Check if any node has this as parent
  return !nodes.some(n => n.parentNodeId === selectedNodeId);
};

const handleSendMessage = async () => {
  const isLeaf = isLeafNode();

  // If not a leaf, we need to fork automatically
  if (!isLeaf && selectedNodeId) {
    const confirmed = confirm(
      'This will create a new branch from this point. Continue?'
    );
    if (!confirmed) return;

    // Fork first, then send
    await forkSimulation(selectedNodeId, branchLabel);
    await stepSimulation(userInput);
  } else {
    // Normal send (at leaf)
    await stepSimulation(userInput);
  }
};
```

---

## Rule 3: The Human Types as the Lead

**Requirement:** The simulator never "auto-plays" the user. There must be a user input composer.

**Implementation:**
- User input composer is fixed at bottom of Playback panel
- Multiline text field with "Type user message..." placeholder
- Send button is only enabled when input is non-empty
- No auto-generation of user messages
- No quick-reply auto-selection (optional chips can be added for convenience, but require explicit user click)

**Code Location:** `packages/kx-axis-fe/src/components/Simulator/Playback.tsx`

---

## Rule 4: Determinism (No Creativity)

**Requirement:** The system is deterministic. No creativity. No hallucinated readiness. Everything shown must come from backend responses.

**Implementation:**
- All execution data comes from `SimulatorContext`, which receives API responses
- UI displays only what is returned by backend:
  - `executionDecision`
  - `reasoning`
  - `controlFlags`
  - `affectScalars`
  - `knownFacts`
  - `readinessDelta`
- No client-side interpretation or modification of execution logic
- ReadinessPanel shows facts grouped by category exactly as returned by API
- Inspector shows raw control flags and reasoning text

**Code Location:**
- `packages/kx-axis-fe/src/context/SimulatorContext.tsx`
- `packages/kx-axis-fe/src/components/Simulator/ReadinessPanel.tsx`
- `packages/kx-axis-fe/src/components/Simulator/Playback.tsx` (Inspector popover)

---

## Rule 5: Forking is First-Class

**Requirement:** Forking must be visible in execution tree, explicit, and automatic when required.

**Implementation:**

### Visual in Execution Tree
- `ExecutionTree` component displays all branches with labels
- Each branch shows its root node and hierarchy
- Node badges show status (VALID/DRIFTED/INVALID)
- Branch switching is explicit (click to select branch)

### Automatic When Required
- When user tries to send from non-leaf node:
  - Button text changes to "Fork & Send"
  - Confirmation dialog appears
  - New branch is created automatically
  - History up to fork point is preserved
  - User's new input is appended to new branch
  - Cursor moves to new branch leaf

### Explicit Fork Action
- ExecutionTree provides "Fork Branch" button
- User can explicitly fork from any node
- Dialog prompts for branch label
- New branch appears in tree immediately

**Code Location:**
- `packages/kx-axis-fe/src/components/Simulator/ExecutionTree.tsx`
- `packages/kx-axis-fe/src/components/Simulator/Playback.tsx` (automatic fork)

---

## Rule 6: Button Behavior - Send vs Fork & Send

**Requirement:** Button must change based on whether selected node is a leaf.

**Implementation:**
- `isLeafNode()` function checks if selected node has children
- Button text is dynamically set:
  - `"Send"` when `isLeafNode() === true`
  - `"Fork & Send"` when `isLeafNode() === false`
- Button behavior changes accordingly:
  - "Send" → calls `stepSimulation()` directly
  - "Fork & Send" → calls `forkSimulation()` then `stepSimulation()`

**Code Location:** `packages/kx-axis-fe/src/components/Simulator/Playback.tsx`

```typescript
<Button
  variant="contained"
  endIcon={<SendIcon />}
  onClick={handleSendMessage}
  disabled={!userInput.trim() || isSending}
  sx={{ minWidth: 140 }}
>
  {isSending ? 'Sending...' : (isLeafNode() ? 'Send' : 'Fork & Send')}
</Button>
```

---

## Rule 7: Causality is Obvious

**Requirement:** Every interaction should make causality obvious.

**Implementation:**

### Execution Inspector (Hover/Click)
- Each turn card has an info icon
- Clicking reveals popover with:
  - Reasoning text (why this decision was made)
  - Control flags (canAdvance, fastTrack, needsExplanation)
  - Affect scalars (pain, urgency, vulnerability)
  - Newly known facts

### Readiness Panel
- **Known so far:** Shows all facts captured, grouped by category
- **Still needed:** Shows missing facts (constraint gaps)
- **Unlocks:** Shows what is now available (readiness delta)
- Uses human-friendly language, not schema jargon

### Turn Metadata
- Each turn shows:
  - Turn number
  - Execution decision badge (color-coded: ADVANCE, STALL, EXPLAIN, etc.)
  - User message and agent response in separate bubbles

**Code Location:**
- `packages/kx-axis-fe/src/components/Simulator/Playback.tsx` (Inspector popover)
- `packages/kx-axis-fe/src/components/Simulator/ReadinessPanel.tsx`

---

## Mock Data Support

**Requirement:** Provide demo scenarios and mock server responses to render UI without backend.

**Implementation:**
- `SimulatorContext` has `mockMode` toggle
- When enabled, uses fixture JSON instead of API calls
- 3 complete demo scenarios provided:
  1. **Fitness Onboarding** → Happy path to booking
  2. **Legal Consultation** → Hesitation, explain, advance
  3. **Real Estate Inquiry** → Constraint change, fast-track
- Each fixture includes full run history with branches and nodes

**Code Location:**
- `packages/kx-axis-fe/src/fixtures/simulatorFixtures.ts`
- `packages/kx-axis-fe/src/context/SimulatorContext.tsx`

---

## Contract Version & Design Drift Detection

**Requirement:** Visually tag nodes as VALID / DRIFTED / INVALID.

**Implementation:**
- Each `SimulatorNode` includes:
  - `contractVersion`: Backend contract version
  - `designVersionHash`: Hash of flow configuration
- Nodes are compared against current versions
- Status badge shown in ExecutionTree:
  - ✅ **VALID**: Versions match
  - ⚠️ **DRIFTED**: Design changed, but contract valid
  - ❌ **INVALID**: Contract version mismatch
- Status computed on the fly per node

**Code Location:**
- `packages/kx-axis-fe/src/types/simulator.ts` (NodeStatus type)
- `packages/kx-axis-fe/src/components/Simulator/ExecutionTree.tsx` (status badges)

---

## Summary

| Rule | Status | Implementation |
|------|--------|----------------|
| Design/Execution Mode Exclusive | ✅ | Mode toggle in DemoApp |
| History Immutable | ✅ | Fork on non-leaf send |
| User Impersonation | ✅ | Manual input composer |
| Deterministic | ✅ | API-driven, no client logic |
| Forking First-Class | ✅ | Tree visualization + auto-fork |
| Send vs Fork & Send | ✅ | Dynamic button based on node |
| Causality Obvious | ✅ | Inspector + Readiness Panel |
| Mock Data | ✅ | 3 demo scenarios with fixtures |
| Version Drift | ✅ | Status badges per node |

**All core product rules are enforced in the UI implementation.**



