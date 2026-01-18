# Progressive Focus Layout - Execution Mode Rebalance

## Core Design Law

```
The tree is structural.
The chat is illustrative.

Chat shows what happened.
Tree shows why reality diverged.
```

**Final Line:**
```
When there is one path, show the conversation.
When there are many paths, show the structure.
```

---

## Problem Statement

The previous layout treated Execution Mode like "a chat app with sidebars":
- Fixed narrow tree (280px)
- Wide chat panel (dominant)
- Always-visible readiness panel

**Result:** The UI emphasized dialogue over structure, making it feel like a messaging app rather than a branching execution engine.

---

## Solution: Progressive Focus

The UI now **automatically shifts emphasis** based on branching complexity, without tabs or mode switches.

### A) Playback Focus (Default, Simple Cases)

**Triggered when:**
- Single branch exists
- Shallow depth (≤ 3 turns)

**Layout:**
```
┌──────────┬─────────────────────────┬───────────┐
│   Tree   │        Playback         │ Readiness │
│  (280px) │        (wide)           │  (320px)  │
│          │                         │           │
│  Narrow  │    Emphasize dialogue   │  Visible  │
└──────────┴─────────────────────────┴───────────┘
```

**Purpose:** When the conversation is linear, emphasize the chat. The tree is supportive but not dominant.

---

### B) Branching Focus (Automatic)

**Triggered when ANY of:**
- Multiple branches exist (branchCount > 1)
- Depth exceeds threshold (maxDepth > 3)

**Layout:**
```
┌─────────────────┬──────────────────┬────┐
│      Tree       │    Playback      │ R  │
│    (450px)      │    (medium)      │ E  │
│                 │                  │ A  │
│   Wide + focus  │  Still readable  │ D  │
│   on structure  │                  │ Y  │
└─────────────────┴──────────────────┴────┘
```

**Purpose:** When reality branches, the tree becomes dominant. Chat remains readable but is no longer the primary focus. Readiness collapses to a minimal vertical bar.

**Visual cue:** "You are now reasoning about structure, not dialogue."

---

## Implementation Details

### 1. Resizable Execution Tree

**User Control:**
- Drag handle between Tree and Playback
- Visual indicator (DragIndicatorIcon) on hover
- Smooth cursor change (ew-resize)

**Constraints:**
```typescript
const TREE_MIN_WIDTH = 260;          // Never smaller
const TREE_MAX_WIDTH_PERCENT = 0.4;  // Max 40% of viewport
```

**Default Widths:**
```typescript
const TREE_DEFAULT_NARROW = 280;   // Playback Focus
const TREE_DEFAULT_WIDE = 450;     // Branching Focus
```

**Auto-Adjustment:**
- When branching complexity increases → Tree auto-expands to 450px
- When branches collapse back to 1 → Tree auto-shrinks to 280px
- User can manually override at any time

---

### 2. Branching Complexity Detection

```typescript
const branchCount = currentRun?.branches.length || 0;
const maxDepth = currentRun?.nodes.reduce((max, node) => 
  Math.max(max, node.turnNumber), 0) || 0;

const isBranchingFocus = branchCount > 1 || maxDepth > BRANCHING_DEPTH_THRESHOLD;
```

**Threshold:**
```typescript
const BRANCHING_DEPTH_THRESHOLD = 3;
```

**Why 3 turns?**
- Turn 1: Agent greeting
- Turn 2: User reply
- Turn 3: Agent response
- Beyond this, the conversation has meaningful depth

**Branching Triggers:**
| Condition | Playback Focus | Branching Focus |
|-----------|----------------|-----------------|
| 1 branch, 2 turns | ✅ | ❌ |
| 1 branch, 4 turns | ❌ | ✅ (depth > 3) |
| 2 branches, 2 turns | ❌ | ✅ (multiple branches) |

---

### 3. Readiness Panel Behavior

**Playback Focus (Default):**
```
┌───────────────────┐
│   READINESS       │
│                   │
│ ✓ Known so far: 2 │
│   - contact.email │
│   - contact.phone │
│                   │
│ ⚠ Still needed: 1 │
│   - goal          │
│                   │
│ 🔓 Unlocks        │
│   - Booking       │
└───────────────────┘
```
- Full width (320px)
- All sections expanded
- Supports detailed reasoning

**Branching Focus (Collapsed):**
```
┌──┐
│R │
│E │ [2]  ← Known facts count
│A │ 
│D │ [1]  ← Missing facts count
│Y │
└──┘
```
- Minimal width (48px)
- Vertical text label
- Summary badges only
- Click to expand temporarily

**Manual Override:**
- User can click to expand when collapsed
- Close button appears when manually expanded
- State resets when focus mode changes

---

### 4. Drag Handle Implementation

