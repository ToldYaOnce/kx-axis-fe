# Implementation Status: Goal Lens Architecture

## 🎯 Mission

Transform KxAxis from a field-centric capture system into a **goal-driven, adaptive conversation flow composer** where:
- The LLM chooses HOW to say things
- The system controls WHAT gets said and when
- Questions adapt to user's selected goal
- No phrasing in configuration (pure structure)

---

## ✅ COMPLETED

### 1. Core Type System Redesign
**File:** `src/types/index.ts`

**New Types:**
- `GoalLens` - defines outcome + metric bundles
- `MetricBundle` - baseline + target metrics + deadline policy
- `DeadlinePolicy` - EXACT_DATE | RANGE_OK | DURATION_OK
- `MetricDefinition` - individual metric specs
- `GoalLensRegistry` - industry-specific lens collection
- `ActiveGoalLens` - lenses active in a flow

**Updated Types:**
- `NodeKind` - added GOAL_DEFINITION, BASELINE_CAPTURE, DEADLINE_CAPTURE
- `FlowNode` - added `goalLensId`, `deadlineEnforcement`
- `NodeSatisfaction` - structured: `gates`, `metrics`, `states`
- `ConversationFlow` - replaced `capturing` with `activeGoalLenses`

**New Concepts:**
- Adaptive baseline capture (no hardcoded fields)
- Deadline enforcement policies
- Conversation moments (not fields)

### 2. Goal Lens Data
**File:** `src/demo/goalLensData.ts`

**Created 4 Fitness Goal Lenses:**
1. **BODY_COMPOSITION** ⚖️
   - Baseline: current_weight, current_bodyfat?
   - Target: target_weight, target_bodyfat?
   - Deadline: RANGE_OK

2. **STRENGTH_PR** 🏋️
   - Baseline: lift_type, current_lift_value, lift_context?
   - Target: target_lift_value
   - Deadline: EXACT_DATE

3. **PERFORMANCE** 🏃
   - Baseline: performance_metric, current_performance
   - Target: target_performance, event_date?
   - Deadline: EXACT_DATE

4. **WELLNESS** 🧘
   - Baseline: current_habits, health_concerns?
   - Target: desired_habits, frequency_target?
   - Deadline: DURATION_OK

### 3. Sample Flow Configuration
**File:** `src/demo/sampleFlowData.ts`

**Created:** `fitnessOnboardingFlow`
- 11 nodes demonstrating full goal lens system
- 3 active goal lenses
- Nodes include:
  - GOAL_DEFINITION (select goal)
  - BASELINE_CAPTURE (adaptive)
  - DEADLINE_CAPTURE (with enforcement)
  - ACTION_BOOKING
  - HANDOFF

**Demonstrates:**
- Adaptive questioning based on goal
- Deadline policy enforcement
- Lane-based eligibility
- Pure JSON output (no phrasing)

### 4. Lane Logic Updates
**File:** `src/utils/laneLogic.ts`

**Updated:**
- `calculateNodeLane()` - handles new satisfaction structure
- `updateNodeForLane()` - updates `satisfies` object correctly
- `getNodeGateSatisfactions()` - extracts gates from new structure

### 5. Goal Lens Panel Component
**File:** `src/components/GoalLenses/GoalLensPanel.tsx`

**Features:**
- Active Goal Lenses section
- Available Goal Lenses (accordion expand)
- Shows baseline/target metrics
- Shows deadline policy
- Add/remove goal lenses
- Click to select/configure

### 6. Context Updates
**File:** `src/context/FlowContext.tsx`

**Updated:**
- `GoalLensRegistry` instead of `IndustryCaptureRegistry`
- `addGoalLens()`, `removeGoalLens()`, `updateGoalLens()`
- Removed capture-specific operations
- Selection type includes 'goal-lens'

### 7. Comprehensive Documentation
**File:** `GOAL_LENS_ARCHITECTURE.md`

**Sections:**
- Core philosophy
- Goal Lens system explained
- Node types (conversation moments)
- Adaptive baseline capture
- Deadline enforcement
- UI layout
- Runtime output format
- Example flows
- Generalization to other industries

---

## 🚧 IN PROGRESS

### Left Panel Completion
**Status:** Component created, needs integration

**Remaining:**
- Replace `CapturesList` with `GoalLensPanel` in main composer
- Wire up context properly
- Test add/remove functionality

