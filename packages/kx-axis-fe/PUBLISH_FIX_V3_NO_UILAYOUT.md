# Publish Fix V3 - Remove uiLayout from Backend Requests

## The REAL Problem (This Time For Real!)

Backend clarified: **DO NOT send `uiLayout` to the backend!**

The 502 Bad Gateway error was caused by sending `uiLayout` (nodePositions, laneAssignments) to the backend, which it doesn't expect or want.

---

## Backend's Actual Publishing Workflow

### **STEP 1: Save Draft**
```
PATCH /agent/flows?flowId={flowId}
Body: {
  "draftGraph": {
    "entryNodeIds": [...],
    "primaryGoal": {...},
    "gateDefinitions": {...},
    "nodes": [...],
    "edges": [...]
  }
  // ❌ NO uiLayout!
}
Response: { sourceHash: "abc123..." }
```

### **STEP 2: Publish**
```
PATCH /agent/flows?flowId={flowId}&action=publish
Body: {
  "publishNote": "...",
  "sourceDraftHash": "abc123..."  // From step 1
}
Response: { versionId: "2026-01-17...", ... }
```

---

## What I Fixed

### **1. Removed `uiLayout` from Autosave**

**File:** `src/context/FlowDataContext.tsx`

**Before:**
```typescript
saveDraft(draftGraph, uiLayout);  // ❌ Sent uiLayout to backend
```

**After:**
```typescript
// Store layout in localStorage (client-side only)
localStorage.setItem(`flow-${flowId}-layout`, JSON.stringify(uiLayout));

// Send ONLY draftGraph
saveDraft(draftGraph);  // ✅ No uiLayout!
```

---

### **2. Removed `uiLayout` from Publish**

**File:** `src/components/TopBar.tsx`

**Normal Publish Flow:**
```typescript
// Store layout in localStorage
localStorage.setItem(`flow-${activeFlowId}-layout`, JSON.stringify(uiLayout));

// STEP 1: Save draft (no uiLayout)
const saveResult = await flowAPI.replaceDraft(activeFlowId, {
  draftGraph,
  // ❌ NO uiLayout!
});

// STEP 2: Publish
const publishResult = await flowAPI.publishFlow(activeFlowId, {
  publishNote,
  sourceDraftHash: saveResult.sourceHash,
});
```

**Quick Publish Flow (when flowId is null):**
```typescript
// STEP 1: Create flow (metadata only)
const createResult = await flowAPI.createFlow({
  name, primaryGoal, description, industry
});

// STEP 2: Save draft (no uiLayout)
const draftResult = await flowAPI.replaceDraft(createResult.flowId, {
  draftGraph,  // ✅ No uiLayout!
});

// STEP 3: Publish
const publishResult = await flowAPI.publishFlow(createResult.flowId, {
  publishNote,
  sourceDraftHash: draftResult.sourceHash,
});
```

---

### **3. Layout Storage Strategy**

**Where Layout is Stored:**
- ✅ `localStorage`: `flow-${flowId}-layout` → `{ nodePositions, laneAssignments }`

**When Layout is Saved:**
- ✅ After every autosave (context)
- ✅ Before publish (TopBar)
- ✅ After flow creation (Quick Publish)

**When Layout is Loaded:**
- ✅ On flow load (from localStorage)
- ✅ Falls back to calculating from node prerequisites if no saved layout

---

## What Changed

### **Files Modified:**

1. **`src/context/FlowDataContext.tsx`**
   - Removed `uiLayout` parameter from `saveDraft()` call
   - Added localStorage save for layout
   - Added debug logging

2. **`src/components/TopBar.tsx`**
   - Removed `uiLayout` from `replaceDraft()` calls
   - Added localStorage save for layout
   - Updated Quick Publish to follow 3-step process
   - Updated Normal Publish to use 2-step process

3. **`src/api/flowClient.ts`**
   - Already had optional `uiLayout` in `ReplaceDraftRequest`
   - No changes needed (interface already correct)

---

## Testing Instructions

### **1. Hard Refresh**
```
Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

### **2. Check Console Logs**

When you make a change (autosave):
```
🔄 AUTOSAVE TRIGGERED - Draft Graph Only (no uiLayout): {
  entryNodeIds: [...],
  primaryGoal: {...},
  ...
}
```

When you click Publish:
```
🔄 Forcing fresh draft save before publish...
💾 Saving draft (draftGraph only, no uiLayout)...
📡 API REQUEST - replaceDraft: {
  hasEntryNodeIds: true,
  hasPrimaryGoal: true,
  hasGateDefinitions: true
}
✅ Draft saved, now publishing with sourceHash: abc123...
✅ Published successfully: { versionId: "..." }
```

### **3. Check Network Tab**

Look for **2 requests** (or 3 for Quick Publish):

**Normal Publish:**
1. `PATCH /agent/flows?flowId=...` (save draft)
   - Status: **200 OK** ✅
   - Request body: Contains `draftGraph` but **NO `uiLayout`** ✅
   
2. `PATCH /agent/flows?flowId=...&action=publish` (publish)
   - Status: **200 OK** ✅
   - Request body: `{ publishNote, sourceDraftHash }` ✅

**Quick Publish (flowId=null):**
1. `POST /agent/flows` (create flow)
   - Status: **200 OK** ✅
   - Request body: `{ name, primaryGoal, description, industry }` ✅
   
2. `PATCH /agent/flows?flowId=...` (save draft)
   - Status: **200 OK** ✅
   - Request body: Contains `draftGraph` but **NO `uiLayout`** ✅
   
3. `PATCH /agent/flows?flowId=...&action=publish` (publish)
   - Status: **200 OK** ✅
   - Request body: `{ publishNote, sourceDraftHash }` ✅

### **4. Expected Result**

- ✅ **No 502 Bad Gateway errors**
- ✅ **All requests return 200 OK**
- ✅ Toast: **"🎉 Conversation flow published successfully!"**
- ✅ Layout is preserved (from localStorage)

---

## What If It Still Fails?

### **400 Bad Request:**
- Check Response tab → look for validation errors
- Missing required fields (entryNodeIds, primaryGoal, etc.)
- Invalid field values

### **502 Bad Gateway:**
- Backend Lambda might be down or misconfigured
- Check CloudWatch logs (if you have access)

### **409 Conflict:**
- Draft was modified by someone else
- Shows toast: "Draft has been modified. Please reload and try again."

---

## Summary of Changes

| Version | Issue | Fix |
|---------|-------|-----|
| **V1** | Autosave sending incomplete payload | Added all metadata fields to autosave |
| **V2** | Old incomplete draft still in backend | Force fresh save before publish |
| **V3** | Backend rejecting `uiLayout` → 502 error | **Remove `uiLayout` from all API requests, store in localStorage** ✅ |

---

## Clean Up Tasks (Later)

1. Remove debug console logs
2. Remove obsolete "subsequent publish" section (line 269-421 in TopBar.tsx)
3. Add layout recovery logic if localStorage is cleared
4. Consider IndexedDB for larger layouts

---

## Why This Will Work Now

**Before:**
```
Frontend: "Here's the draft with uiLayout"
Backend: "What's uiLayout? 💥 502 Bad Gateway"
```

**After:**
```
Frontend: "Here's the draft (draftGraph only)"
Backend: "Perfect! Draft saved. Here's your sourceHash."
Frontend: "Now publish with that sourceHash"
Backend: "Published as v1.0.1!" ✅
```

---

**CRITICAL:** The backend **never** sees or stores UI layout information. It only cares about the execution graph (`draftGraph`). Layout is **purely client-side** concern.


