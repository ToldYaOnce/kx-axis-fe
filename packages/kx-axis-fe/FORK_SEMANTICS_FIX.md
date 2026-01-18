# Fork Semantics Fix - "Alternate User Reply"

## Problem Statement

The UI incorrectly suggested that users could "fork agent responses," which violates the core invariant of KxAxis:

**Agent responses are deterministic observations, not editable choices.**

### What Was Wrong

1. ❌ Fork icon (CallSplitIcon) next to EVERY turn in the tree
2. ❌ Button label "Fork & Send" implied forking the agent
3. ❌ Fork dialog asked users to name branches explicitly
4. ❌ Tree labels said "Forked from turn X" (ambiguous)
5. ❌ No visual distinction between agent output and user input

**Conceptual Error:** The UI suggested you could "branch the conversation" at any point, as if the agent's response was negotiable.

**Truth:** Branching exists ONLY to explore alternate user inputs. The agent is deterministic.

---

## Core Invariant (Enforced)

```
Forking ALWAYS means:
"What if the user had said something different at this point?"

The agent is NEVER:
- Forked
- Edited
- Directly branched

Agent messages are READ-ONLY outcomes.
```

---

## Changes Applied

### 1. Removed Fork Icons from Tree Nodes

**Before:**
```tsx
<TreeNode>
  <TurnInfo />
  <IconButton onClick={handleFork}>  // ❌ Implies agent is forkable
    <CallSplitIcon />
  </IconButton>
</TreeNode>
```

**After:**
```tsx
<TreeNode>
  <TurnInfo />
  {/* No fork icon - turns are immutable observations */}
</TreeNode>
```

**Why:** Turn nodes represent agent responses (outcomes). They are observations, not choices. Adding a fork icon next to them implies you can "edit the agent's response," which is conceptually incorrect.

---

### 2. Renamed Button Label

**Before:**
```tsx
<Button>
  {isLeafNode() ? 'Send' : 'Fork & Send'}
</Button>
```

**After:**
```tsx
<Button
  title={isLeafNode() 
    ? 'Send message' 
    : 'Explore a different user reply from this point'
  }
>
  {isSending ? 'Sending...' : (isLeafNode() ? 'Send' : 'Alternate Reply')}
</Button>
```

**Why:**
- ✅ "Alternate Reply" clearly means "user says something different"
- ✅ Tooltip explains the mental model
- ✅ No ambiguity about what's being forked (the user input, not the agent)

---

### 3. Removed Fork Dialog

**Before:**
- User clicks fork icon
- Dialog opens: "Fork Simulation - Create a new branch"
- User types branch name
- Dialog closes, branch created

**After:**
- User types message from non-leaf turn
- System automatically creates branch: "Alternate Reply from Turn X"
- No modal interruption
- Branching is implicit in the action

**Why:**
- ✅ Forking is no longer a separate "decision"
- ✅ The composer IS the fork mechanism
- ✅ Typing from history = "what if I said this instead?"
- ✅ Eliminates unnecessary user confirmation step

---

### 4. Updated Branch Labels

**Before:**
```
Branch from Turn 1
Forked from turn 1
Fork 1736227461534 (from Turn 1)
```

**After:**
```
Alternate Reply from Turn 1
```

**Why:**
- ✅ "Alternate Reply" immediately clarifies that this is a different USER INPUT
- ✅ Removes timestamp noise
- ✅ Human-readable and conceptually accurate

---

### 5. Added Contextual Helper Text

**New Feature:**
When composer button shows "Alternate Reply," a helper text appears above:

```
💡 Exploring a different reply from Turn 3
```

**Why:**
- ✅ Makes the current state obvious
- ✅ Reminds user they're exploring a "what if" scenario
- ✅ No need for modal explanations

---

## UI Semantics Enforced

### The Composer IS the Fork Mechanism

```
┌─────────────────────────────────────────┐
│ Playback Timeline                       │
│                                         │
│ Turn 1: [Agent message]                 │
│ Turn 2: [User] "I want to bench 300"    │
│ Turn 3: [Agent] "Nice! Where are you?"  │
│                                         │
├─────────────────────────────────────────┤
│ User selects Turn 2 (not a leaf)       │
│                                         │
│ 💡 Exploring a different reply from Turn 2 │
│ ┌───────────────────────────────────┐   │
│ │ Type as the lead…                 │   │
│ │ [User types: "Actually, I quit"]  │   │
│ └───────────────────────────────────┘   │
│                        [Alternate Reply]│
└─────────────────────────────────────────┘
```

**User Action:** Typing in composer from non-leaf turn
**System Behavior:** Creates "Alternate Reply from Turn 2" automatically
**Mental Model:** "What if I had said something different at Turn 2?"

---

## Visual Hierarchy

### What Users See (After Fix)

**Execution Tree (Left Panel):**
```
Main
├─ Turn 1 [ADVANCE]      ← No fork icon
└─ Turn 2 [ADVANCE]      ← No fork icon

Alternate Reply from Turn 1
└─ Turn 1 [ADVANCE]      ← Shared history
└─ Turn 2 [STALL]        ← Different outcome (from different user input)
```

