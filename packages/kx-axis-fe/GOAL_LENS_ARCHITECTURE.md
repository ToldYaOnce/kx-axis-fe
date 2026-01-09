# Goal Lens Architecture

## Core Philosophy

**The LLM chooses HOW to say something.  
The LLM NEVER chooses WHAT to say or what comes next.**

Flow logic, eligibility, prerequisites, and sequencing are **SYSTEM-CONTROLLED**.

---

## Architectural Shift

### DEPRECATED CONCEPTS
❌ Workflow goals  
❌ Field-first capture  
❌ Monolithic step ordering  
❌ Hardcoded phrasing in configuration  

### NEW CONCEPTS
✅ **Conversation Flow** - sequence of conversation moments  
✅ **Goal Lens** - adaptive question bundles based on user's goal  
✅ **Adaptive Baseline Capture** - asks only relevant questions  
✅ **Explicit Gates** - CONTACT, BOOKING, HANDOFF  
✅ **Pure JSON output** - no phrasing, only structure  

---

## Goal Lens System

### What is a Goal Lens?

A **Goal Lens** is a configurable definition of:
- What outcome the user wants
- Which baseline metrics are required NOW
- Which target metrics are required for the FUTURE
- What deadline precision is enforced

### Example: Fitness Industry

**BODY_COMPOSITION** Lens:
```typescript
{
  baselineMetrics: ['current_weight', 'current_bodyfat?'],
  targetMetrics: ['target_weight', 'target_bodyfat?'],
  deadlinePolicy: 'RANGE_OK'  // "by summer" acceptable
}
```

**STRENGTH_PR** Lens:
```typescript
{
  baselineMetrics: ['lift_type', 'current_lift_value', 'lift_context?'],
  targetMetrics: ['target_lift_value'],
  deadlinePolicy: 'EXACT_DATE'  // PR needs specific date
}
```

**PERFORMANCE** Lens:
```typescript
{
  baselineMetrics: ['performance_metric', 'current_performance'],
  targetMetrics: ['target_performance', 'event_date?'],
  deadlinePolicy: 'EXACT_DATE'  // Racing needs dates
}
```

**WELLNESS** Lens:
```typescript
{
  baselineMetrics: ['current_habits', 'health_concerns?'],
  targetMetrics: ['desired_habits', 'frequency_target?'],
  deadlinePolicy: 'DURATION_OK'  // "in 30 days" acceptable
}
```

---

## Node Types (Conversation Moments)

Nodes represent **conversation moments**, NOT fields.

### EXPLANATION
- Inform, educate, build trust
- No user input required
- Example: "Here's how our coaching works..."

### REFLECTIVE_QUESTION
- Ask user to reflect on readiness/commitment
- Not metric capture - emotional/psychological check
- Example: "What makes you confident you can achieve this?"

### GOAL_DEFINITION
- Capture which goal lens they want
- Critical node - unlocks adaptive behavior
- Satisfies: `GOAL_SET` state

### BASELINE_CAPTURE (Adaptive)
- **THE KEY NODE**
- Does NOT expose fields directly
- References selected Goal Lens
- At runtime, asks ONLY the baseline questions for that goal
- If goal = "Bench 300 lbs": asks about current bench press
- If goal = "Lose 20 lbs": asks about current weight

### DEADLINE_CAPTURE
- Captures deadline per goal lens policy
- If policy = EXACT_DATE: "3 months" triggers follow-up
- If policy = DURATION_OK: "3 months" is acceptable
- Constraint narrowing, NOT negotiation

### ACTION_BOOKING
- Schedule something (consultation, session, event)
- Satisfies: `BOOKING` gate
- Example: "Book your initial consultation"

### HANDOFF
- Transfer to human
- Satisfies: `HANDOFF` gate
- Example: "Let me connect you with a trainer"

---

## Eligibility Lanes

### BEFORE CONTACT
- No contact required
- Casual conversation
- Examples:
  - Welcome message
  - Goal definition
  - Reflective questions
  - Explanations

### CONTACT GATE
- Nodes that CAPTURE contact
- Visually distinct (yellow background)
- Satisfies: `CONTACT` gate
- All downstream nodes can depend on this

