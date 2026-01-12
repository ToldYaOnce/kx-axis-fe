# User Message Causality - Fork Semantics v2

## Core Invariant (Written in Code Comments)

```
BRANCHES EXIST BECAUSE THE USER SAID SOMETHING DIFFERENT.
THE AGENT MERELY RESPONDED.
```

This is now documented in:
- `Playback.tsx` (file header + handleSendMessage function)
- `ExecutionTree.tsx` (file header)

---

## Problem With Previous Implementation

The previous fix (v1) improved button labels and removed fork icons from tree nodes, but it still had a conceptual ambiguity:

**Where exactly do branches originate?**

- ❌ Branches appeared to originate "at a turn" (ambiguous)
- ❌ No visual distinction between user input (controllable) and agent output (deterministic)
- ❌ Composer behavior didn't reflect whether you selected a user or agent message

**Result:** Users could still be confused about what they were "forking"

---

## Solution: Anchor Forks at User Messages

### Core Principle

```
Fork = Alternate USER INPUT
Agent Response = Deterministic OUTCOME
```

**Visual Proof:**
- 🌱 User messages have branch indicators
- 🤖 Agent messages have NO fork affordance
- Composer behavior changes based on selection type

---

## Changes Applied

### 1. User Message Bubbles = Branch Points

**Visual Indicator Added:**

```tsx
{/* User Message Bubble */}
<Box sx={{ /* blue bubble */ }}>
  <Typography>{node.userMessage}</Typography>
  
  {/* Branch point indicator */}
  <Box sx={{ /* small circle with 🌱 */ }}
    title="Branch point: User input can be alternated"
  >
    🌱
  </Box>
</Box>
```

**Why:**
- ✅ Makes it visually obvious that user messages are branch points
- ✅ 🌱 emoji reinforces "this is where branches grow"
- ✅ Tooltip explains the concept
- ✅ Always visible (not just on hover)

---

### 2. Agent Message Bubbles = Read-Only Outcomes

**Visual Treatment:**

```tsx
{/* Agent Message Bubble - READ-ONLY OUTCOME */}
<Box sx={{
  bgcolor: '#f5f5f5',
  opacity: 0.9,  // Slightly faded
  border: 'none', // No selection border
}}>
  <Typography sx={{ fontStyle: 'italic' }}>
    {node.agentMessage}
  </Typography>
</Box>
```

**What Changed:**
- ❌ Removed selection border on agent messages
- ❌ Removed hover effects
- ✅ Added slight opacity (0.9) to convey "read-only"
- ✅ Italic text style (observations, not actions)

**Why:**
- ✅ Visually distinct from user messages
- ✅ Clearly not interactive/forkable
- ✅ Reinforces "this is an outcome, not a choice"

---

### 3. Composer Behavior Based on Selection Type

#### Case A: User Turn Selected (Non-Leaf)

```
Selected: Turn 2 (user message)
Composer:
  Placeholder: "Alternate reply to Turn 2…"
  Button: "Alternate Reply"
  Helper: "🌱 Alternate reply to Turn 2"
```

#### Case B: Agent Turn Selected

```
Selected: Turn 1 (agent-only message)
Composer:
  Placeholder: "Select a user message to branch..."
  Button: "Send" (disabled)
  Helper: "⚠️ Agent messages are read-only outcomes. Select a user message to create an alternate branch."
  Background: Gray (disabled state)
```

#### Case C: Leaf Turn Selected

```
Selected: Latest turn
Composer:
  Placeholder: "Type as the lead…"
  Button: "Send"
  Helper: (none)
```

**Implementation:**

```tsx
const isUserTurn = selectedNode?.userMessage !== undefined && selectedNode?.userMessage !== null;
const isAgentOnlyTurn = selectedNode && !selectedNode.userMessage && selectedNode.agentMessage;

<TextField
  placeholder={
    isAgentOnlyTurn 
      ? "Select a user message to branch..." 
      : isLeafNode() 
        ? "Type as the lead…" 
        : `Alternate reply to Turn ${selectedNode?.turnNumber}…`
  }
  disabled={isAgentOnlyTurn || !currentRun}
  sx={{
    '& .MuiOutlinedInput-root': {
      backgroundColor: isAgentOnlyTurn ? '#f5f5f5' : 'white',
    }
  }}
/>
```

