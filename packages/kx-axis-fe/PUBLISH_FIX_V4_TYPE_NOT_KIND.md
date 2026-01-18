# Publish Fix V4 - Backend Expects `type` Not `kind` for Nodes

## The Issue

Backend validation error showed:
```json
{
  "id": "welcome-intro-1768746549132",
  "kind": "EXPLANATION",  // "kind" (wrong!)
  "title": "Welcome / Introduction"
}
```

The backend API expects nodes to have a **`type`** field, not **`kind`**.

---

## Root Cause

In our frontend codebase, we use `node.kind` to represent the node type (e.g., `"EXPLANATION"`, `"REFLECTIVE_QUESTION"`), but when sending to the backend API, we were using the field name `kind` instead of `type`.

### **Frontend (Internal):**
```typescript
interface FlowNode {
  id: string;
  kind: NodeKind;  // ← Frontend uses 'kind'
  title: string;
  ...
}
```

### **Backend API (Expected):**
```typescript
interface Node {
  id: string;
  type: string;  // ← Backend expects 'type'
  title: string;
  ...
}
```

---

## The Fix

Changed all instances where we build `draftGraph.nodes` to use `type` instead of `kind`.

### **Before (Broken):**
```typescript
nodes: flow.nodes.map((node) => ({
  id: node.id,
  kind: node.kind,  // ❌ Wrong field name!
  title: node.title,
  ...
}))
```

### **After (Fixed):**
```typescript
nodes: flow.nodes.map((node) => ({
  id: node.id,
  type: node.kind,  // ✅ Backend expects 'type', not 'kind'
  title: node.title,
  ...
}))
```

---

## Files Modified

### **1. `src/context/FlowDataContext.tsx` (Autosave)**
- Line 279: Changed `kind: node.kind` → `type: node.kind`

### **2. `src/components/TopBar.tsx` (Publish)**
- Line 194: Changed `kind: node.kind` → `type: node.kind` (Quick Publish)
- Line 339: Changed `kind: node.kind` → `type: node.kind` (Subsequent Publish)
- Line 475: Changed `kind: node.kind` → `type: node.kind` (Normal Publish)

### **3. `src/types/flow-api.ts` (Already Correct)**
- The `Node` interface already defined `type: string` ✅
- No changes needed

---

## Testing

### **1. Hard Refresh**
```
Ctrl+Shift+R (or Cmd+Shift+R)
```

### **2. Make a Change & Publish**

**Console Output (Should Show):**
```
🔄 AUTOSAVE TRIGGERED - Draft Graph Only (no uiLayout): {
  entryNodeIds: [...],
  primaryGoal: {...},
  nodeCount: 5,
  firstNode: {
    id: "welcome-intro-...",
    type: "EXPLANATION",  // ← Should be 'type', not 'kind'
    title: "Welcome / Introduction"
  }
}
```

### **3. Check Network Tab**

**Request Payload (PATCH /agent/flows?flowId=...):**
```json
{
  "draftGraph": {
    "entryNodeIds": ["welcome-intro-..."],
    "primaryGoal": {...},
    "nodes": [
      {
        "id": "welcome-intro-...",
        "type": "EXPLANATION",  // ✅ Should be 'type'
        "title": "Welcome / Introduction",
        ...
      }
    ]
  }
}
```

**Response:**
```json
{
  "flowId": "flow_...",
  "message": "Draft updated successfully",
  "sourceHash": "abc123..."
}
```

✅ **No validation errors!**

---

## Summary of All Fixes

| Version | Issue | Fix |
|---------|-------|-----|
| **V1** | Autosave sending incomplete payload | Added metadata fields |
| **V2** | Old incomplete draft in backend | Force fresh save before publish |
| **V3** | Backend rejecting `uiLayout` → 502 | Remove `uiLayout`, store in localStorage |
| **V4** | Backend expects `type` not `kind` → 400 | **Change `kind:` to `type:` in node mapping** ✅ |

---

## Why This Matters

The backend API contract specifies:
```typescript
interface Node {
  id: string;
  type: string;  // ← REQUIRED field name
  title: string;
  ...
}
```

We were sending:
```json
{ "kind": "EXPLANATION" }  // ❌ Unknown field 'kind'
```

Backend validation rejected it because `kind` is not a recognized field in the Node schema.

Now we send:
```json
{ "type": "EXPLANATION" }  // ✅ Recognized field 'type'
```

---

## Key Takeaway

**Frontend internal representation ≠ Backend API contract**

- Frontend uses `kind` for clarity and consistency with our naming conventions
- Backend uses `type` as per its API specification
- The mapping happens during serialization (when building the API request payload)

This is a common pattern in API integrations:
```
Frontend Model → Transform → Backend API Model
```

---

## Related Documentation

- Backend API: `FLOW_API_README.md`
- Node Schema: `src/types/flow-api.ts` (Node interface)
- Publishing Workflow: `PUBLISH_FIX_V3_NO_UILAYOUT.md`


