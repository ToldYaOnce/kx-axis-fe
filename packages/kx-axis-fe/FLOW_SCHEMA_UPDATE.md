# Flow Schema Update - Deterministic Execution Support

## 🎯 **Overview**

This document describes the **minimal additive changes** made to the Conversation Flow schema to support deterministic, edge-less execution by a controller/compiler.

---

## 📋 **Changes Made**

### **1. Top-Level Execution Metadata**

Added four new optional top-level fields:

```typescript
{
  // Where to start
  entryNodeIds: string[];
  
  // What completes the flow
  primaryGoal: {
    type: "GATE" | "STATE";
    gate?: string;
    state?: string;
    description?: string;
  };
  
  // Gate satisfaction rules
  gateDefinitions: {
    [gateName: string]: {
      satisfiedBy: {
        metricsAll?: string[];   // ALL must exist
        metricsAny?: string[];   // AT LEAST ONE must exist
        statesAll?: string[];    // ALL must exist
      };
    };
  };
  
  // Fact name normalization
  factAliases: {
    [alias: string]: string;  // e.g., "email" → "contact_email"
  };
}
```

---

### **2. Per-Node Additions**

Added optional fields to nodes:

```typescript
{
  // Typed run policy (replaces string "once")
  runPolicy?: {
    maxExecutions: number;  // 1 for once, Infinity for unlimited
  };
  
  // State prerequisites
  requiresStates?: string[];  // e.g., ["GOAL_GAP_CAPTURED"]
  
  // Completion markers (for nodes that produce no facts)
  produces?: string[];  // e.g., ["WELCOME_SHOWN"]
}
```

---

## 🔍 **Example: Production Flow**

See `PRODUCTION_FLOW.json` for a complete example.

### **Key Features:**

#### **Entry Point:**
```json
"entryNodeIds": ["welcome-1"]
```

#### **Completion Condition:**
```json
"primaryGoal": {
  "type": "GATE",
  "gate": "BOOKING",
  "description": "User has booked a consultation"
}
```

#### **Gate Definitions:**
```json
"gateDefinitions": {
  "CONTACT": {
    "satisfiedBy": {
      "metricsAny": ["contact_email", "contact_phone"]  // Email OR phone
    }
  },
  "BOOKING": {
    "satisfiedBy": {
      "metricsAll": ["booking_date"]  // Must have booking date
    }
  }
}
```

#### **Fact Aliases:**
```json
"factAliases": {
  "email": "contact_email",
  "phone": "contact_phone",
  "target": "goal_target",
  "baseline": "goal_baseline"
}
```

---

## 🎨 **Design Principles**

### ✅ **Backward Compatible**
- All new fields are optional
- Existing fields unchanged (e.g., `maxRuns`, `requires`, `produces`)
- Legacy flows continue to work

### ✅ **Minimal & Additive**
- No field removals
- No field restructuring
- No schema redesign

### ✅ **Edge-less & Declarative**
- No edges or sequencing
- No workflow logic
- Controller decides next node based on state/gates/eligibility

### ✅ **Deterministic**
- Same state → same eligible nodes
- No UI inference (x/y/lane)
- No hidden assumptions

---

## 🧪 **Controller Logic**

The deterministic controller uses this schema to:

### **1. Compilation Phase**
```
- Merge nodePatches into base nodes
- Index gate definitions
- Normalize fact aliases
- Build runPolicy from maxRuns string
```

### **2. Runtime State**
```
- Track facts: Set<string>
- Track states: Set<string>
- Track run history: Map<nodeId, count>
```

### **3. Gate Evaluation**
```
FOR EACH gate IN gateDefinitions:
  - Check metricsAll: ALL must exist in facts
  - Check metricsAny: AT LEAST ONE must exist
  - Check statesAll: ALL must exist in states
  → Gate satisfied if all checks pass
```

### **4. Node Eligibility**
```
FOR EACH node:
  - Check runPolicy.maxExecutions not exceeded
  - Check requires gates satisfied
  - Check requiresStates exist
  → Node eligible if all checks pass
```

### **5. Next Node Selection**
```
- Filter eligible nodes
- Sort by importance (high > normal > low)
- Tie-break by execution count (prefer unrun)
- Return first eligible
```

### **6. Flow Completion**
```
IF primaryGoal.type == "GATE":
  → Check if gate satisfied
IF primaryGoal.type == "STATE":
  → Check if state exists
```

---

## 📦 **Files Updated**

1. **`PRODUCTION_FLOW.json`** - Complete example with all patches applied
2. **`src/demo/goalGapDemoData.ts`** - Demo flow updated with new fields
3. **`src/types/index.ts`** - TypeScript interfaces updated
4. **`src/components/TopBar.tsx`** - Publish logic includes new fields

---

## 🚀 **Usage**

### **In UI (Design Mode):**
```typescript
import { goalGapDemoFlow } from './demo/goalGapDemoData';

// Flow already includes execution metadata
console.log(goalGapDemoFlow.entryNodeIds);  // ["welcome-1"]
console.log(goalGapDemoFlow.primaryGoal);   // { type: "GATE", gate: "BOOKING" }
```

### **When Publishing:**
```typescript
// TopBar.tsx automatically includes execution metadata in payload
const draftGraph = {
  entryNodeIds: flow.entryNodeIds,
  primaryGoal: flow.primaryGoal,
  gateDefinitions: flow.gateDefinitions,
  factAliases: flow.factAliases,
  nodes: flow.nodes  // with runPolicy, requiresStates, etc.
};
```

### **When Compiling (Backend):**
```python
# Controller reads stored flow
flow = db.get_flow(flow_id)

# Has everything needed for deterministic execution
entry_node = flow['entryNodeIds'][0]
completion_gate = flow['primaryGoal']['gate']
gate_rules = flow['gateDefinitions']['CONTACT']
```

---

## 🎯 **Benefits**

1. **No UI Dependency** - Controller doesn't need x/y/lane positioning
2. **Explicit Rules** - Gates, states, facts clearly defined
3. **Fact Consistency** - Aliases resolve naming mismatches
4. **Type Safety** - `runPolicy` object replaces string "once"
5. **Completion Tracking** - All nodes have explicit completion signals
6. **Backward Compatible** - Legacy flows work without changes

---

## ✅ **Ready for Production**

The schema is now production-ready for:
- ✅ UI authoring (already implemented)
- ✅ API storage (DynamoDB)
- ✅ Backend compilation (deterministic controller)
- ✅ Runtime execution (agent decides next node)

**No edges. No workflows. Pure declarative, agentic control.** 🎯