### AFTER CONTACT
- Requires contact
- Examples:
  - Adaptive baseline capture
  - Adaptive target capture
  - Deadline capture
  - Booking
  - Detailed explanations

### AFTER BOOKING
- Requires booking (which implies contact)
- Examples:
  - Promo codes
  - Onboarding instructions
  - Human handoff
  - Post-booking follow-ups

---

## Adaptive Baseline Capture

### The Problem with Field-First Design

**OLD WAY (Field-First):**
```
Nodes:
- Capture Current Weight
- Capture Current Body Fat
- Capture Current Bench Press
- Capture Current 5K Time
...and 20 more fields
```

**User says:** "I want to bench 300 lbs"  
**System asks:** "What's your current weight?" ❌ IRRELEVANT

### The Goal Lens Solution

**NEW WAY (Goal-First):**
```
Nodes:
- Goal Definition (user selects: STRENGTH_PR)
- Adaptive Baseline Capture (adapts to STRENGTH_PR lens)
```

**User says:** "I want to bench 300 lbs"  
**Goal Lens Selected:** STRENGTH_PR  
**System asks ONLY:**
- "What's your current bench press max?"
- "How long have you been training?"
✅ RELEVANT

---

## Deadline Enforcement

### Deadline Policies

**EXACT_DATE**
- User must provide specific date
- If they say "3 months": follow up with "What specific date?"
- Use for: PRs, races, events

**RANGE_OK**
- Can accept date range
- "By summer" or "in 3 months" acceptable
- Use for: body composition, general goals

**DURATION_OK**
- Duration is sufficient
- "30 days" or "12 weeks" acceptable
- Use for: habit formation, wellness

### Narrowing Strategy

**IMMEDIATE**
- Reject duration answers immediately
- "I need a specific date to plan properly"

**FOLLOW_UP**
- Accept duration initially
- Follow up later for specificity
- "Great! Let's nail down an exact date..."

This is constraint narrowing, NOT negotiation.