**Visual Design:**
```
┌─────────┤│├──────────┐
│  Tree   │││ Playback │
│         │││          │
│         │││          │
│         │⋮│          │  ← DragIndicatorIcon
│         │││          │
│         │││          │
└─────────┴┴┴──────────┘
```

**Interaction:**
- 8px wide hit area
- Icon button centered vertically
- Hover: background changes to primary.light
- Active: cursor becomes ew-resize
- Dragging: entire body cursor + user-select: none

**UX Polish:**
```typescript
document.body.style.cursor = 'ew-resize';       // Global cursor
document.body.style.userSelect = 'none';        // Prevent text selection
```

---

## Component Changes

### ExecutionMode.tsx

**New Features:**
1. State management for tree width
2. Branching complexity detection
3. Resize handler with mouse events
4. Auto-width adjustment based on focus mode
5. Drag handle rendering

**Props Passed:**
- `ExecutionTree`: `isCompact={!isBranchingFocus}`
- `ReadinessPanel`: `isCollapsed={isBranchingFocus}`

---

### ExecutionTree.tsx

**New Prop:**
```typescript
interface ExecutionTreeProps {
  isCompact?: boolean;
}
```

**Future Enhancement (Not Yet Implemented):**
When `isCompact` is true, the tree can:
- Collapse agent-only nodes into compact rows
- Group User + Agent into single visual units
- Emphasize divergence points (user messages with fork icons)
- Reduce padding/margins for higher information density

**Why not implemented yet:**
- Current tree structure is already reasonably compact
- Complexity detection alone provides immediate value
- Density scaling can be added incrementally

---

### ReadinessPanel.tsx

**New Prop:**
```typescript
interface ReadinessPanelProps {
  isCollapsed?: boolean;
}
```

**Collapsed State:**
- Width: 48px
- Vertical "READY" label (rotated -90deg)
- Summary badges: ✓ Known (count), ⚠ Still needed (count)
- Tooltips on hover
- Click to expand

**Expanded State:**
- Width: 320px
- Full accordion sections
- Close button (when manually expanded during branching focus)

---

## User Experience

### Scenario 1: Starting a Simulation (Playback Focus)

**Initial State:**
```
- User: Starts "Fitness Onboarding" scenario
- System: Creates 1 branch, Turn 1 (agent greeting)
- Layout: Tree (280px narrow), Chat (wide), Readiness (visible)
```

**Why:** Single path, no branching → Emphasize the conversation.

---

### Scenario 2: Conversation Progresses (Still Playback)

**State:**
```
- Turns: 1, 2, 3 (still ≤ 3)
- Branches: 1
- Layout: Unchanged (playback focus)
```

**Why:** Simple linear conversation → Keep emphasis on dialogue.

---

### Scenario 3: Depth Increases (Auto-Transition to Branching Focus)

**State:**
```
- Turns: 1, 2, 3, 4 (depth > 3)
- Branches: 1
- Layout: Tree auto-expands to 450px, Readiness collapses
```

**Why:** Conversation has meaningful depth → Show structure.

**Visual Feedback:**
- Tree smoothly expands (CSS transition)
- Readiness panel collapses to vertical bar
- Chat remains readable but less dominant

---

### Scenario 4: User Forks from Turn 2 (Strong Branching Focus)

**State:**
```
- Turns: 4+
- Branches: 2 (Main + Alternate Reply from Turn 2)
- Layout: Tree at 450px (or user's manual width), Readiness collapsed
```

**Why:** Multiple branches → Structure is critical to understanding.

**Tree Shows:**
```
Main
  ├─ Turn 1 [ADVANCE]
  ├─ Turn 2 [ADVANCE] ⑂
  ├─ Turn 3 [ADVANCE]
  └─ Turn 4 [ADVANCE]

Alternate Reply from Turn 2
  ├─ Turn 1 [ADVANCE] (shared)
  ├─ Turn 2 [STALL] ⑂
  └─ Turn 3 [EXPLAIN]
```

**Purpose:** User needs to compare branches, see divergence points, understand causality → Tree is dominant.

---

### Scenario 5: User Manually Resizes Tree

**Action:**
- User drags handle to 500px

**Result:**
- Tree stays at 500px (overrides auto-width)
- `isResizing` flag prevents auto-adjustment during drag
- After release, manual width is respected

**Note:** If branching complexity changes again, auto-width kicks in (unless user resizes again).

---

## Layout Math

### Width Calculations

**Container Width:** 1920px (example)

**Playback Focus:**
```
Tree:      280px  (14.6% of container)
Playback:  1320px (68.75% of container)
Readiness: 320px  (16.7% of container)
```

**Branching Focus:**
```
Tree:      450px  (23.4% of container)
Playback:  1422px (74% of container)
Readiness: 48px   (2.5% of container)
```

