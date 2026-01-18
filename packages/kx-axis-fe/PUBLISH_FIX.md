# Publish Flow Fix - Full Payload + Error Handling

## Issues Found

### **Issue 1: Publishing Not Sending Full Payload**
- **Problem:** Autosave was only saving a minimal payload (nodes + edges)
- **Missing:** `entryNodeIds`, `primaryGoal`, `gateDefinitions`, `factAliases`, `defaults`, `_semantics`
- **Impact:** When user clicked "Publish", backend received a request to publish an incomplete/invalid draft
- **Result:** 400 Bad Request from backend

### **Issue 2: False Success Toast**
- **Problem:** Publish error handling only checked for 409 conflicts
- **Missing:** Generic error handling for 400, 500, etc.
- **Impact:** Toast showed "✅ published successfully!" even when request failed with 400 Bad Request
- **Result:** User confusion - success message but failed request

---

## Root Cause Analysis

### **How Publish Flow Works:**

1. **User edits flow** → Autosave runs (every 1 second)
2. **Autosave** → Sends `PATCH /agent/flows?flowId={id}` with `draftGraph` + `uiLayout`
3. **Backend** → Saves draft with `sourceHash`
4. **User clicks "Publish"** → Frontend sends `PATCH /agent/flows?flowId={id}&action=publish`
5. **Backend** → Publishes the saved draft as a new version

### **The Problem:**

In step 2, the autosave was sending an **incomplete** `draftGraph`:

```typescript
// ❌ BEFORE (Incomplete):
const draftGraph = {
  nodes: [...],  // Only nodes
  edges: [],     // And edges
  // Missing: entryNodeIds, primaryGoal, gateDefinitions, factAliases, defaults, _semantics
};
```

When user clicked "Publish" (step 4), the backend tried to publish this incomplete draft and returned 400 Bad Request because it lacked required fields like `entryNodeIds`, `primaryGoal`, etc.

But the frontend error handling didn't catch non-409 errors, so it showed a success toast anyway!

---

## Fixes Applied

### **Fix 1: Complete Autosave Payload**

**File:** `src/context/FlowDataContext.tsx`

**Added all missing fields to autosave:**

```typescript
// ✅ AFTER (Complete):
const draftGraph: DraftGraph = {
  // ========== EXECUTION METADATA ==========
  entryNodeIds: (currentFlow as any).entryNodeIds || [currentFlow.nodes[0]?.id],
  
  primaryGoal: (currentFlow as any).primaryGoal || {
    type: 'GATE',
    gate: 'BOOKING',
    description: 'User has booked a consultation',
  },
  
  gateDefinitions: (currentFlow as any).gateDefinitions || {
    CONTACT: { satisfiedBy: { metricsAny: ['contact_email', 'contact_phone'] } },
    BOOKING: { satisfiedBy: { metricsAll: ['booking_date', 'booking_type'] } },
    HANDOFF: { satisfiedBy: { statesAll: ['HANDOFF_COMPLETE'] } },
  },
  
  factAliases: (currentFlow as any).factAliases || {
    target: 'goal_target',
    baseline: 'goal_baseline',
    delta: 'goal_delta',
    category: 'goal_category',
    email: 'contact_email',
    phone: 'contact_phone',
  },
  
  defaults: (currentFlow as any).defaults || {
    retryPolicy: {
      maxAttempts: 2,
      onExhaust: "BROADEN",
      cooldownTurns: 0,
      promptVariantStrategy: "ROTATE"
    }
  },
  
  _semantics: (currentFlow as any)._semantics || {
    retryPolicy: "RetryPolicy counts attempts to achieve a node's objective..."
  },
  
  // ========== NODES ========== (also enhanced)
  nodes: currentFlow.nodes.map((node) => {
    const nodeSatisfies = (node as any).satisfies;
    const cleanedSatisfies = nodeSatisfies ? {
      ...(nodeSatisfies.gates && { gates: nodeSatisfies.gates }),
      ...(nodeSatisfies.states && { states: nodeSatisfies.states }),
      // Explicitly exclude metrics (Option B semantics)
    } : undefined;
    
    const nodeRunPolicy = (node as any).runPolicy;
    const nodeRetryPolicy = (node as any).retryPolicy;
    
    return {
      id: node.id,
      kind: node.kind,
      title: node.title,
      purpose: (node as any).purpose,
      importance: (node as any).importance,
      // Only include maxRuns if runPolicy is not present
      ...(nodeRunPolicy ? {} : { maxRuns: (node as any).maxRuns }),
      runPolicy: nodeRunPolicy,
      retryPolicy: nodeRetryPolicy,
      produces: node.produces,
      requires: node.requires,
      requiresStates: (node as any).requiresStates,
      satisfies: cleanedSatisfies,
      eligibility: (node as any).eligibility,
      allowSupportiveLine: (node as any).allowSupportiveLine,
      goalGapTracker: (node as any).goalGapTracker,
      deadlineEnforcement: (node as any).deadlineEnforcement,
      priority: (node as any).priority,
      execution: (node as any).execution,
      goalLensId: (node as any).goalLensId,
    };
  }),
  edges: [],
};
```

---

### **Fix 2: Proper Error Handling**

**File:** `src/components/TopBar.tsx`

**Before (incorrect):**

```typescript
// ❌ BEFORE:
await publishFlow(publishNote);

// Check for success or conflict error
if (publishError?.status === 409) {
  // Show conflict dialog
  showToast('Draft has been modified. Please reload and try again.', 'warning');
  return;
}

// UNCONDITIONALLY shows success! 😱
setPublishDialogOpen(false);
setPublishSuccess(true);
```