**Why:**
- ✅ Composer state reflects what's selected
- ✅ Impossible to fork from agent message (disabled)
- ✅ Clear instructions when wrong selection type
- ✅ Placeholder text reinforces the mental model

---

### 4. Execution Tree Visual Indicators

**User Turns (Branch Points):**

```tsx
<Paper sx={{
  borderLeftWidth: hasUserMessage ? 4 : 2,  // Thicker left border
  borderLeftColor: hasUserMessage ? 'primary.light' : 'divider',
}}>
  <Typography>
    Turn {node.turnNumber}
    {hasUserMessage && <Box component="span">🌱</Box>}
  </Typography>
</Paper>
```

**Visual Treatment:**
- ✅ 🌱 emoji next to turn number (if user message present)
- ✅ Thicker left border (4px vs 2px)
- ✅ Blue left border (primary.light)

**Agent-Only Turns:**
- ✅ Standard 2px gray border
- ✅ No 🌱 emoji
- ✅ Visually subordinate

**Why:**
- ✅ Tree visually distinguishes branch points
- ✅ Consistent with playback visuals
- ✅ No need to click to understand structure

---

### 5. Branch Labels Updated

**Format:**
```
Alternate Reply from Turn X
```

**Already implemented in previous fix, now reinforced by:**
- Visual indicators showing which turns are user turns
- Helper text in composer
- Code comments documenting causality

---

## Visual Hierarchy Summary

| Element | Treatment | Message |
|---------|-----------|---------|
| User message bubble | Blue, 🌱 indicator, clickable | "Branch point - user input" |
| Agent message bubble | Gray, faded, italic | "Read-only outcome" |
| User turn in tree | 🌱 emoji, thick blue border | "Branch point" |
| Agent turn in tree | Standard border | "Observation" |
| Composer (user selected) | Enabled, "Alternate Reply" | "Change user input" |
| Composer (agent selected) | Disabled, gray, warning | "Can't fork agent" |

---

## Interaction Flow

### Scenario: User Wants to Explore "What If?"

**Step 1:** User views conversation history
```
Turn 1: Agent: "Hey! Ready to crush goals?"
Turn 2: 👤 User: "I want to bench 300" 🌱
Turn 3: Agent: "Nice! Where are you at?"
```

**Step 2:** User clicks Turn 2 bubble (user message)
```
- Turn 2 becomes selected (blue highlight)
- Tree shows Turn 2 with 🌱 indicator
- Composer updates:
  - Placeholder: "Alternate reply to Turn 2…"
  - Button: "Alternate Reply"
  - Helper: "🌱 Alternate reply to Turn 2"
```

**Step 3:** User types different message
```
"Actually, I want to lose weight"
```

**Step 4:** User clicks "Alternate Reply"
```
- System creates: "Alternate Reply from Turn 2"
- New branch appears in tree
- Playback shows alternate conversation:
  Turn 1: Agent: "Hey! Ready..." (shared)
  Turn 2: 👤 User: "I want to lose weight" 🌱 (NEW)
  Turn 3: Agent: "Great! What's your goal?" (different outcome)
```

---

### Scenario: User Accidentally Selects Agent Message

**Step 1:** User clicks agent message (Turn 3)
```
Turn 3: Agent: "Nice! Where are you at?"
```

**Step 2:** System responds
```
Composer:
  - Background turns gray
  - Textfield disabled
  - Placeholder: "Select a user message to branch..."
  - Button: "Send" (disabled)
  - Helper: "⚠️ Agent messages are read-only outcomes..."
```

**Step 3:** User understands
```
"Oh, I need to select a user message (🌱) to create a branch"
```

**Step 4:** User clicks user message instead
```
Composer enables, shows "Alternate Reply"
```

---

## Code Comments (Invariant Documentation)

### In `Playback.tsx`

```tsx
/**
 * CORE INVARIANT:
 * Branches exist because the user said something different.
 * The agent merely responded.
 */

const handleSendMessage = async () => {
  // CORE INVARIANT: Branches exist because the user said something different.
  // The agent merely responded. This function creates branches ONLY at user message boundaries.
  // Agent responses are deterministic outcomes, never edited or forked.
  
  // ... implementation
};
```

### In `ExecutionTree.tsx`

