# Alternate Reply Mode — Explicit State Implementation

## ✅ **IMPLEMENTED: Formal "Alternate Reply" Interaction**

This document describes the implementation of **explicit UI state** for creating alternate user replies, ensuring that clicking the fork icon on user messages creates **unmistakable visual feedback** and state changes.

---

## 🎯 **Core Invariant**

**Branches are created only by submitting a different USER reply.**

**Clicking an icon never creates a branch by itself.**

The agent is deterministic and is never forked.

---

## 📊 **New State Added**

### **`alternateReplyAnchorNodeId: string | null`**

**Location:** `SimulatorContext.tsx`

**Purpose:** Tracks which user message node is selected as the divergence anchor for creating an alternate reply.

**States:**
- `null` = Normal mode (no alternate reply in progress)
- `<nodeId>` = Alternate Reply Mode (user is about to create a branch from this node)

**Action:**
- `setAlternateReplyAnchor(nodeId)` — Enter/exit alternate reply mode

---

## 🔘 **Icon Click Behavior (CRITICAL CHANGE)**

### **Before (BROKEN):**
- Clicking fork icon on user message → Nothing visible happened
- No state change
- No feedback

### **After (FIXED):**

When the fork icon on a USER message bubble is clicked:

1. **State Change:**
   ```typescript
   setAlternateReplyAnchor(nodeId)
   ```

2. **Immediate Visual Feedback:**
   - ✅ Selected message gets **thick gold border** (`3px solid #FFD700`)
   - ✅ Selected message gets **gold glow** shadow
   - ✅ **"Alternate reply anchor" badge** appears above the message (gold chip)
   - ✅ **All other user messages dimmed** to 40% opacity
   - ✅ Fork icon turns **gold** on the anchor message
   - ✅ Composer **immediately changes** (see below)

3. **No Branch Created Yet:**
   - Branch is only created when the user **types and submits** a reply

---

## 🎨 **Visual Feedback (NON-OPTIONAL)**

### A. User Message Bubble (Anchor)

**When `isAlternateReplyAnchor === true`:**

```typescript
{
  border: '3px solid #FFD700', // Thick gold border
  boxShadow: '0 0 12px 3px rgba(255, 215, 0, 0.6)', // Gold glow
  backgroundColor: '#1565c0', // Darker blue
  opacity: 1 // Full opacity
}
```

**Badge above message:**
```jsx
<Chip 
  label="Alternate reply anchor" 
  size="small"
  sx={{ 
    backgroundColor: '#FFD700',
    color: '#000',
    fontWeight: 600
  }}
/>
```

### B. Other User Messages

**When `isInAlternateReplyMode === true` (any anchor is set):**

```typescript
{
  opacity: 0.4 // Dimmed
}
```

### C. Fork Icon

**Normal state:**
- White icon
- Dashed white border

**Anchor state:**
- **Gold icon** (`#FFD700`)
- **Solid gold border**
- **Gold background tint**

**Tooltip (mandatory):**
```
"Try a different reply from here"
```

---

## 💬 **Composer Changes (MANDATORY)**

### **Normal Mode** (no anchor set)

**Placeholder:**
```
"Type as the lead…"
```

**Button:**
```
[Send] (blue)
```

---

### **Alternate Reply Mode** (anchor set)

**Helper Text (appears above composer):**
```
ℹ️ This will create a new branch
```
- Yellow background (`#FFF9C4`)
- Fork icon

**Placeholder:**
```
Alternate reply to: "I want to bench 300 lbs"
```
- Shows first 40 chars of the anchor message
- Yellow background (`#FFFDE7`)

**Button:**
```
[Create Alternate Reply] (orange)
```
- Background: `#FF9800`
- Hover: `#F57C00`
- Width: `200px` (wider than normal)

**Title:**
```
"Try a different reply from here"
```

---

## 🔄 **Branch Creation Flow**

### **1. User Clicks Fork Icon**
```
alternateReplyAnchorNodeId = <nodeId>
→ Visual feedback activates
→ Composer updates
→ No backend call yet
```

### **2. User Types Reply**
```
userInput = "Different message"
→ Button enabled
→ Still no backend call
```

