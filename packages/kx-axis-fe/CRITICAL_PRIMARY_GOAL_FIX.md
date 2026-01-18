# CRITICAL FIX: primaryGoal Type Mismatch (String vs Object)

## Summary

The backend was **CRASHING** because of a type mismatch between the flow-level `primaryGoal` (which must be a STRING) and the draftGraph-level `primaryGoal` (which is an OBJECT).

---

## 🚨 The Problem

### **What We Were Sending (WRONG):**
```json
POST /agent/flows
{
  "name": "My Flow",
  "primaryGoal": {               // ❌ OBJECT - Backend expected STRING!
    "type": "GATE",
    "gate": "BOOKING",
    "description": "User has booked a consultation"
  },
  "description": "..."
}
```

### **What Backend Expects (CORRECT):**
```json
POST /agent/flows
{
  "name": "My Flow",
  "primaryGoal": "BOOKING",      // ✅ STRING ONLY!
  "description": "..."
}
```

---

## 💡 The Confusion

There are **TWO DIFFERENT `primaryGoal` FIELDS** in the schema:

### **1. Flow-level `primaryGoal` (Metadata)**
- **Location**: Top-level in the flow object
- **Type**: `string`
- **Purpose**: Simple identifier for the flow's goal
- **Example**: `"BOOKING"`, `"HANDOFF"`, `"CONTACT"`

### **2. DraftGraph-level `primaryGoal` (Execution Config)**
- **Location**: Inside `draftGraph` object
- **Type**: `object` with `{ type, gate?, state?, description? }`
- **Purpose**: Detailed configuration for the controller
- **Example**:
  ```json
  {
    "type": "GATE",
    "gate": "BOOKING",
    "description": "User has booked a consultation"
  }
  ```

---

## 🔧 The Fix

### **Changed in `TopBar.tsx` (Line ~252):**

**Before:**
```typescript
const createPayload = {
  name: flow.name,
  primaryGoal: draftGraph.primaryGoal,  // ❌ Sending OBJECT
  description: flow.description,
  industry: flow.industry,
};
```

**After:**
```typescript
const createPayload = {
  name: flow.name,
  primaryGoal: draftGraph.primaryGoal?.gate || 'BOOKING',  // ✅ Extracting STRING
  description: flow.description,
  industry: flow.industry,
};
```

### **Changed in `flow-api.ts`:**

**Before:**
```typescript
export interface CreateFlowRequest {
  name: string;
  primaryGoal: string | { type: string; gate?: string; ... };  // ❌ Allowed both
  description?: string;
  // ...
}

export interface FlowListItem {
  // ...
  primaryGoal: string | { type: string; gate?: string; ... };  // ❌ Allowed both
  // ...
}
```

**After:**
```typescript
export interface CreateFlowRequest {
  name: string;
  primaryGoal: string;  // ✅ MUST be a string (e.g., "BOOKING")
  description?: string;
  // ...
}

export interface FlowListItem {
  // ...
  primaryGoal: string;  // ✅ Flow-level primaryGoal is always a string
  // ...
}
```

---

## ✅ Complete Example (Correct Structure)

### **STEP 1: Create Flow (Metadata Only)**
```json
POST /agent/flows
{
  "name": "Fitness Consultation Flow",
  "primaryGoal": "BOOKING",          // ← STRING (extracted from draftGraph.primaryGoal.gate)
  "description": "A sample flow",
  "industry": "Fitness"
}
```

**Response:**
```json
{
  "flowId": "flow_123",
  "draftId": "current",
  "sourceHash": "abc123..."
}
```

---

### **STEP 2: Save Draft (Full Configuration)**
```json
PATCH /agent/flows?flowId=flow_123
{
  "draftGraph": {
    "entryNodeIds": ["welcome-1"],
    "primaryGoal": {                 // ← OBJECT (detailed config)
      "type": "GATE",
      "gate": "BOOKING",
      "description": "User has booked a consultation"
    },
    "gateDefinitions": {...},
    "nodes": [...]
  }
}
```

**Response:**
```json
{
  "draftId": "current",
  "sourceHash": "xyz789...",
  "updatedAt": "2026-01-18T..."
}
```

---

## 🔍 Why This Matters

### **Without This Fix:**
- ❌ Backend crashes with type validation error
- ❌ Flow creation fails completely
- ❌ Cannot publish any flows
- ❌ Type mismatch blocks all operations

### **With This Fix:**
- ✅ Backend accepts flow metadata
- ✅ Flow creation succeeds
- ✅ Publishing works end-to-end
- ✅ Type safety enforced in TypeScript

---

## 🧪 How to Verify

1. **Open DevTools → Console**
2. **Click "Publish"** on a flow
3. **Check console logs:**

```
📝 STEP 1: Creating flow...
✅ Flow metadata (primaryGoal as STRING): {
  name: "Sample Conversation Flow",
  primaryGoal: "BOOKING",        // ✅ Should be a STRING!
  primaryGoalType: "string"       // ✅ Should be "string"!
}

💾 STEP 2: Saving draft (draftGraph only)...
✅ DraftGraph metadata (primaryGoal as OBJECT): {
  entryNodeIds: ["welcome-1"],
  primaryGoal: {                  // ✅ Should be an OBJECT!
    type: "GATE",
    gate: "BOOKING",
    description: "..."
  },
  primaryGoalType: "object"       // ✅ Should be "object"!
}
```

4. **Check Network tab:**
   - **POST /agent/flows** → `primaryGoal` should be `"BOOKING"` (string)
   - **PATCH /agent/flows?flowId=...** → `draftGraph.primaryGoal` should be `{ type: "GATE", ... }` (object)

---

## 📊 Files Modified

1. **`src/components/TopBar.tsx`**
   - Line ~252: Extract `primaryGoal.gate` as string for createFlow
   - Added debug logging to show type difference

2. **`src/types/flow-api.ts`**
   - `CreateFlowRequest.primaryGoal`: Changed from `string | object` to `string`
   - `FlowListItem.primaryGoal`: Changed from `string | object` to `string`
   - Updated comments to clarify the distinction

---

## 🎯 Key Takeaway

**Two different `primaryGoal` fields, two different types:**

| Location | Field Path | Type | Purpose |
|----------|-----------|------|---------|
| Flow metadata | `flow.primaryGoal` | `string` | Simple identifier |
| Draft config | `draftGraph.primaryGoal` | `object` | Detailed config |

**Never confuse the two!** The flow-level field is just a label, the draftGraph field is the full definition.

---

## 📚 Related Documentation

- Backend API: `FLOW_API_README.md`
- Previous fixes:
  - `REFACTOR_KIND_TO_TYPE.md`
  - `CRITICAL_NODE_SCHEMA_FIX.md`
  - `PUBLISH_FIX_V4_TYPE_NOT_KIND.md`

---

**Date:** 2026-01-18  
**Priority:** CRITICAL  
**Status:** ✅ Fixed  
**Impact:** Prevents backend crashes on flow creation