**Constraints:**
```
Tree min:  260px
Tree max:  768px (40% of 1920px)
```

---

## Success Criteria

| Metric | Before | After |
|--------|--------|-------|
| Tree emphasis | Fixed 280px, always secondary | 280px → 450px based on complexity |
| Readiness visibility | Always 320px, competes with structure | 320px → 48px when branches exist |
| Resizability | None | User-controlled, min 260px, max 40% |
| Auto-adaptation | None | Automatic based on branching |
| Focus communication | Ambiguous (chat-like) | Clear (structure vs dialogue) |

---

## Testing Checklist

After refresh:

### Visual Checks
- [ ] Tree starts at 280px (playback focus)
- [ ] Readiness panel is full width (320px)
- [ ] Drag handle visible between tree and chat
- [ ] Hover on drag handle changes background color
- [ ] DragIndicatorIcon appears in handle

### Interaction Checks
- [ ] Drag handle left/right resizes tree
- [ ] Tree width respects min (260px) and max (40% viewport)
- [ ] Cursor changes to ew-resize during drag
- [ ] Text selection disabled during drag
- [ ] Release stops resizing

### Auto-Transition Checks
- [ ] Create 4th turn → Tree auto-expands to 450px
- [ ] Create 2nd branch → Tree auto-expands to 450px
- [ ] Readiness collapses to 48px vertical bar
- [ ] Readiness shows summary badges (counts)
- [ ] Click "READY" label → Panel expands
- [ ] Close button appears when manually expanded
- [ ] Click close → Panel collapses again

### Edge Cases
- [ ] Small viewport (1366px) → Tree max width respects 40% rule
- [ ] Manual resize during playback focus → Width respected
- [ ] Transition to branching focus → Auto-width overrides manual (unless currently resizing)
- [ ] Delete branch (back to 1) → Tree auto-shrinks to 280px
- [ ] Readiness re-expands automatically

---

## Philosophy

### Why Progressive Focus?

**Tabs are a failure mode.** They force the user to make a conscious decision:
- "Do I want to see structure or dialogue?"
- "Am I in tree mode or chat mode?"

**Progressive focus is implicit.** The UI adapts automatically:
- Simple conversation → Emphasize chat
- Complex branching → Emphasize tree

**No cognitive overhead.** The user doesn't think about modes. The UI just "feels right."

---

### Why Resizable Tree?

**Advanced users live in the tree.** When debugging complex branches:
- They need space to see the full structure
- They need to compare divergence points
- They need to visually trace causality

**Novice users don't.** They want to see the conversation.

**Solution:** Let the UI start opinionated (narrow tree) but give power users manual control.

---

### Why Collapse Readiness in Branching Focus?

**Readiness is reasoning support, not structure.**

When branches exist:
- Primary question: "Why did reality diverge?"
- Secondary question: "What was known at that point?"

**Readiness data is still accessible** (click to expand), but it doesn't compete with the tree.

---

## Future Enhancements (Not Yet Implemented)

### 1. Tree Density Scaling

When `isCompact` is true:
- Agent-only turns collapse into single lines
- User + Agent grouped visually as "Turn X"
- Fork icons more prominent
- Vertical padding reduced

**Purpose:** Higher information density for complex trees.

### 2. Visual Divergence Highlighting

When branches exist:
- Shared history (before fork) shown in muted color
- Divergence point highlighted
- Branch paths color-coded

**Purpose:** Make fork points visually obvious at a glance.

### 3. Minimap for Deep Trees

When depth > 10:
- Small minimap in tree header
- Click to jump to turn
- Current viewport highlighted

**Purpose:** Navigate very deep conversations.

### 4. Horizontal Readiness (Branching Focus Alternative)

Instead of collapsing to vertical bar:
- Show horizontal strip at bottom
- 3 compact sections: Known | Missing | Unlocks
- Chips only, no descriptions

**Purpose:** Alternative layout for users who need readiness visible but don't want it competing with tree.

---

## Summary

| Aspect | Implementation |
|--------|----------------|
| **Progressive Focus** | Auto-detect branching complexity, adjust widths |
| **Resizable Tree** | Drag handle, min 260px, max 40% viewport |
| **Readiness Collapse** | 320px → 48px vertical bar when branches exist |
| **Auto-Width** | 280px (playback) → 450px (branching) |
| **Manual Override** | User can resize tree at any time |
| **Complexity Triggers** | branchCount > 1 OR maxDepth > 3 |

**Design Law Enforced:**
```
The tree is structural.
The chat is illustrative.

When there is one path, show the conversation.
When there are many paths, show the structure.
```

**The UI now feels like a branching execution engine, not a chat app.** ✅




