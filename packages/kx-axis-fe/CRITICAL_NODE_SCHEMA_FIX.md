# CRITICAL FIX: Node Schema Structure (requires, produces, config)

## Summary

The backend API requires a **specific nested structure** for node objects that was NOT being followed. This fix restructures how we send nodes to match the backend schema exactly.

---

## 🚨 The Problem

### **What We Were Sending (WRONG):**
```json
{
  "id": "node-123",
  "type": "EXPLANATION",
  "title": "Welcome",
  "requires": ["CONTACT"],           // ❌ Flat array
  "produces": ["WELCOME_SHOWN"],     // ❌ Flat array
  "purpose": "Greet user",           // ❌ Top-level field
  "importance": "high",              // ❌ Top-level field
  "satisfies": {...},                // ❌ Top-level field
  "goalGapTracker": {...}            // ❌ Top-level field
}
```

### **What Backend Expects (CORRECT):**
```json
{
  "id": "node-123",
  "type": "EXPLANATION",
  "title": "Welcome",
  "requires": {                      // ✅ Nested object
    "facts": ["CONTACT"]
  },
  "produces": {                      // ✅ Nested object
    "facts": ["WELCOME_SHOWN"]
  },
  "config": {                        // ✅ All extras in config
    "purpose": "Greet user",
    "importance": "high",
    "satisfies": {...},
    "goalGapTracker": {...}
  }
}
```

---

## 🔧 What Changed

### **1. `requires` → Nested Object**

**Before:**
```typescript
return {
  id: node.id,
  type: node.type,
  requires: node.requires,  // ["CONTACT"]
};
```

**After:**
```typescript
return {
  id: node.id,
  type: node.type,
  ...(node.requires && node.requires.length > 0 && {
    requires: { facts: node.requires }  // { facts: ["CONTACT"] }
  }),
};
```

---

### **2. `produces` → Nested Object**

**Before:**
```typescript
return {
  id: node.id,
  type: node.type,
  produces: node.produces,  // ["WELCOME_SHOWN"]
};
```

**After:**
```typescript
return {
  id: node.id,
  type: node.type,
  ...(node.produces && node.produces.length > 0 && {
    produces: { facts: node.produces }  // { facts: ["WELCOME_SHOWN"] }
  }),
};
```

---

### **3. All Extra Fields → `config` Object**

**Before:**
```typescript
return {
  id: node.id,
  type: node.type,
  title: node.title,
  purpose: node.purpose,           // ❌ Top-level
  importance: node.importance,     // ❌ Top-level
  runPolicy: node.runPolicy,       // ❌ Top-level
  satisfies: node.satisfies,       // ❌ Top-level
  goalGapTracker: node.goalGapTracker,  // ❌ Top-level
};
```

**After:**
```typescript
const config: Record<string, any> = {};

if (node.purpose) config.purpose = node.purpose;
if (node.importance) config.importance = node.importance;
if (node.runPolicy) config.runPolicy = node.runPolicy;
if (node.satisfies) config.satisfies = node.satisfies;
if (node.goalGapTracker) config.goalGapTracker = node.goalGapTracker;
// ... all other extra fields ...

return {
  id: node.id,
  type: node.type,
  title: node.title,
  ...(Object.keys(config).length > 0 && { config }),  // ✅ All in config
};
```

---

## 📝 Files Modified

### **1. `src/context/FlowDataContext.tsx`**
- **Line ~277-298**: Node mapping in autosave `useEffect`
- **Change**: Restructured to use `{ facts: [...] }` for requires/produces, moved all extras to `config`

### **2. `src/components/TopBar.tsx`**
- **Line ~192-213**: Node mapping in Quick Publish (create flow path)
- **Line ~344-365**: Node mapping in replaceDraft before publish
- **Line ~480-501**: Node mapping in normal publish path
- **Change**: All 3 locations updated with same nested structure

### **3. `src/api/flowClient.ts`**
- **Line ~85-95**: Updated debug logging to show node structure
- **Change**: Added validation checks for `requires.facts`, `produces.facts`, `config` presence

---

## ✅ Complete Example

### **Before This Fix:**
```json
{
  "draftGraph": {
    "entryNodeIds": ["welcome-1"],
    "nodes": [
      {
        "id": "welcome-1",
        "type": "EXPLANATION",
        "title": "Welcome",
        "produces": ["WELCOME_SHOWN"],
        "purpose": "Greet user",
        "importance": "high",
        "runPolicy": { "maxExecutions": 1 }
      }
    ]
  }
}
```

### **After This Fix:**
```json
{
  "draftGraph": {
    "entryNodeIds": ["welcome-1"],
    "nodes": [
      {
        "id": "welcome-1",
        "type": "EXPLANATION",
        "title": "Welcome",
        "produces": {
          "facts": ["WELCOME_SHOWN"]
        },
        "config": {
          "purpose": "Greet user",
          "importance": "high",
          "runPolicy": { "maxExecutions": 1 }
        }
      }
    ]
  }
}
```

---

## 🧪 How to Verify

1. **Open DevTools → Console**
2. **Make a change** (add a node, edit text)
3. **Wait for autosave** (1 second)
4. **Check console logs:**

```
🔄 AUTOSAVE TRIGGERED - Draft Graph (correct structure): {
  nodeCount: 7,
  firstNode: {
    id: "welcome-1",
    type: "EXPLANATION",
    title: "Welcome",
    requires: { facts: [] },      // ✅ Object!
    produces: { facts: [...] },   // ✅ Object!
    config: { ... }                // ✅ Object!
  },
  nodeStructureCheck: {
    hasRequiresFacts: true,        // ✅ Should be true
    hasProducesFacts: true,        // ✅ Should be true
    hasConfig: true                // ✅ Should be true
  }
}
```

5. **Check Network tab:**
   - Look for `PATCH /agent/flows?flowId=...`
   - Inspect request body → `draftGraph.nodes[0]`
   - Verify nested structure

---

## 📊 Fields Moved to `config`

All of these fields are now nested under `config`:

- `purpose`
- `importance`
- `maxRuns` (if no `runPolicy`)
- `runPolicy`
- `retryPolicy`
- `requiresStates`
- `satisfies`
- `eligibility`
- `allowSupportiveLine`
- `goalGapTracker`
- `deadlineEnforcement`
- `priority`
- `execution`
- `goalLensId`

---

## 🔍 Why This Matters

### **Without This Fix:**
- ❌ Backend validation errors (`400 Bad Request`)
- ❌ Flow cannot be saved or published
- ❌ Node structure rejected by API

### **With This Fix:**
- ✅ Backend accepts the payload
- ✅ Flows save successfully
- ✅ Publishing works end-to-end
- ✅ Schema matches backend documentation exactly

---

## 🎯 Related Issues

This fix resolves:
- `400 Bad Request` errors when saving drafts
- `Invalid node structure` validation errors
- Publishing failures due to schema mismatch
- Mismatch between frontend representation and backend expectations

---

## 📚 Related Documentation

- Backend API: `FLOW_API_README.md`
- Previous fix: `REFACTOR_KIND_TO_TYPE.md`
- Publishing workflow: `PUBLISH_FIX_V4_TYPE_NOT_KIND.md`

---

## ⚠️ Important Notes

1. **Internal representation unchanged**: Frontend still uses flat arrays for `requires` and `produces` internally
2. **Transformation happens at API boundary**: Only when sending to backend
3. **Backward compatible**: Can still read old data (no breaking changes to UI)
4. **All API calls updated**: Autosave, publish, create flow all use correct structure

---

**Date:** 2026-01-18  
**Priority:** CRITICAL  
**Status:** ✅ Fixed


