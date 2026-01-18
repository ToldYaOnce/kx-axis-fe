# Conversation Flow Controller - Runtime Specification

## 🎯 **Overview**

This document defines the **deterministic execution semantics** for the conversation flow controller. The controller interprets stored flow definitions (from DynamoDB) and decides which node to run next based on runtime state, gates, facts, and policies.

---

## 📋 **Core Principles**

1. **Edge-less**: No explicit sequencing or workflow paths
2. **Agentic**: Controller decides dynamically based on state
3. **Deterministic**: Same state → same decision
4. **Gate-driven**: Flow completion determined by gate satisfaction
5. **Declarative**: All logic explicit in flow definition

---

## 🗂️ **Runtime State Model**

### **Persistent State (tracked across turns):**

```typescript
type RuntimeState = {
  // Extracted canonical facts
  facts: Set<string>,  // e.g., ["contact_email", "goal_target", "booking_date"]
  
  // Boolean completion flags
  states: Set<string>,  // e.g., ["GOAL_GAP_CAPTURED", "WELCOME_SHOWN"]
  
  // Satisfied gates (derived from facts/states)
  gatesSatisfied: Set<string>,  // e.g., ["CONTACT", "BOOKING"]
  
  // Conversational attempts per node (DOES NOT RESET)
  attemptsByNode: Record<nodeId, number>,
  
  // Actual executions per node (side effects produced)
  executionsByNode: Record<nodeId, number>,
  
  // Turn log (audit trail)
  turnLog: Array<{
    turnIndex: number,
    nodeId: string,
    mode: "EXECUTE" | "RETRY" | "BROADEN" | "HANDOFF",
    factsProduced: string[],
    statesProduced: string[],
    userInput?: string,
    llmResponse?: string
  }>
}
```

---

## 🔑 **Key Distinctions**

### **`attemptsByNode[nodeId]`**
- **What it tracks**: Conversational attempts to achieve node objective
- **Increments when**: 
  - Node executes (produces facts/states)
  - Node retries (rephrases/clarifies without execution)
- **Does NOT reset**: Persists across entire conversation
- **Used for**: Enforcing `retryPolicy.maxAttempts`

### **`executionsByNode[nodeId]`**
- **What it tracks**: Actual node executions (side effects)
- **Increments when**: Node produces facts/states/gates
- **Used for**: Enforcing `runPolicy.maxExecutions` (hard cap)

### **Example:**
```
Turn 1: contact-1 EXECUTE → attempts=1, executions=1, produces=[]
Turn 2: contact-1 RETRY → attempts=2, executions=1 (no new facts)
Turn 3: contact-1 RETRY → attempts=3, executions=1 (still nothing)
        → maxAttempts exhausted, apply onExhaust
```

---

## 🚪 **Gate Evaluation**

### **Gate Satisfaction Rules:**

```typescript
function isGateSatisfied(gateName: string, state: RuntimeState): boolean {
  const gateDef = gateDefinitions[gateName];
  if (!gateDef) return false;
  
  // Check metricsAll (ALL required facts must exist)
  if (gateDef.satisfiedBy.metricsAll) {
    for (const fact of gateDef.satisfiedBy.metricsAll) {
      if (!state.facts.has(fact)) return false;
    }
  }
  
  // Check metricsAny (AT LEAST ONE required fact must exist)
  if (gateDef.satisfiedBy.metricsAny) {
    const hasAny = gateDef.satisfiedBy.metricsAny.some(
      fact => state.facts.has(fact)
    );
    if (!hasAny) return false;
  }
  
  // Check statesAll (ALL required states must exist)
  if (gateDef.satisfiedBy.statesAll) {
    for (const stateName of gateDef.satisfiedBy.statesAll) {
      if (!state.states.has(stateName)) return false;
    }
  }
  
  return true;
}
```

### **Gate Examples:**

```json
"CONTACT": {
  "satisfiedBy": {
    "metricsAny": ["contact_email", "contact_phone"]  // Email OR phone
  }
}

"BOOKING": {
  "satisfiedBy": {
    "metricsAll": ["booking_date", "booking_type"]  // Date AND type
  }
}

"HANDOFF": {
  "satisfiedBy": {
    "statesAll": ["HANDOFF_COMPLETE"]  // State flag
  }
}
```

---

## 🎯 **Node Eligibility**

### **A node is eligible if ALL of the following are true:**

