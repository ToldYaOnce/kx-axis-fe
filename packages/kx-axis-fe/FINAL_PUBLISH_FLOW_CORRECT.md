# FINAL PUBLISH FLOW - CORRECT IMPLEMENTATION

## Summary

This document describes the **CORRECT** implementation of the conversation flow publishing workflow, matching the backend API expectations **EXACTLY**.

---

## 🎯 THE CORRECT 2-STEP PROCESS

### **STEP 1: CREATE FLOW + DRAFT (Single POST Request)**

**Endpoint:** `POST /agent/flows`

**Request Body:**
```json
{
  "name": "Sample Conversation Flow",
  "primaryGoal": "BOOKING",              // ← STRING (not object!)
  "description": "Flow description",
  "industry": "Fitness",
  "draftGraph": {                        // ← INCLUDE draftGraph in create!
    "entryNodeIds": ["welcome-1"],
    "primaryGoal": {                     // ← Object is OK here
      "type": "GATE",
      "gate": "BOOKING",
      "description": "User has booked a consultation"
    },
    "gateDefinitions": {
      "CONTACT": {
        "satisfiedBy": {
          "metricsAny": ["contact_email", "contact_phone"]
        }
      },
      "BOOKING": {
        "satisfiedBy": {
          "metricsAll": ["booking_date", "booking_type"]
        }
      }
    },
    "factAliases": {
      "email": "contact_email",
      "phone": "contact_phone"
    },
    "defaults": {
      "retryPolicy": {
        "maxAttempts": 2,
        "onExhaust": "BROADEN",
        "cooldownTurns": 0,
        "promptVariantStrategy": "ROTATE"
      }
    },
    "_semantics": {
      "retryPolicy": "RetryPolicy counts attempts..."
    },
    "nodes": [
      {
        "id": "welcome-1",
        "type": "EXPLANATION",           // NOT "kind"!
        "title": "Welcome",
        "produces": {                    // NOT array!
          "facts": ["WELCOME_SHOWN"]     // Wrapped in object
        },
        "config": {                      // ALL other fields go here
          "purpose": "Greet the user",
          "importance": "high",
          "runPolicy": {
            "maxExecutions": 1
          }
        }
      },
      {
        "id": "booking-1",
        "type": "ACTION_BOOKING",
        "title": "Book Consultation",
        "requires": {                    // NOT array!
          "facts": ["CONTACT"]           // Wrapped in object
        },
        "produces": {
          "facts": ["booking_date", "booking_type"]
        },
        "config": {
          "satisfies": {
            "gates": ["BOOKING"]
          }
        }
      }
    ],
    "edges": []
  }
}
```

**Response:**
```json
{
  "flowId": "flow_123",
  "draftId": "current",
  "createdAt": "2026-01-18T...",
  "sourceHash": "abc123..."              // ← SAVE THIS for step 2!
}
```

---

### **STEP 2: PUBLISH VERSION**

**Endpoint:** `PATCH /agent/flows?flowId={flowId}&action=publish`

**Request Body:**
```json
{
  "publishNote": "Initial version",
  "publishedBy": "system",               // Optional
  "sourceDraftHash": "abc123..."         // From step 1 response
}
```

**Success Response (200):**
```json
{
  "flowId": "flow_123",
  "versionId": "2026-01-18T14:30:00.000Z",
  "flowSignature": "sha256_xyz...",
  "validationReport": {
    "ok": true,
    "errors": [],
    "warnings": [],
    "stats": {
      "nodeCount": 7,
      "edgeCount": 0,
      "factCount": 5
    }
  },
  "message": "Flow published successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Cannot publish flow with validation errors",
  "details": {
    "validationReport": {
      "errors": [
        {
          "code": "INVALID_NODE_STRUCTURE",
          "message": "Node 'booking-1' has invalid requires format"
        }
      ]
    }
  }
}
```

---

## ✅ CRITICAL: Correct Node Structure

### **REQUIRED FORMAT:**
```json
{
  "id": "unique-node-id",
  "type": "EXPLANATION",                 // Valid: EXPLANATION, REFLECTIVE_QUESTION, GOAL_GAP_TRACKER, BASELINE_CAPTURE, ACTION_BOOKING, HANDOFF
  "title": "Human-readable title",
  "requires": {                          // ✅ Object with 'facts' array
    "facts": ["fact1", "fact2"]
  },
  "produces": {                          // ✅ Object with 'facts' array
    "facts": ["fact3", "fact4"]
  },
  "config": {                            // ✅ All extra fields in config
    "purpose": "Why this node exists",
    "importance": "high",
    "runPolicy": {
      "maxExecutions": 1
    },
    "retryPolicy": {
      "maxAttempts": 3,
      "onExhaust": "BROADEN"
    },
    "satisfies": {
      "gates": ["BOOKING"],
      "states": ["SOME_STATE"]
    },
    "requiresStates": ["STATE1"],
    "eligibility": {...},
    "goalGapTracker": {...}              // For GOAL_GAP_TRACKER nodes only
  }
}
```

### **❌ WRONG FORMATS (DO NOT USE!):**

```json
// ❌ WRONG: Using "kind" instead of "type"
{
  "id": "node-1",
  "kind": "EXPLANATION",                 // Wrong field name!
  "title": "Welcome"
}

// ❌ WRONG: Flat array for requires
{
  "id": "node-1",
  "type": "ACTION_BOOKING",
  "requires": ["CONTACT"]                // Should be { facts: ["CONTACT"] }
}

// ❌ WRONG: Flat array for produces
{
  "id": "node-1",
  "type": "EXPLANATION",
  "produces": ["WELCOME_SHOWN"]          // Should be { facts: ["WELCOME_SHOWN"] }
}

// ❌ WRONG: Fields not in config
{
  "id": "node-1",
  "type": "EXPLANATION",
  "title": "Welcome",
  "purpose": "Greet user",               // Should be in config!
  "importance": "high",                  // Should be in config!
  "satisfies": {...}                     // Should be in config!
}
```

