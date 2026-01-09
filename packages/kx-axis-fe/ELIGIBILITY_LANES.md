# Eligibility Lanes - Design Philosophy

## What Are Eligibility Lanes?

Eligibility Lanes are a visual system for understanding **WHEN** nodes can execute based on **HARD GATES** (prerequisites like CONTACT or BOOKING).

**This is NOT a workflow.** It's a decision system that shows constraints, not execution order.

## The Four Lanes

### 1. BEFORE CONTACT
**Color:** Light Green  
**Description:** No contact required  
**Examples:**
- Welcome messages
- Value propositions
- Educational content
- General questions

**Mental Model:** "We can chat casually without knowing who you are"

---

### 2. CONTACT GATE
**Color:** Light Yellow  
**Description:** Captures contact information  
**Examples:**
- "Can I get your email?"
- "What's your phone number?"
- Any node that satisfies the CONTACT gate

**Mental Model:** "This is the node that unlocks the next phase"

**Key Indicator:** Chip shows "Unlocks CONTACT" 🔓

---

### 3. AFTER CONTACT
**Color:** Light Blue  
**Description:** Requires contact to run  
**Examples:**
- Detailed data capture
- Personalized explanations
- Booking actions
- Follow-up scheduling

**Mental Model:** "We need to know who you are before we can do this"

**Key Indicator:** Chip shows "Requires CONTACT" 🔒

---

### 4. AFTER BOOKING
**Color:** Light Purple  
**Description:** Requires booking (which implies contact)  
**Examples:**
- Promo codes
- Confirmation details
- Handoff to human
- Post-booking instructions

**Mental Model:** "This only happens after they've committed"

**Key Indicator:** Chip shows "Requires BOOKING" 🔒

## Visual Design Principles

### ✅ DO
- Use subtle lane dividers (dashed lines)
- Show gate chips directly on node cards
- Stack nodes vertically within lanes
- Keep backgrounds calm and minimal
- Use color sparingly (lane headers only)

### ❌ DON'T
- Draw full node-to-node arrows
- Create workflow-style connections
- Use heavy borders or gradients
- Overwhelm with colors
- Hide prerequisites in inspector only

## Gate Semantics

### Special Gate Identifiers

```typescript
const GATES = {
  CONTACT: 'CONTACT',
  BOOKING: 'BOOKING',
};
```

These are **NOT node IDs**. They are semantic gates used in `requires` and `satisfies` arrays.

### Example Node Configurations

**Before Contact (No gates):**
```typescript
{
  id: 'welcome',
  title: 'Welcome Message',
  // No requires, no satisfies
}
```

**Contact Gate (Unlocks contact):**
```typescript
{
  id: 'capture-contact',
  title: 'Get Email',
  satisfies: ['CONTACT'], // This unlocks the gate
}
```

**After Contact (Requires contact):**
```typescript
{
  id: 'book-call',
  title: 'Book Consultation',
  requires: ['CONTACT'], // Locked behind contact
  satisfies: ['BOOKING'], // Also unlocks booking
}
```

**After Booking (Requires booking):**
```typescript
{
  id: 'send-promo',
  title: 'Send Discount Code',
  requires: ['BOOKING'], // Locked behind booking
}
```

## Drag-and-Drop Semantics

When you drag a node between lanes, you're making a **semantic statement** about its eligibility:

### Drag to BEFORE CONTACT
- **Action:** Removes all gate requirements
- **Meaning:** "This can run without any prerequisites"
- **Updates:** Clears `requires` array of gates

### Drag to CONTACT GATE
- **Action:** Adds CONTACT to `satisfies`
- **Meaning:** "This node captures contact and unlocks the next phase"
- **Updates:** Adds `satisfies: ['CONTACT']`

### Drag to AFTER CONTACT
- **Action:** Adds CONTACT to `requires`
- **Meaning:** "This needs contact before it can run"
- **Updates:** Adds `requires: ['CONTACT']`

### Drag to AFTER BOOKING
- **Action:** Adds BOOKING to `requires`
- **Meaning:** "This needs booking (and contact) before it can run"
- **Updates:** Adds `requires: ['BOOKING']`

## Auto-Placement Logic

Nodes are automatically placed in lanes based on their `requires` and `satisfies`:

```typescript
function calculateNodeLane(node: FlowNode): EligibilityLane {
  // Priority 1: Satisfies CONTACT → CONTACT_GATE
  if (satisfies.includes('CONTACT')) return 'CONTACT_GATE';
  
  // Priority 2: Requires BOOKING → AFTER_BOOKING
  if (requires.includes('BOOKING')) return 'AFTER_BOOKING';
  
  // Priority 3: Requires CONTACT → AFTER_CONTACT
  if (requires.includes('CONTACT')) return 'AFTER_CONTACT';
  
  // Default: BEFORE_CONTACT
  return 'BEFORE_CONTACT';
}
```

## User Mental Model

After seeing the lanes, a user should instantly understand:

✅ **"We can chat casually without contact"**  
✅ **"Booking and promos are locked behind contact"**  
✅ **"This node is what unlocks the gate"**  
✅ **"Order is not forced — eligibility is"**

❌ **"Which node runs first?"** ← If they ask this, the UI has failed.

## Inspector Behavior

The Inspector **confirms** what the canvas already shows visually.

- Click a node → See its gate requirements
- Edit `requires` / `satisfies` → Lane updates automatically
- Inspector is secondary, not primary

## No Workflow, No Spaghetti

**This system does NOT:**
- Force execution order
- Draw node-to-node arrows (except decorative gate indicators)
- Create dependency trees
- Show condition logic
- Expose scoring rules

**This system DOES:**
- Show hard prerequisites (gates)
- Make eligibility immediately visible
- Allow semantic drag-and-drop
- Preserve calm, minimal aesthetic

## Implementation Files

- **Types:** `src/types/index.ts` (EligibilityLane)
- **Logic:** `src/utils/laneLogic.ts` (calculation, validation, updates)
- **Canvas:** `src/components/Canvas/Canvas.tsx` (lane rendering)
- **Node Card:** `src/components/Canvas/NodeCard.tsx` (gate chips)
- **Sample Data:** `src/demo/sampleData.ts` (example with gates)

## Example Flow

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ BEFORE CONTACT  │  CONTACT GATE   │ AFTER CONTACT   │ AFTER BOOKING   │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│                 │                 │                 │                 │
│ • Welcome       │ • Get Email     │ • Capture Stats │ • Send Promo    │
│                 │   🔓 Unlocks    │   🔒 Requires   │   🔒 Requires   │
│ • Explain Value │     CONTACT     │      CONTACT    │      BOOKING    │
│                 │                 │                 │                 │
│                 │                 │ • Book Call     │ • Handoff       │
│                 │                 │   🔒 Requires   │   🔒 Requires   │
│                 │                 │      CONTACT    │      BOOKING    │
│                 │                 │   🔓 Unlocks    │                 │
│                 │                 │      BOOKING    │                 │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

## Key Takeaways

1. **Lanes = Eligibility, not sequence**
2. **Gates = Hard prerequisites (CONTACT, BOOKING)**
3. **Chips = Always visible on cards**
4. **Drag = Semantic action (updates requires/satisfies)**
5. **No arrows = No workflow confusion**
6. **Calm UI = Minimal, flat, spacious**

This system makes HARD GATES obvious without turning the UI into a workflow editor.


