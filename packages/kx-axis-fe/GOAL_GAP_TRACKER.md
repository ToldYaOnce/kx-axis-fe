# Goal Gap Tracker – Delta-First Philosophy

## Overview

The **GOAL_GAP_TRACKER** is a new UI primitive in `@toldyaonce/kx-axis-fe` that embodies the **delta-first philosophy**: designers build conversations around **targets**, **baselines**, **computed deltas**, and **classified categories** — without needing to think about weight/reps/time theories.

---

## Philosophy (Non-Negotiable)

1. **Designers build conversations as "moments" and "trackers", NOT raw fields.**
2. The system captures:
   - **Target state** (semantic question)
   - **Baseline state** (semantic question)
   - **Derived delta** (system computed)
   - **Delta category** (LLM classified at runtime)
3. The UI must show this clearly and minimally.
4. **No rule trees, no prompts, no workflow spaghetti.**
5. Keep the UI calm, flat, modern, with lots of whitespace.

---

## What It Does

The GOAL_GAP_TRACKER node:
- Asks the user for their **target outcome** (e.g., "bench 300 lbs")
- Asks the user for their **baseline** (e.g., "currently benching 225 lbs")
- **Computes the delta** (e.g., "75 lbs increase, 33% gain")
- **Classifies the delta category** (e.g., "Strength PR")
- Enforces **deadline policies** (e.g., exact date required vs. range acceptable)

All of this happens **without** the designer needing to write prompts, define field schemas, or think about exercise theory.

---

## UI Components

### 1. Conversation Items Palette (Left Panel)

**File:** `src/components/ConversationItems/ConversationItemsPalette.tsx`

- Shows draggable conversation building blocks
- Includes "Goal Gap Tracker" with a "NEW" badge
- Click or drag to add to canvas
- Replaces the old "Captures" list

**Default items:**
- Welcome / Introduction
- Reflective Question
- **Goal Gap Tracker** ⭐
- Contact Capture
- Book Consultation
- Send Promo
- Handoff

---

### 2. Node Card (Canvas)

**File:** `src/components/Canvas/NodeCard.tsx`

When a GOAL_GAP_TRACKER node appears on the canvas, it shows:

**Chips (always visible):**
- 📈 "Captures: Target + Baseline"
- 🏷️ "Produces: Delta + Category"
- 📅 "Deadline: [EXACT_DATE | RANGE_OK | DURATION_OK]" (if set)

**Icon:** `ShowChartIcon` (analytics/delta style)

**Color:** Pink (`#E91E63`) to stand out

---

### 3. Goal Gap Tracker Inspector (Right Panel)

**File:** `src/components/Inspector/GoalGapTrackerInspector.tsx`

When a GOAL_GAP_TRACKER node is selected, the inspector shows:

#### Section 1: Overview (read-only)
- What this tracker captures
- What it produces
- Deadline enforcement status

#### Section 2: Capture Questions (semantic)
- **Target prompt label** (string, editable)
  - Default: "What's the exact outcome you want?"
- **Baseline prompt label** (string, editable)
  - Default: "Where are you at right now with that?"
- **Show examples** (toggle)
- **Examples** (editable list)
  - "run 3 miles in 21 minutes"
  - "bench 300"
  - "lose 15 lbs"

#### Section 3: Delta Computation Mode
- **Compute mode** (dropdown):
  - `AUTO` (recommended)
  - `TIME_BASED` (faster 5K, longer plank)
  - `LOAD_BASED` (heavier bench, more weight)
  - `REPS_BASED` (more pushups, more reps)
  - `PERCENT_BASED` (lower body fat %, higher rate)
  - `MANUAL` (no compute; classification only)
- **Ask clarifier if incomparable** (toggle)
  - If target/baseline aren't comparable, ask a follow-up

#### Section 4: Category Taxonomy (Google Tracking Style)
- **Default deadline policy** (dropdown):
  - `INHERIT` (from flow)
  - `EXACT_DATE`
  - `RANGE_OK`
  - `DURATION_OK`
- **Categories** (editable list):
  - Each category has:
    - Name (e.g., "Strength PR")
    - Deadline policy override (optional)

**Default fitness categories:**
- Strength PR (EXACT_DATE)
- Endurance / Pace (EXACT_DATE)
- Body Composition (RANGE_OK)
- Consistency / Routine (DURATION_OK)
- Mobility / Pain (RANGE_OK)
- Other (INHERIT)

#### Section 5: Outputs (read-only)
Shows the facts that backend will consume:
- `goal.target` (structured)
- `goal.baseline` (structured)
- `goal.delta` (derived)
- `goal.deltaCategory` (classified)
- `goal.deadlinePolicy` (from node config)

---

### 4. Simulation Panel

**File:** `src/components/Simulate/SimulatePanel.tsx`

When simulating a flow with a GOAL_GAP_TRACKER, the simulation output shows:

**Mock outputs (deterministic):**
- `goal.target`: "bench 300 lbs"
- `goal.baseline`: "currently benching 225 lbs"
- `goal.delta`: "75 lbs increase (33% gain)"
- `goal.deltaCategory`: "Strength PR"
- `goal.deadlinePolicy`: "EXACT_DATE"

This helps designers understand what the backend will receive without implementing LLM logic.

---

## Type Definitions

**File:** `src/types/index.ts`

### New Types