---

## 🔍 Two Different `primaryGoal` Fields

**This is the most confusing part!** There are TWO DIFFERENT `primaryGoal` fields:

### **1. Flow-Level `primaryGoal` (Metadata) - STRING**
- **Location**: Top-level in the flow creation request
- **Type**: `string`
- **Purpose**: Simple identifier for the flow's main goal
- **Example**: `"BOOKING"`, `"HANDOFF"`, `"CONTACT"`

### **2. DraftGraph-Level `primaryGoal` (Config) - OBJECT**
- **Location**: Inside `draftGraph` object
- **Type**: `{ type: string, gate?: string, state?: string, description?: string }`
- **Purpose**: Detailed configuration for runtime controller
- **Example**:
  ```json
  {
    "type": "GATE",
    "gate": "BOOKING",
    "description": "User has booked a consultation"
  }
  ```

---

## 📊 Implementation in TopBar.tsx

### **Code Structure:**

```typescript
// Build draftGraph with detailed primaryGoal (OBJECT)
const draftGraph = {
  entryNodeIds: [...],
  primaryGoal: {                         // ← Object for draftGraph
    type: 'GATE',
    gate: 'BOOKING',
    description: '...'
  },
  gateDefinitions: {...},
  nodes: flow.nodes.map((node) => {
    // Build config object
    const config: Record<string, any> = {};
    if (node.purpose) config.purpose = node.purpose;
    if (node.importance) config.importance = node.importance;
    // ... add all other fields to config
    
    return {
      id: node.id,
      type: node.type,                   // Not "kind"!
      title: node.title,
      ...(node.requires && node.requires.length > 0 && {
        requires: { facts: node.requires }  // Wrap in object
      }),
      ...(node.produces && node.produces.length > 0 && {
        produces: { facts: node.produces }  // Wrap in object
      }),
      ...(Object.keys(config).length > 0 && { config }),  // All extras in config
    };
  }),
  edges: [],
};

// Create flow with STRING primaryGoal
const createPayload = {
  name: flow.name,
  primaryGoal: draftGraph.primaryGoal?.gate || 'BOOKING',  // ← Extract STRING
  description: flow.description,
  industry: flow.industry,
  draftGraph,  // ← Include draftGraph in create!
};

const createResult = await flowAPI.createFlow(createPayload);

// Publish using sourceHash from create response
const publishResult = await flowAPI.publishFlow(createResult.flowId, {
  publishNote,
  publishedBy: 'system',
  sourceDraftHash: createResult.sourceHash,  // From create response
});
```

---

## 🚫 Common Mistakes (AVOID THESE!)

1. ❌ Using `"kind"` instead of `"type"` for nodes
2. ❌ Sending `requires` as flat array: `["CONTACT"]`
3. ❌ Sending `produces` as flat array: `["fact"]`
4. ❌ Putting `satisfies`, `purpose`, `importance` at node root instead of in `config`
5. ❌ Sending `primaryGoal` as object at flow level (must be string)
6. ❌ Sending `uiLayout` to backend (backend doesn't want it)
7. ❌ Not including `draftGraph` in initial create request
8. ❌ Doing 3 separate API calls (create, save draft, publish) instead of 2 (create+draft, publish)

---

## ✅ Verification Checklist

Before publishing, verify:

- [ ] Flow-level `primaryGoal` is a **STRING** (e.g., `"BOOKING"`)
- [ ] DraftGraph-level `primaryGoal` is an **OBJECT** with `type`, `gate`, `description`
- [ ] All nodes use `"type"` field (not `"kind"`)
- [ ] All `requires` are wrapped: `{ facts: [...] }`
- [ ] All `produces` are wrapped: `{ facts: [...] }`
- [ ] All extra node fields are in `config` object
- [ ] `draftGraph` is included in initial create request
- [ ] `uiLayout` is **NOT** sent to backend (stored in localStorage instead)
- [ ] `sourceHash` from create response is used for publish

---

## 🧪 Testing

1. **Hard refresh** browser (Ctrl+Shift+R)
2. **Click "Publish"**
3. **Check Console:**
   ```
   ✅ Create request structure: {
     primaryGoal: "BOOKING",                    // STRING!
     primaryGoalType: "string",
     hasDraftGraph: true,
     draftGraphPrimaryGoal: { type: "GATE", ... },  // OBJECT!
     firstNodeStructure: {
       hasRequiresFacts: true,                  // Should be true
       hasProducesFacts: true,                  // Should be true
       hasConfig: true                          // Should be true
     }
   }
   ```

4. **Check Network Tab:**
   - **POST /agent/flows** → Verify payload structure
   - **PATCH /agent/flows?...&action=publish** → Verify publish request

---

## 📚 Related Documentation

- Backend API: `FLOW_API_README.md`
- Previous fixes:
  - `REFACTOR_KIND_TO_TYPE.md` - Changed `kind` to `type`
  - `CRITICAL_NODE_SCHEMA_FIX.md` - Nested `requires`/`produces`, `config` wrapper
  - `CRITICAL_PRIMARY_GOAL_FIX.md` - String vs object for `primaryGoal`
- Publishing workflow: `PUBLISH_FIX_V4_TYPE_NOT_KIND.md`

---

**Date:** 2026-01-18  
**Status:** ✅ FINAL CORRECT IMPLEMENTATION  
**Priority:** CRITICAL  
**Backend Compatibility:** ✅ Matches backend expectations exactly