**Playback (Center Panel):**
```
Turn 1 [ADVANCE]
  Agent: "Hey! Ready to crush goals?"

Turn 2 [ADVANCE]
  User: "I want to bench 300"
  Agent: "Nice! Where are you at?"

[If on non-leaf:]
💡 Exploring a different reply from Turn 1
[ Type as the lead…                    ]
[                          [Alternate Reply] ]
```

---

## Interaction Flow

### Scenario: User Wants to Explore "What If?"

1. **User clicks Turn 2** in tree (past turn, not leaf)
2. **System:**
   - Selects Turn 2
   - Loads conversation history up to Turn 2
   - Changes button to "Alternate Reply"
   - Shows helper: "💡 Exploring a different reply from Turn 2"
3. **User types:** "Actually, I changed my mind"
4. **User clicks "Alternate Reply"**
5. **System:**
   - Creates branch: "Alternate Reply from Turn 2"
   - Sends user message via `/simulator/step`
   - Agent generates NEW response (based on different input)
   - Tree updates with new branch
6. **Result:**
   - User sees how conversation would have gone if they'd said something different
   - Original conversation (Main branch) is preserved
   - No modal interruptions
   - No explicit "fork decision"

---

## What Was Removed

| Removed Element | Reason |
|-----------------|--------|
| Fork icon on TreeNode | Implied agent responses were forkable |
| Fork dialog | Unnecessary friction; forking is automatic |
| "Fork & Send" label | Ambiguous about what's being forked |
| Manual branch naming | System-generated names are clearer |
| CallSplitIcon import | No longer used |
| useState for fork dialog | Dialog removed |
| handleForkClick | Forking is automatic |
| handleForkConfirm | No confirmation needed |

---

## What Was Added

| Added Element | Purpose |
|---------------|---------|
| "Alternate Reply" label | Clarifies that user input is what's being alternated |
| Helper text on non-leaf | Contextual reminder of what's happening |
| Tooltip on button | Explains the action without requiring docs |
| Auto-generated branch names | "Alternate Reply from Turn X" is self-explanatory |

---

## Files Modified

| File | Changes |
|------|---------|
| `Playback.tsx` | Button label "Alternate Reply", helper text, tooltip, branch naming |
| `ExecutionTree.tsx` | Removed fork icon, removed fork dialog, updated branch label text, cleaned up imports |

**Lines Changed:** ~60
**Conceptual Clarity:** ∞

---

## Success Criteria

After this fix, a first-time user should understand:

✅ Agent messages are deterministic outcomes (read-only)
✅ Branching happens by typing a different user message
✅ "Alternate Reply" = "What if I said something else?"
✅ No need to understand "forking" or "branching" terminology
✅ The UI itself teaches the mental model

**Anti-Success (What Should NOT Be Possible):**

❌ User cannot "edit agent response"
❌ User cannot "fork the agent"
❌ User cannot "branch from agent turn"
❌ No UI element suggests agent is negotiable

---

## Testing Checklist

After refresh:

- [ ] No fork icons visible next to turns in tree
- [ ] Button says "Send" when on leaf turn
- [ ] Button says "Alternate Reply" when on non-leaf turn
- [ ] Helper text appears: "💡 Exploring a different reply..."
- [ ] Tooltip on "Alternate Reply" button is helpful
- [ ] Typing from Turn 2 creates "Alternate Reply from Turn 2"
- [ ] Branch labels in tree say "Alternate reply from turn X"
- [ ] No fork dialog appears
- [ ] Branching is seamless and automatic

---

## Conceptual Correctness

### Before (Incorrect):
```
User Action: Click fork icon on Turn 3
Mental Model: "I'm forking the conversation at this point"
Ambiguity: What exactly is being forked? The agent? The turn? The state?
```

### After (Correct):
```
User Action: Type message from Turn 2
Mental Model: "What if I had said THIS instead of what I actually said?"
Clarity: The user input is what's being alternated. Agent responds deterministically.
```

---

## Philosophy

**The agent is a deterministic function:**
```
agent(conversationHistory, knownFacts, controllerOutput) → agentMessage
```

**Branching explores different inputs to that function:**
```
Main:        agent([user: "I want to bench 300"]) → "Nice! Where are you?"
Branch:      agent([user: "I want to lose weight"]) → "Great! What's your goal?"
```

**The UI now reflects this truth:**
- No fork icons (agent is not a choice point)
- "Alternate Reply" (user input is the variable)
- Automatic branching (implicit in the action of typing)
- Helper text (reminds user of the mental model)

---

## Summary

**What Changed:**
- Removed fork icons from turn nodes
- Changed "Fork & Send" → "Alternate Reply"
- Removed fork dialog (automatic branching)
- Updated branch labels to "Alternate Reply from Turn X"
- Added contextual helper text

**What Stayed the Same:**
- Backend fork logic (unchanged)
- Automatic fork-on-send from non-leaf (working as designed)
- Tree structure and node selection

**Why This Matters:**
The UI no longer suggests you can "edit the agent." It now correctly communicates: **"Branching = exploring different user inputs to a deterministic system."**

**The simulator is now semantically correct.** ✅