**After (correct):**

```typescript
// ✅ AFTER:
await publishFlow(publishNote);

// Check for ANY errors
if (publishError) {
  if (publishError.status === 409) {
    showToast('Draft has been modified. Please reload and try again.', 'warning');
  } else {
    showToast(`Failed to publish: ${publishError.message || 'Unknown error'}`, 'error');
  }
  return;  // Don't show success!
}

// Only show success if there's no error
setPublishDialogOpen(false);
setPublishSuccess(true);
showToast('🎉 Conversation flow published successfully!', 'success');
```

---

### **Fix 3: Updated TypeScript Type**

**File:** `src/types/flow-api.ts`

**Before (incomplete):**

```typescript
// ❌ BEFORE:
export interface DraftGraph {
  nodes: Node[];
  edges?: Edge[];
}
```

**After (complete):**

```typescript
// ✅ AFTER:
export interface DraftGraph {
  // Execution metadata (added for deterministic controller)
  entryNodeIds?: string[];
  primaryGoal?: {
    type: 'GATE' | 'STATE';
    gate?: string;
    state?: string;
    description?: string;
  };
  gateDefinitions?: Record<string, {
    satisfiedBy: {
      metricsAll?: string[];
      metricsAny?: string[];
      statesAll?: string[];
    };
  }>;
  factAliases?: Record<string, string>;
  defaults?: {
    retryPolicy?: {
      maxAttempts: number;
      escalateOnFailure?: boolean;
      onExhaust?: string;
      cooldownTurns?: number;
      promptVariantStrategy?: string;
    };
  };
  _semantics?: Record<string, string>;
  
  // Core graph structure
  nodes: Node[];
  edges?: Edge[];
}
```

---

## Testing

### **Test Scenario 1: Create New Flow and Publish**

1. Click "Create New Flow"
2. Add some conversation items
3. Click "Publish"
4. **Expected:** ✅ Success toast + 200 response in network tab

### **Test Scenario 2: Edit Existing Flow and Publish**

1. Load an existing flow
2. Make changes (add/edit/delete nodes)
3. Wait for "Saved" indicator (autosave)
4. Click "Publish"
5. **Expected:** ✅ Success toast + 200 response

### **Test Scenario 3: Publish with Backend Error**

1. Disconnect from internet or use invalid API key
2. Try to publish
3. **Expected:** ❌ Error toast with descriptive message (not success)

### **Test Scenario 4: Network Tab Inspection**

1. Open Chrome DevTools → Network tab
2. Make changes to flow (triggers autosave)
3. Check `PATCH /agent/flows?flowId={id}` request
4. **Verify payload includes:**
   - ✅ `draftGraph.entryNodeIds`
   - ✅ `draftGraph.primaryGoal`
   - ✅ `draftGraph.gateDefinitions`
   - ✅ `draftGraph.factAliases`
   - ✅ `draftGraph.defaults`
   - ✅ `draftGraph._semantics`
   - ✅ `draftGraph.nodes` (with all properties)
   - ✅ `draftGraph.edges`

---

## What Changed

### **Files Modified:**

1. **`src/context/FlowDataContext.tsx`**
   - Added all execution metadata fields to autosave payload
   - Enhanced node mapping to include all properties
   - Matches the "quick publish" logic in TopBar

2. **`src/components/TopBar.tsx`**
   - Fixed error handling to check for ANY error, not just 409
   - Added explicit success toast (was missing)
   - Prevents false success messages

3. **`src/types/flow-api.ts`**
   - Updated `DraftGraph` interface to include all new fields
   - Provides proper TypeScript types for autosave payload

---

## Before vs After

### **Before (Broken):**

```
User edits flow
  ↓
Autosave sends minimal payload (missing metadata)
  ↓
Backend saves incomplete draft
  ↓
User clicks "Publish"
  ↓
Backend: "❌ 400 Bad Request - Invalid draft"
  ↓
Frontend: "✅ Published successfully!" (WRONG!)
```

### **After (Fixed):**

```
User edits flow
  ↓
Autosave sends COMPLETE payload (with metadata) ✅
  ↓
Backend saves valid draft ✅
  ↓
User clicks "Publish"
  ↓
Backend: "✅ 200 OK - Published as v1.0.1" ✅
  ↓
Frontend: "✅ Published successfully!" (CORRECT!)
```

**OR** (if error):

```
...
  ↓
Backend: "❌ 400 Bad Request"
  ↓
Frontend: "❌ Failed to publish: Invalid payload" (CORRECT!)
```

---

## Related Documentation

- `FLOW_SCHEMA_UPDATE.md` - Schema normalization details
- `CONTROLLER_RUNTIME_SPEC.md` - Controller expectations
- `GATE_SEMANTICS.md` - Gate satisfaction rules

---

## Notes

- The autosave now sends the **exact same payload structure** as the "quick publish" path
- Default values are provided for missing fields (entryNodeIds, primaryGoal, etc.)
- The `(currentFlow as any)` casts are temporary until we update the ConversationFlow type
- Error handling now covers ALL error cases, not just 409 conflicts

---

## Future Enhancements

1. **Store metadata in ConversationFlow type** instead of using `(flow as any)`
2. **Add retry logic** for transient network errors
3. **Show draft validation** before allowing publish (prevent invalid drafts)
4. **Add "Publish Preview"** showing what will be published
5. **Better error messages** with actionable suggestions