---

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ Top Bar: Flow Name    [Simulate] [Validate] [Publish]  │
├──────────────────┬──────────────────────────┬───────────┤
│                  │                          │           │
│  Goal Lens Panel │      Canvas (4 Lanes)    │ Inspector │
│  ──────────────  │      ───────────────     │ ────────  │
│                  │                          │           │
│  Active:         │  BEFORE  │ CONTACT │ ... │ Context:  │
│  • Body Comp     │  CONTACT │  GATE   │     │ Selected  │
│  • Strength PR   │          │         │     │           │
│                  │  [Nodes stacked         │ Node:     │
│  Available:      │   vertically in each]   │ Details   │
│  + Performance   │                          │           │
│  + Wellness      │                          │           │
│                  │                          │           │
└──────────────────┴──────────────────────────┴───────────┘
```

---

## Runtime Output

### What the Composer Exports

**PURE JSON CONFIGURATION:**
- NO phrasing
- NO prompts
- NO LLM logic
- ONLY eligibility, prerequisites, satisfactions

### Consumed By

1. **Intent Capture (Controller)**
   - Determines which node is eligible
   - Executes node logic
   - Captures user input

2. **Blabber (Style Layer)**
   - Receives node type + context
   - Generates phrasing based on style
   - NO configuration phrasing

3. **Workflow Nudge Question Creation**
   - Uses satisfactions to determine progress
   - Creates follow-up questions

---

## Example Flow: Strength PR

### User Journey

1. **Welcome** (BEFORE_CONTACT)
   - "Welcome! Let's talk about your fitness goals."

2. **Goal Definition** (BEFORE_CONTACT)
   - User selects: STRENGTH_PR lens
   - System now knows to ask strength-specific questions

3. **Capture Contact** (CONTACT_GATE)
   - Get email/phone

4. **Adaptive Baseline Capture** (AFTER_CONTACT)
   - Goal Lens = STRENGTH_PR
   - Asks ONLY:
     - "Which lift?" → Bench Press
     - "Current max?" → 225 lbs
     - "Training experience?" → 2 years

5. **Adaptive Target Capture** (AFTER_CONTACT)
   - Goal Lens = STRENGTH_PR
   - Asks ONLY:
     - "Target max?" → 300 lbs

6. **Deadline Capture** (AFTER_CONTACT)
   - Policy = EXACT_DATE (from STRENGTH_PR lens)
   - User says: "in 6 months"
   - System follows up: "What specific date?"
   - User: "June 15, 2026"

7. **Book Consultation** (AFTER_CONTACT)
   - Schedule strategy session

8. **Handoff** (AFTER_BOOKING)
   - Transfer to human trainer

### Config Output

```json
{
  "flow": {
    "id": "strength-pr-flow",
    "nodes": [
      {
        "id": "goal-def",
        "kind": "GOAL_DEFINITION",
        "satisfies": { "states": ["GOAL_SET"] }
      },
      {
        "id": "baseline",
        "kind": "BASELINE_CAPTURE",
        "requires": ["CONTACT", "goal-def"],
        "goalLensId": "ADAPTIVE"
      },
      {
        "id": "deadline",
        "kind": "DEADLINE_CAPTURE",
        "requires": ["baseline"],
        "deadlineEnforcement": {
          "policy": "EXACT_DATE",
          "narrowingStrategy": "FOLLOW_UP"
        }
      }
    ],
    "activeGoalLenses": [
      { "lensId": "STRENGTH_PR", "required": false }
    ]
  }
}
```

NO phrasing. NO prompts. Pure structure.

---

## Key Principles

1. **Conversation Moments, Not Fields**
   - Don't drag "Current Weight" onto canvas
   - Drag "Adaptive Baseline Capture" instead

2. **Goal Lens Determines Questions**
   - Same node, different questions based on goal
   - No code changes needed for new goals

3. **Deadline Policies Are Constraints**
   - Not preferences
   - System enforces based on goal type

4. **Visual Clarity**
   - Gates visible at a glance
   - No hidden prerequisites
   - Lane placement = eligibility

5. **System Controls WHAT, LLM Controls HOW**
   - Configuration says "capture baseline metrics"
   - LLM says "Hey! Quick question - what's your current bench max?"

---

## Success Criteria

A non-technical operator must be able to:

✅ Visually understand what can happen before contact  
✅ See what is gated and why  
✅ Understand why something is blocked  
✅ Know which questions adapt to goals  

The agent must be able to:

✅ Adapt baseline questions to goals WITHOUT code changes  
✅ Enforce deadline policies WITHOUT negotiating  
✅ Satisfy gates in correct order  

The system must:

✅ Never imply mandatory order unless explicitly gated  
✅ Generalize beyond fitness (legal, finance, etc.)  
✅ Output pure JSON (no phrasing)  

---

## Generalization Examples

### Legal Industry

**GOAL LENSES:**
- DIVORCE
- ESTATE_PLANNING
- BUSINESS_FORMATION
- PERSONAL_INJURY

**DIVORCE Lens:**
```typescript
{
  baselineMetrics: ['marriage_length', 'children', 'assets_est'],
  targetMetrics: ['desired_outcome', 'custody_preference'],
  deadlinePolicy: 'RANGE_OK'
}
```

### Financial Planning

**GOAL LENSES:**
- RETIREMENT
- HOME_PURCHASE
- DEBT_PAYOFF
- INVESTMENT_GROWTH

**RETIREMENT Lens:**
```typescript
{
  baselineMetrics: ['current_age', 'current_savings', 'income'],
  targetMetrics: ['target_retirement_age', 'desired_income'],
  deadlinePolicy: 'EXACT_DATE'
}
```

---

## Implementation Status

### ✅ Completed
- Type system redesign
- Goal Lens data model
- Lane calculation logic
- Sample goal lenses (Fitness)
- Sample flow configuration
- Goal Lens Panel component

### 🚧 In Progress
- Inspector updates for goal lens association
- NodeCard updates for new node types
- Demo integration

### 📋 TODO
- Full Canvas integration
- Simulation with goal lens awareness
- Export/validation logic
- Additional industry examples

---

**This architecture enables building adaptive, goal-driven conversation flows that respect hard gates while giving the LLM freedom in phrasing.**

**Configuration controls WHAT. Style controls HOW.**