```typescript
function isNodeEligible(node: FlowNode, state: RuntimeState): boolean {
  // 1. Check execution cap
  const executions = state.executionsByNode[node.id] || 0;
  const maxExec = node.runPolicy?.maxExecutions ?? Infinity;
  if (executions >= maxExec) return false;
  
  // 2. Check required gates
  if (node.requires) {
    for (const gateName of node.requires) {
      if (!state.gatesSatisfied.has(gateName)) return false;
    }
  }
  
  // 3. Check required states
  if (node.requiresStates) {
    for (const stateName of node.requiresStates) {
      if (!state.states.has(stateName)) return false;
    }
  }
  
  // 4. Check if node's gates are already satisfied (optional: skip if done)
  if (node.satisfies?.gates) {
    const allSatisfied = node.satisfies.gates.every(
      gate => state.gatesSatisfied.has(gate)
    );
    if (allSatisfied && executions > 0) return false;  // Already done
  }
  
  return true;
}
```

---

## 🔄 **Retry Policy Semantics**

### **When to RETRY vs EXECUTE:**

```typescript
function determineMode(node: FlowNode, state: RuntimeState): Mode {
  const attempts = state.attemptsByNode[node.id] || 0;
  const executions = state.executionsByNode[node.id] || 0;
  
  // Get retry policy (node-level or flow defaults)
  const retryPolicy = node.retryPolicy || flow.defaults.retryPolicy;
  const maxAttempts = retryPolicy.maxAttempts;
  
  // First time? Always EXECUTE
  if (attempts === 0) return "EXECUTE";
  
  // Check if node objective already satisfied
  const objectiveSatisfied = checkObjectiveSatisfied(node, state);
  if (objectiveSatisfied) return "EXECUTE";  // Move to next
  
  // Exhausted attempts?
  if (attempts >= maxAttempts) {
    switch (retryPolicy.onExhaust) {
      case "CLARIFY": return "RETRY";  // One more clarifying attempt
      case "BROADEN": return "BROADEN";  // Relax constraints
      case "HANDOFF": return "HANDOFF";  // Escalate to human
      case "SKIP": return "SKIP";  // Move to next eligible node
    }
  }
  
  // Within attempt limit: RETRY
  return "RETRY";
}
```

### **Retry Policy Fields:**

```typescript
type RetryPolicy = {
  maxAttempts: number;  // How many conversational attempts before giving up
  onExhaust: "CLARIFY" | "BROADEN" | "HANDOFF" | "SKIP";  // What to do when exhausted
  cooldownTurns?: number;  // Min turns before retrying (default 0)
  promptVariantStrategy?: "ROTATE" | "ESCALATE" | "REPHRASE";  // How to vary prompts
}
```

---

## 🎮 **Controller Decision Algorithm**

### **Main Loop:**

```typescript
function selectNextNode(flow: ConversationFlow, state: RuntimeState): Decision {
  // 1. Evaluate all gates
  updateGatesSatisfied(state);
  
  // 2. Check primary goal completion
  if (isPrimaryGoalSatisfied(flow.primaryGoal, state)) {
    return { status: "COMPLETE", nodeId: null, mode: null };
  }
  
  // 3. Find eligible nodes
  const eligibleNodes = flow.nodes.filter(node => 
    isNodeEligible(node, state)
  );
  
  if (eligibleNodes.length === 0) {
    return { status: "DEADLOCK", nodeId: null, mode: null };
  }
  
  // 4. Prioritize by importance
  eligibleNodes.sort((a, b) => {
    const importanceScore = { high: 3, normal: 2, low: 1 };
    const scoreA = importanceScore[a.importance] || 2;
    const scoreB = importanceScore[b.importance] || 2;
    
    if (scoreA !== scoreB) return scoreB - scoreA;  // Higher first
    
    // Tie-break: prefer less-attempted nodes
    const attemptsA = state.attemptsByNode[a.id] || 0;
    const attemptsB = state.attemptsByNode[b.id] || 0;
    return attemptsA - attemptsB;
  });
  
  // 5. Determine mode for selected node
  const selectedNode = eligibleNodes[0];
  const mode = determineMode(selectedNode, state);
  
  return {
    status: "OK",
    nodeId: selectedNode.id,
    mode: mode,
    reason: buildReason(selectedNode, state, mode)
  };
}
```

---

## 📊 **Mode Behaviors**

### **EXECUTE**
- **When**: First attempt OR objective satisfied OR ready for side effects
- **Actions**:
  - Increment `attemptsByNode[nodeId]`
  - Increment `executionsByNode[nodeId]`
  - Extract facts from user input (via LLM)
  - Apply `factAliases` to normalize fact names
  - Add facts to `state.facts`
  - Add states to `state.states`
  - Update `state.gatesSatisfied`

### **RETRY**
- **When**: Objective not met, attempts < maxAttempts
- **Actions**:
  - Increment `attemptsByNode[nodeId]`
  - Do NOT increment `executionsByNode[nodeId]`
  - Do NOT produce new facts/states
  - Rephrase/clarify prompt based on `promptVariantStrategy`
  - Continue conversational thread

### **BROADEN**
- **When**: `retryPolicy.onExhaust = "BROADEN"` and attempts exhausted
- **Actions**:
  - Relax node constraints
  - Consider adjacent/similar nodes
  - May reduce importance threshold temporarily