---

## 📋 TODO (Critical Path)

### 1. Update NodeCard Component
**File:** `src/components/Canvas/NodeCard.tsx`

**Changes Needed:**
- Update `NODE_ICONS` for new node kinds:
  - GOAL_DEFINITION
  - BASELINE_CAPTURE  
  - DEADLINE_CAPTURE
- Update `NODE_COLORS` for new kinds
- Add visual indicator for "ADAPTIVE" nodes
  - Show "🔄 Adapts to Goal" chip
- Show deadline policy on DEADLINE_CAPTURE nodes

### 2. Update Inspector for Goal Lens
**File:** `src/components/Inspector/NodeInspector.tsx`

**Changes Needed:**
- Add Goal Lens association dropdown
  - Shows available active goal lenses
  - Special "ADAPTIVE" option for baseline/target capture
- Add Deadline Enforcement section
  - Policy selector (EXACT_DATE, RANGE_OK, DURATION_OK)
  - Narrowing strategy (IMMEDIATE, FOLLOW_UP)
- Update Satisfies section
  - Show gates, metrics, states separately
  - Allow editing each

### 3. Create Goal Lens Inspector
**File:** `src/components/Inspector/GoalLensInspector.tsx` (NEW)

**Features:**
- Show goal lens details (read-only from registry)
- Show baseline metrics
- Show target metrics
- Show deadline policy
- Allow configuring:
  - Required (yes/no)
  - Usage label
- Show which nodes reference this lens

### 4. Update Main Composer
**File:** `src/components/KxAxisComposer.tsx`

**Changes:**
- Replace `CapturesList` with `GoalLensPanel`
- Update prop types (`GoalLensRegistry` instead of `IndustryCaptureRegistry`)
- Update Inspector routing to handle 'goal-lens' selection

### 5. Update Demo App
**File:** `src/demo/DemoApp.tsx`

**Changes:**
- Import `fitnessGoalLensRegistry` instead of old registry
- Import `fitnessOnboardingFlow` instead of old flow
- Update callbacks for new structure

### 6. Update Simulation
**File:** `src/components/Simulate/SimulatePanel.tsx`

**Changes:**
- Add "Goal Lens Selected" dropdown
- Show which baseline questions would be asked based on goal
- Demonstrate adaptive behavior
- Update eligibility checks for goal-dependent nodes

### 7. Update Exports
**File:** `src/index.ts`

**Changes:**
- Export new types:
  - GoalLens, GoalLensRegistry, MetricBundle, DeadlinePolicy, etc.
- Export new utilities if any
- Remove old capture-related exports

### 8. Update Canvas (Minor)
**File:** `src/components/Canvas/Canvas.tsx`

**Changes:**
- Update node kind rendering (should mostly work as-is)
- Ensure lane calculation works with new satisfaction structure

---

## 🎨 VISUAL ENHANCEMENTS (Nice-to-Have)

### Node Visual Indicators

**GOAL_DEFINITION nodes:**
- Special border or glow
- Icon: 🎯
- Chip: "Unlocks Adaptive Behavior"

**BASELINE_CAPTURE (Adaptive) nodes:**
- Animated icon: 🔄
- Chip: "Adapts to [Goal Lens Name]"
- If selected goal = STRENGTH_PR, show: "Asks: lift type, current max, training context"

**DEADLINE_CAPTURE nodes:**
- Policy indicator
  - 📅 = EXACT_DATE
  - 📆 = RANGE_OK
  - ⏱️ = DURATION_OK
- Chip: "Deadline: [Policy]"

### Lane Headers
- Add description of what types of nodes belong there
- Subtle visual connection from CONTACT_GATE to AFTER_CONTACT lanes

### Goal Lens Cards
- Color-coded by lens (use `lens.color`)
- Show icon prominently
- Expand to show metric details

---

## 🧪 TESTING SCENARIOS

### Scenario 1: Body Composition Goal
1. User selects BODY_COMPOSITION lens
2. Add adaptive baseline capture node
3. Node should show it will ask: current_weight, current_bodyfat?
4. Add deadline capture
5. Should show deadline policy: RANGE_OK
6. Simulate: show "by summer" is acceptable

