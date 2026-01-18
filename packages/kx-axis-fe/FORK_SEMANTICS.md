# Fork Semantics — User Message Causality

## CORE INVARIANT (NON-NEGOTIABLE)

**Branches originate only from alternate USER replies.**

The agent is deterministic and is never forked, edited, or branched directly.

A branch exists only after a different user message is submitted.

---

## UI BEHAVIOR IMPLEMENTED

### 1. Fork Icon on User Messages

**Location:** Blue chat bubbles (user messages) in Playback timeline

**Visual:** CallSplitIcon inside a circular dotted border

**Tooltip:** "Alternate reply from here"

**Behavior:**
- ❌ Does NOT create a branch on click
- ✅ Selects that user message as the divergence anchor
- ✅ Updates composer to "Alternate Reply" mode

### 2. User Turn Composer States

#### State A: Latest Turn (Leaf Node)
- **Button Label:** "Send"
- **Placeholder:** "Type as the lead…"
- **Behavior:** Appends to current branch

#### State B: Prior User Message Selected
- **Button Label:** "Alternate Reply"
- **Placeholder:** "Alternate reply to: "[original message]"…"
- **Helper Text:** "This will create a new branch from this reply"
- **Behavior:** Creates new branch + new user input

#### State C: Agent Message Selected
- **Composer:** Disabled
- **Warning:** "⚠️ Agent messages are read-only outcomes. Select a user reply to create an alternate branch."
- **Placeholder:** "Select a user reply to create an alternate branch"

### 3. Branch Creation Logic

**When:** User submits a message while a prior user turn is selected

**Process:**
1. System detects not-a-leaf
2. Automatically forks (no confirmation dialog)
3. Creates new branch: `"Alternate Reply from Turn X"`
4. Replays history up to divergence point
5. Appends new user message
6. Agent responds deterministically
7. Execution Tree updates

**Code Location:** `Playback.tsx` → `handleSendMessage()`

```typescript
// CORE INVARIANT: Branches exist because the user said something different.
// The agent merely responded. This function creates branches ONLY at user message boundaries.
// Agent responses are deterministic outcomes, never edited or forked.
```

### 4. Execution Tree Labeling

**Main Branch:** "Initial conversation"

**Child Branches:** "Alternate Reply from Turn X"

**Visual Indicator:** Branch label shows divergence point turn number

**Example:**
```
📁 Initial conversation
  Turn 1: User greeting
  Turn 2: Agent response
  Turn 3: User question
    📁 Alternate Reply from Turn 3
      Turn 3: Different user question
      Turn 4: Agent response (deterministic)
```

---

## WHAT WAS NOT ADDED

❌ No branch creation on icon click  
❌ No editing past messages  
❌ No modal confirmations  
❌ No agent-side branching controls  
❌ No explanations of system internals to users  

The UI itself makes causality obvious.

---

## USER MENTAL MODEL

✅ "I can explore different replies I could have said"  
✅ "The agent's response is automatic and deterministic"  
✅ "Branches show 'what if I said this instead'"  

❌ NOT: "I'm forking the agent's logic"  
❌ NOT: "I'm editing the workflow"  
❌ NOT: "I'm creating alternate agent behaviors"  

---

## FILES MODIFIED

1. **`Playback.tsx`**
   - Fork icon on user bubbles with tooltip
   - Dynamic composer placeholder showing original message text
   - Updated helper text and warnings
   - Maintained core invariant comment

2. **`ExecutionTree.tsx`**
   - Already correctly labeled branches as "Alternate reply from turn X"
   - No changes required

3. **`SimulatorContext.tsx`**
   - Already supports `forkSimulation(nodeId, branchLabel)`
   - No changes required

---

## SUCCESS CRITERIA

✅ First-time user understands that branches = alternate user replies  
✅ Agent responses are clearly read-only outcomes  
✅ No confusion about "forking the agent"  
✅ Composer language makes causality explicit  
✅ Tree structure shows divergence at user message boundaries  

---

## TESTING CHECKLIST

- [ ] Click fork icon on user message → composer updates to "Alternate Reply" mode
- [ ] Placeholder shows original message text (truncated if long)
- [ ] Button label changes to "Alternate Reply"
- [ ] Submitting creates new branch automatically (no confirmation)
- [ ] Execution Tree shows "Alternate Reply from Turn X"
- [ ] Agent message selected → composer disabled with helper text
- [ ] Latest turn selected → composer shows "Send"
- [ ] Tooltip on fork icon reads "Alternate reply from here"

---

**Implementation Status:** ✅ Complete  
**Date:** 2026-01-12  
**Package:** `@toldyaonce/kx-axis-fe`




