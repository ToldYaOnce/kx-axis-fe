# Gate Semantics - Single Source of Truth

## 🎯 **Core Principle**

**Gates are satisfied by facts, NOT by nodes declaring metrics.**

`gateDefinitions` is the **single source of truth** for gate satisfaction logic.

---

## ✅ **Correct Semantics (Option B - Implemented)**

### **Nodes:**
- Declare `produces` (facts they emit)
- Declare `satisfies.gates` (gates they contribute to satisfying)
- Declare `satisfies.states` (boolean completion flags)
- **DO NOT** declare `satisfies.metrics`

### **Gate Definitions:**
- Define what facts satisfy each gate
- Use `metricsAll`, `metricsAny`, `statesAll`
- This is the **authoritative** logic

---

## 📋 **Example**

### **Node (contact-1):**
```json
{
  "id": "contact-1",
  "produces": ["email", "phone"],
  "satisfies": {
    "gates": ["CONTACT"]
  }
}
```

### **Gate Definition:**
```json
{
  "gateDefinitions": {
    "CONTACT": {
      "satisfiedBy": {
        "metricsAny": ["contact_email", "contact_phone"]
      }
    }
  }
}
```

### **Fact Aliases:**
```json
{
  "factAliases": {
    "email": "contact_email",
    "phone": "contact_phone"
  }
}
```

---

## 🔍 **How It Works**

### **1. Node Executes:**
```
contact-1 runs
→ produces: ["email", "phone"]
→ runtime state gains facts: ["contact_email", "contact_phone"]
```

### **2. Controller Evaluates Gate:**
```
Check CONTACT gate:
→ gateDefinitions["CONTACT"].satisfiedBy.metricsAny = ["contact_email", "contact_phone"]
→ Does runtime state have at least ONE of these?
→ YES: contact_email exists
→ CONTACT gate is now satisfied
```

### **3. Unlocks Dependent Nodes:**
```
booking-1 has requires: ["CONTACT"]
→ CONTACT gate satisfied
→ booking-1 is now eligible
```

---

## ❌ **What We Removed**

### **Before (Incorrect - Dual Sources of Truth):**
```json
{
  "id": "contact-1",
  "produces": ["email", "phone"],
  "satisfies": {
    "gates": ["CONTACT"],
    "metrics": ["contact_email", "contact_phone"]  // ❌ REMOVED
  }
}
```

**Problem:** Two places defining gate logic:
1. Node says "I satisfy CONTACT via these metrics"
2. Gate definition says "CONTACT requires these metrics"

**Risk:** Inconsistency, ambiguity, maintenance burden

---

### **After (Correct - Single Source of Truth):**
```json
{
  "id": "contact-1",
  "produces": ["email", "phone"],
  "satisfies": {
    "gates": ["CONTACT"]  // ✅ Just declares intent
  }
}
```

**Benefit:** Gate logic lives in ONE place (`gateDefinitions`)

---

## 🎯 **Key Rules**

1. **Nodes produce facts** (`produces`)
2. **Nodes declare gate intent** (`satisfies.gates`)
3. **Gate definitions are authoritative** (`gateDefinitions`)
4. **Controller evaluates** (checks facts against gate rules)
5. **Metrics are never gate logic** (only for telemetry/reporting)

---

## 🧪 **Controller Pseudocode**

```python
def is_gate_satisfied(gate_name, runtime_state):
    gate_def = gateDefinitions[gate_name]
    
    # Check metricsAll (ALL required)
    if gate_def.satisfiedBy.metricsAll:
        for metric in gate_def.satisfiedBy.metricsAll:
            if metric not in runtime_state.facts:
                return False
    
    # Check metricsAny (AT LEAST ONE required)
    if gate_def.satisfiedBy.metricsAny:
        has_any = any(m in runtime_state.facts 
                      for m in gate_def.satisfiedBy.metricsAny)
        if not has_any:
            return False
    
    # Check statesAll (ALL required)
    if gate_def.satisfiedBy.statesAll:
        for state in gate_def.satisfiedBy.statesAll:
            if state not in runtime_state.states:
                return False
    
    return True
```

---

## ✅ **Benefits**

1. **Single source of truth** - Gate logic in one place
2. **Maintainability** - Change gate rules without touching nodes
3. **Clarity** - Nodes don't specify HOW gates work
4. **Flexibility** - Gates can be redefined without node changes
5. **Separation of concerns** - Nodes emit, gates evaluate

---

## 📦 **Updated Files**

- ✅ `PRODUCTION_FLOW.json` - removed all `satisfies.metrics`
- ✅ `src/demo/goalGapDemoData.ts` - removed all `satisfies.metrics`
- ✅ Gate logic preserved in `gateDefinitions` (unchanged)
- ✅ Node `produces` preserved (unchanged)

---

**Schema is now semantically clean and ready for deterministic execution.** 🎯