### Scenario 2: Strength PR Goal
1. User selects STRENGTH_PR lens
2. Add adaptive baseline capture node
3. Node should show it will ask: lift_type, current_lift_value, lift_context?
4. Add deadline capture
5. Should show deadline policy: EXACT_DATE
6. Simulate: show "in 6 months" triggers follow-up

### Scenario 3: Multi-Goal Flow
1. Activate BODY_COMPOSITION and STRENGTH_PR lenses
2. Add GOAL_DEFINITION node
3. Add two adaptive baseline nodes:
   - One for body comp goal
   - One for strength goal
4. Show conditional behavior based on goal selection

---

## 📊 MIGRATION NOTES

### Breaking Changes from Previous Version

**Data Model:**
- `capturing` → `activeGoalLenses`
- `CaptureDefinition` → `GoalLens` + `MetricDefinition`
- `ActiveCapture` → `ActiveGoalLens`
- `IndustryCaptureRegistry` → `GoalLensRegistry`

**Node Structure:**
- `satisfies: string[]` → `satisfies: { gates, metrics, states }`
- New node kinds added
- `goalLensId` field added
- `deadlineEnforcement` field added

**UI:**
- Left panel shows Goal Lenses, not individual fields
- Inspector has Goal Lens association section
- Nodes show adaptive behavior indicators

### Migration Path

For existing flows:
1. Group fields into Goal Lenses
2. Convert field nodes to BASELINE_CAPTURE (adaptive)
3. Add GOAL_DEFINITION node at flow start
4. Update satisfies structure
5. Set deadline policies based on goal type

---

## 🚀 NEXT STEPS (Priority Order)

1. **Update NodeCard** (30 min)
   - Add new icons/colors
   - Add adaptive indicators

2. **Update Inspector** (1 hour)
   - Goal lens association
   - Deadline enforcement UI
   - Updated satisfies section

3. **Create GoalLensInspector** (45 min)
   - Read-only lens details
   - Configuration options

4. **Integrate GoalLensPanel** (15 min)
   - Replace CapturesList in main composer
   - Update prop types

5. **Update Demo** (30 min)
   - Use new sample data
   - Test full flow

6. **Update Simulation** (45 min)
   - Goal lens awareness
   - Show adaptive questions

7. **Test & Polish** (1 hour)
   - Visual enhancements
   - Edge cases
   - Documentation

**Total Estimated Time: ~5 hours**

---

## 💡 KEY INSIGHTS

### What Makes This Architecture Powerful

1. **Adaptability Without Code Changes**
   - Add new Goal Lens → new question patterns emerge
   - No node reconfiguration needed

2. **Clear Separation of Concerns**
   - Configuration: WHAT to ask, WHEN
   - LLM: HOW to phrase it
   - Style layer: Personality/tone

3. **Visual Clarity**
   - Operator sees goal lenses, not field soup
   - Nodes show adaptive behavior
   - Lanes enforce gates

4. **Generalization**
   - Fitness example demonstrates concept
   - Same architecture works for: legal, finance, healthcare, etc.
   - Industry-specific goal lenses

5. **Runtime Flexibility**
   - Same node, different questions based on goal
   - Deadline enforcement adapts to goal type
   - No hardcoded paths

### What This Enables

**For Operators:**
- Configure flows without understanding every field
- See eligibility at a glance
- Understand adaptive behavior visually

**For Agents:**
- Ask relevant questions automatically
- Enforce constraints intelligently
- Adapt to user goals seamlessly

**For Developers:**
- Add new goals without touching flow logic
- Pure JSON output (no phrasing)
- Clean separation of configuration vs. style

---

## 📝 DOCUMENTATION COMPLETE

- ✅ `GOAL_LENS_ARCHITECTURE.md` - Full architecture explanation
- ✅ `IMPLEMENTATION_STATUS.md` - This file
- ✅ Type system fully documented with comments
- ✅ Sample data includes explanatory comments
- ✅ Philosophy clearly stated in docs

---

**Status:** Core architecture complete. Integration work remaining (~5 hours).

**Ready for:** Final implementation push or handoff to another developer.

**Key Files:**
- Types: `src/types/index.ts`
- Sample Lenses: `src/demo/goalLensData.ts`
- Sample Flow: `src/demo/sampleFlowData.ts`
- Panel: `src/components/GoalLenses/GoalLensPanel.tsx`
- Docs: `GOAL_LENS_ARCHITECTURE.md`