```tsx
/**
 * Execution Tree - Visual tree of branches and nodes
 * 
 * CORE INVARIANT:
 * Branches exist because the user said something different.
 * The agent merely responded.
 * 
 * Visual Rules:
 * - Branches originate at USER messages (marked with 🌱)
 * - Agent messages are deterministic outcomes (no fork affordance)
 * - Branch labels reflect USER causality: "Alternate Reply from Turn X"
 */
```

### In Composer JSX

```tsx
{/* BRANCHES EXIST BECAUSE THE USER SAID SOMETHING DIFFERENT. THE AGENT MERELY RESPONDED. */}
<Box sx={{ /* composer container */ }}>
  {/* ... */}
</Box>
```

---

## Files Modified

| File | Changes | Lines |
|------|---------|-------|
| `Playback.tsx` | User message indicators, agent styling, composer states, helper text, code comments | ~80 |
| `ExecutionTree.tsx` | User turn visual indicators (🌱, border), code comments | ~15 |

---

## Testing Checklist

After refresh:

### Visual Checks
- [ ] User message bubbles have 🌱 indicator (bottom-right)
- [ ] Agent message bubbles are slightly faded (no indicators)
- [ ] User turns in tree have 🌱 emoji next to turn number
- [ ] User turns in tree have thicker blue left border
- [ ] Agent-only turns have standard thin gray border

### Interaction Checks
- [ ] Click user message (Turn 2) → Composer shows "Alternate Reply"
- [ ] Click agent message (Turn 1) → Composer disabled with warning
- [ ] Click user message → Placeholder says "Alternate reply to Turn X…"
- [ ] Type message → Button enabled
- [ ] Click "Alternate Reply" → New branch: "Alternate Reply from Turn X"
- [ ] New branch appears in tree with correct label

### Edge Cases
- [ ] First turn (agent-only) → Composer warns "Select a user message"
- [ ] Latest turn (leaf) → Composer shows "Send" (not "Alternate Reply")
- [ ] Empty input → Button disabled
- [ ] Typing from agent turn → Still disabled

---

## Conceptual Correctness Achieved

### Before (v1):
```
Ambiguity: Branches originated "at a turn" (unclear if user or agent)
UI: Fork icons removed, but no visual distinction between message types
Result: Better, but still conceptually ambiguous
```

### After (v2):
```
Clarity: Branches originate at USER MESSAGES (visual proof: 🌱)
UI: User messages = branch points, agent messages = read-only outcomes
Result: Conceptually unambiguous, visually self-evident
```

---

## Success Criteria (All Met)

✅ **Visual Proof:** User messages have 🌱 indicator
✅ **No Agent Affordance:** Agent messages have no fork capability
✅ **Composer Reflects Selection:** Different behavior for user vs agent
✅ **Tree Distinction:** User turns visually marked with 🌱 and border
✅ **Helper Text:** Contextual guidance based on selection
✅ **Code Comments:** Invariant documented in multiple locations
✅ **Disabled State:** Can't fork from agent message (composer disabled)
✅ **Branch Labels:** "Alternate Reply from Turn X" (user causality)

---

## Philosophy

### The Deterministic Agent

```
agent(history, facts, controller) → agentMessage
```

**The function is deterministic.**

**Inputs are the only variables:**
- `history` = sequence of user inputs + prior agent responses
- `facts` = what's known so far
- `controller` = control flags

**To explore "what if?":**
```
Different USER INPUT → Different history → Different agentMessage
```

**NOT:**
```
Different AGENT RESPONSE → ??? (makes no sense, agent is deterministic)
```

### The UI Now Reflects This Truth

- 🌱 = "User input can vary"
- 🤖 = "Agent response is determined"
- Composer disabled on agent = "Can't change outcomes, only inputs"
- "Alternate Reply" = "Different user input, deterministic agent response"

---

## Summary

| Aspect | Implementation |
|--------|----------------|
| **Visual Distinction** | 🌱 on user messages, faded agent messages |
| **Interaction Model** | Composer reflects selection type |
| **Tree Indicators** | 🌱 emoji + thick blue border on user turns |
| **Helper Text** | Contextual guidance + warnings |
| **Code Comments** | Invariant documented in 3 places |
| **Disabled States** | Can't fork from agent message |
| **Branch Labels** | "Alternate Reply from Turn X" |

**The UI is now semantically and visually aligned with the truth:**

**Branches exist because the user said something different. The agent merely responded.** ✅

This is no longer just a label change - it's a fundamental UX realignment that makes the correct mental model unavoidable.