### **HANDOFF**
- **When**: `retryPolicy.onExhaust = "HANDOFF"` and attempts exhausted
- **Actions**:
  - Recommend human intervention
  - Log handoff reason
  - May pause flow or set `HANDOFF_REQUESTED` state

---

## 🔍 **Fact Extraction & Aliasing**

### **Fact Production Flow:**

```
1. Node produces raw facts: ["email", "phone"]
2. Apply factAliases: ["email" → "contact_email", "phone" → "contact_phone"]
3. Add canonical facts to state.facts: ["contact_email", "contact_phone"]
4. Evaluate gates using canonical facts
```

### **Example:**

```json
// Node definition
{
  "id": "contact-1",
  "produces": ["email", "phone"],
  "satisfies": { "gates": ["CONTACT"] }
}

// Gate definition
"CONTACT": {
  "satisfiedBy": {
    "metricsAny": ["contact_email", "contact_phone"]
  }
}

// Fact aliases
"factAliases": {
  "email": "contact_email",
  "phone": "contact_phone"
}

// Runtime:
User input: "My email is john@example.com"
→ Extract: ["email"]
→ Alias: ["contact_email"]
→ state.facts.add("contact_email")
→ CONTACT gate now satisfied (metricsAny met)
```

---

## ✅ **Flow Completion**

### **Primary Goal Check:**

```typescript
function isPrimaryGoalSatisfied(
  primaryGoal: { type: "GATE" | "STATE", gate?: string, state?: string },
  state: RuntimeState
): boolean {
  if (primaryGoal.type === "GATE") {
    return state.gatesSatisfied.has(primaryGoal.gate);
  }
  if (primaryGoal.type === "STATE") {
    return state.states.has(primaryGoal.state);
  }
  return false;
}
```

### **Post-Goal Execution (Optional):**

After primary goal satisfied, controller may:
- Continue running high-importance cleanup nodes (e.g., handoff, promo)
- OR immediately stop
- Configurable via flow-level `postGoalPolicy`

---

## 🛡️ **Error Handling**

### **Deadlock Detection:**
```
IF no eligible nodes AND primary goal not satisfied:
  → DEADLOCK
  → Log blocking reasons
  → Recommend manual intervention
```

### **Infinite Loop Prevention:**
```
IF same node selected 10+ consecutive turns:
  → Force BROADEN or HANDOFF
  → Log warning
```

### **Validation Errors:**
```
IF gate referenced but not defined:
  → Runtime error
  → Flow should be validated before storage
```

---

## 📈 **Metrics & Observability**

### **Track per conversation:**
- Total turns
- Nodes executed vs retried
- Gates satisfied timeline
- Average attempts per node
- Completion rate
- Handoff rate
- Deadlock occurrences

### **Track per flow:**
- Average conversation length
- Most-retried nodes
- Most common handoff points
- Gate satisfaction patterns

---

## 🎯 **Example Execution Trace**

```
TURN 1:
State: facts=[], states=[], gatesSatisfied=[]
Decision: welcome-1, EXECUTE
Result: facts=[], states=["WELCOME_SHOWN"], gatesSatisfied=[]

TURN 2:
Decision: reflect-1, EXECUTE
Result: facts=[], states=[...,"REFLECTION_COMPLETE"], gatesSatisfied=[]

TURN 3:
Decision: goal-gap-1, EXECUTE
User: "I want to bench press 300 lbs, currently at 225 lbs"
Result: facts=["goal_target","goal_baseline","goal_delta","goal_category"], states=[...,"GOAL_GAP_CAPTURED"]

TURN 4:
Decision: contact-1, EXECUTE
User: "Umm, not ready to share that"
Result: facts=[] (extraction failed), gatesSatisfied=[] (CONTACT not satisfied)
attemptsByNode[contact-1] = 1, executionsByNode[contact-1] = 1

TURN 5:
Decision: contact-1, RETRY (attempts < maxAttempts)
Prompt: "To personalize your plan, could you share an email or phone?"
User: "Ok, john@example.com"
Result: facts=["contact_email"], gatesSatisfied=["CONTACT"]
attemptsByNode[contact-1] = 2, executionsByNode[contact-1] = 1

TURN 6:
Decision: booking-1, EXECUTE
User: "Schedule me for next Tuesday"
Result: facts=["booking_date"], gatesSatisfied=["BOOKING"]
→ PRIMARY GOAL SATISFIED
```

---

## 🔄 **Version History**

- **v1.0** (2026-01-17): Initial specification
  - Core eligibility rules
  - Gate evaluation semantics
  - RetryPolicy vs RunPolicy distinction
  - attemptsByNode tracking

---

**This specification is the single source of truth for controller implementation.** 🎯