```typescript
export type NodeKind =
  | 'EXPLANATION'
  | 'REFLECTIVE_QUESTION'
  | 'GOAL_DEFINITION'
  | 'BASELINE_CAPTURE'
  | 'DEADLINE_CAPTURE'
  | 'GOAL_GAP_TRACKER'  // ⭐ NEW
  | 'ACTION_BOOKING'
  | 'HANDOFF';

export type DeltaComputeMode = 
  | 'AUTO'          // Recommended
  | 'TIME_BASED'    // For time-based goals
  | 'LOAD_BASED'    // For weight/resistance
  | 'REPS_BASED'    // For repetition goals
  | 'PERCENT_BASED' // For percentage goals
  | 'MANUAL';       // No automatic compute

export interface GoalGapCategory {
  id: string;
  name: string;
  recommendedNextNodeId?: string;
  deadlinePolicyOverride?: 'INHERIT' | DeadlinePolicy;
}

export interface GoalGapTrackerConfig {
  targetLabel: string;
  baselineLabel: string;
  showExamples: boolean;
  examples: string[];
  computeMode: DeltaComputeMode;
  askClarifierIfIncomparable: boolean;
  deadlinePolicyDefault: 'INHERIT' | DeadlinePolicy;
  categories: GoalGapCategory[];
}
```

### Extended FlowNode

```typescript
export interface FlowNode {
  // ... existing fields ...
  
  // Goal Gap Tracker configuration (NEW)
  goalGapTracker?: GoalGapTrackerConfig;
}
```

---

## Demo Flow

**File:** `src/demo/goalGapDemoData.ts`

A complete fitness onboarding flow showcasing:

1. **Welcome** (BEFORE CONTACT)
2. **Reflective Question** (BEFORE CONTACT)
3. **Goal Gap Tracker** ⭐ (BEFORE CONTACT)
4. **Contact Capture** (CONTACT_GATE)
5. **Booking** (AFTER CONTACT)
6. **Send Promo** (AFTER BOOKING)
7. **Handoff** (AFTER BOOKING)

The Goal Gap Tracker node is pre-configured with:
- Target/baseline semantic labels
- 5 example goals
- AUTO compute mode
- EXACT_DATE deadline policy
- 6 fitness categories (Strength PR, Endurance, Body Comp, Consistency, Mobility, Other)

---

## Usage Example

```typescript
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';
import type { ConversationFlow } from '@toldyaonce/kx-axis-fe';

const myFlow: ConversationFlow = {
  id: 'my-flow',
  name: 'My Custom Flow',
  nodes: [
    {
      id: 'goal-tracker-1',
      kind: 'GOAL_GAP_TRACKER',
      title: 'What do you want to achieve?',
      goalGapTracker: {
        targetLabel: "What's your target?",
        baselineLabel: "Where are you now?",
        showExamples: true,
        examples: ['run faster', 'lift heavier', 'lose weight'],
        computeMode: 'AUTO',
        askClarifierIfIncomparable: true,
        deadlinePolicyDefault: 'EXACT_DATE',
        categories: [
          { id: 'strength', name: 'Strength PR' },
          { id: 'endurance', name: 'Endurance' },
        ],
      },
      satisfies: {
        states: ['GOAL_GAP_CAPTURED'],
        metrics: ['goal_target', 'goal_baseline', 'goal_delta', 'goal_category'],
      },
    },
  ],
};

<KxAxisComposer
  initialConfig={myFlow}
  onChange={(config) => console.log(config)}
/>
```

---

## Design Constraints

✅ **Do:**
- Use flat, calm design
- Show chips directly on node cards (no hidden prerequisites)
- Use accordions to organize inspector sections
- Provide clear empty states
- Use MUI components for consistency

❌ **Don't:**
- Add rule trees or nested conditions
- Implement LLM prompts (config only!)
- Create arrow spaghetti
- Overwhelm with colors or borders
- Hide critical information in tooltips

---

## Technical Notes

### No Backend, No LLM
- This is **UI + config only**
- The node outputs a structured JSON config
- Backend consumes this config to:
  - Ask semantic questions
  - Compute deltas
  - Classify categories
  - Enforce deadline policies

### Eligibility Lanes
- GOAL_GAP_TRACKER defaults to **BEFORE CONTACT** lane
- Can be dragged to other lanes if needed
- Respects gate requirements (CONTACT, BOOKING)

### Simulation
- Simulation outputs are **deterministic mocks**
- No actual LLM calls
- Helps designers visualize what backend will produce

---

## File Checklist

✅ **New Files:**
- `src/components/ConversationItems/ConversationItemsPalette.tsx`
- `src/components/Inspector/GoalGapTrackerInspector.tsx`
- `src/demo/goalGapDemoData.ts`
- `GOAL_GAP_TRACKER.md` (this file)

✅ **Modified Files:**
- `src/types/index.ts` (added GOAL_GAP_TRACKER types)
- `src/components/Canvas/NodeCard.tsx` (added GOAL_GAP_TRACKER visuals)
- `src/components/Inspector/NodeInspector.tsx` (routes to specialized inspector)
- `src/components/Simulate/SimulatePanel.tsx` (shows mock outputs)
- `src/components/KxAxisComposer.tsx` (uses ConversationItemsPalette)
- `src/demo/DemoApp.tsx` (uses goalGapDemoFlow)
- `src/index.ts` (exports new types)

---

## Summary

The **GOAL_GAP_TRACKER** is a UI primitive that lets designers configure **delta-first conversations** without needing to understand exercise theory, field schemas, or prompt engineering.

It's clean. It's minimal. It's obvious.

**Fuck yeah.** 🚀