### **3. User Clicks "Create Alternate Reply"**
```typescript
if (alternateReplyAnchorNodeId) {
  // Create branch from anchor
  await forkSimulation(alternateReplyAnchorNodeId, branchLabel);
  
  // Clear anchor state
  setAlternateReplyAnchor(null);
}

// Send the new user message
await stepSimulation(userInput);
```

**Result:**
- New branch created
- Agent responds deterministically
- Execution Tree updates
- Composer returns to normal mode

---

## 🔄 **State Reset Behavior**

The `alternateReplyAnchorNodeId` is automatically cleared when:

1. **Starting a new simulation** (`startSimulation()`)
2. **Resetting the simulator** (`reset()`)
3. **After creating a branch** (on submit)

This ensures alternate reply mode doesn't persist across simulation sessions.

---

## 🌳 **Execution Tree (Optional Enhancement)**

When `alternateReplyAnchorNodeId` is set, show a **ghost branch indicator** (future enhancement):

```
Turn 3: "I want to bench 300 lbs" [USER]
  ├─ Turn 4: Agent response
  └─ 👻 Alternate reply (pending) [dotted]
```

**This is cosmetic only** — no backend state changes until submit.

---

## 🧪 **Truth Test**

### ✅ **PASS:**

Developer clicks fork icon and says:

> "Ah — I'm about to try a different reply from here."

**Evidence:**
- Gold border on message
- Badge appears
- Composer changes immediately
- Button says "Create Alternate Reply"

### ❌ **FAIL:**

Developer clicks fork icon and says:

> "Nothing happened?"

---

## 📝 **Required Code Comment (Added)**

```typescript
// Clicking a user message icon selects a divergence anchor.
// A branch is created only when a different reply is submitted.
```

**Location:** `Playback.tsx` → `handleSendMessage()`

---

## 📂 **Files Modified**

### 1. **`SimulatorContext.tsx`**
- Added `alternateReplyAnchorNodeId: string | null` state
- Added `setAlternateReplyAnchor(nodeId)` action
- Exported in context value

### 2. **`Playback.tsx`**

**TurnCardProps interface:**
- Added `isAlternateReplyAnchor: boolean`
- Added `isInAlternateReplyMode: boolean`
- Added `onSetAlternateReplyAnchor?: () => void`

**TurnCard component:**
- Updated fork icon click handler to call `setAlternateReplyAnchor`
- Added gold border, glow, and badge for anchor state
- Added dimming for other messages when anchor is set
- Changed icon color to gold when anchor

**Composer (User Turn Composer):**
- Dynamic placeholder based on anchor state
- Shows anchor message text (truncated)
- Yellow background when anchor set
- Orange "Create Alternate Reply" button
- Helper text banner

**handleSendMessage:**
- Uses `alternateReplyAnchorNodeId` instead of `isLeafNode()`
- Clears anchor after branch creation
- Updated comments

---

## 🎯 **Success Criteria**

✅ Clicking fork icon immediately shows gold border + badge  
✅ Composer placeholder changes to show anchor message  
✅ Button changes to "Create Alternate Reply" (orange)  
✅ Other messages are visually dimmed  
✅ No branch created until submit  
✅ Agent messages remain read-only (no fork icons)  
✅ Tooltip says "Try a different reply from here"  
✅ State persists until submit or manual clear  

---

## 🚀 **Testing Instructions**

1. **Start a simulation** → Agent sends greeting
2. **Type first reply** → Submit → Agent responds
3. **Click fork icon** on your first message
4. **Observe immediate changes:**
   - ✅ Gold border appears
   - ✅ Badge appears above message
   - ✅ Other messages dimmed
   - ✅ Composer shows alternate reply mode
   - ✅ Button is orange and says "Create Alternate Reply"
5. **Type different reply** → Submit
6. **Verify:**
   - ✅ New branch appears in Execution Tree
   - ✅ Composer returns to normal mode
   - ✅ Gold border disappears

---

**Implementation Status:** ✅ Complete  
**Date:** 2026-01-12  
**Package:** `@toldyaonce/kx-axis-fe`

