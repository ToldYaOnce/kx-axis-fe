# Industry Support Fix

## Issue
User selected "Finance" when creating a flow, but the conversation palette only showed general items (not finance-specific items).

## Root Cause
The backend Flow API doesn't fully support the `industry` field yet:
- `POST /agent/flows` accepts `industry` in the request
- `GET /agent/flows?flowId={flowId}` doesn't return `industry` in the response
- Result: Industry is lost after flow creation

## Solution (Temporary + Long-term)

### **Temporary Fix (Frontend localStorage)**
Until the backend fully supports industry persistence, we use localStorage as a fallback:

```typescript
// When creating a flow
localStorage.setItem(`flow_industry_${flowId}`, industry);

// When loading a flow
const storedIndustry = localStorage.getItem(`flow_industry_${flowId}`);
const industry = flow.industry || storedIndustry || 'Other';
```

**Fallback Chain:**
1. Try `flow.industry` (from backend response)
2. Fall back to `localStorage` (temporary storage)
3. Default to `'Other'` (if neither available)

### **Long-term Fix (Backend Support)**
Once the backend is updated to persist and return `industry`:

1. ✅ `POST /agent/flows` - Accept `industry` field (already added to request type)
2. ✅ Store `industry` in DynamoDB flow record
3. ✅ `GET /agent/flows?flowId={flowId}` - Return `industry` in response
4. ✅ `PATCH /agent/flows?flowId={flowId}` - Allow updating `industry`
5. ✅ Remove localStorage fallback (no longer needed)

---

## Changes Made

### **1. Type Definitions (`src/types/flow-api.ts`)**

Added `industry` to:
- `Flow` interface (backend response type)
- `CreateFlowRequest` interface
- `PatchFlowMetadataRequest` interface
- `FlowListItem` interface (already had it)

```typescript
export interface Flow {
  flowId: string;
  tenantId: string;
  name: string;
  description?: string;
  industry?: string;  // ✅ Added
  primaryGoal: string;
  // ...
}

export interface CreateFlowRequest {
  name: string;
  primaryGoal: string | { ... };
  description?: string;
  industry?: string;  // ✅ Added
  // ...
}

export interface PatchFlowMetadataRequest {
  name?: string;
  description?: string;
  primaryGoal?: string;
  industry?: string;  // ✅ Added
}
```

---

### **2. Flow Data Context (`src/context/FlowDataContext.tsx`)**

Added localStorage helpers and fallback logic:

```typescript
// Store industry in localStorage (temporary)
const getStoredIndustry = (flowId: string): string | null => {
  try {
    return localStorage.getItem(`flow_industry_${flowId}`);
  } catch {
    return null;
  }
};

const storeIndustry = (flowId: string, industry: string) => {
  try {
    localStorage.setItem(`flow_industry_${flowId}`, industry);
  } catch {
    // Ignore storage errors
  }
};

// Use fallback chain when converting Flow → ConversationFlow
const storedIndustry = getStoredIndustry(flow.flowId);
const industry = flow.industry || storedIndustry || 'Other';

const conversationFlow: ConversationFlow = {
  id: flow.flowId,
  name: flow.name,
  description: flow.description,
  industry,  // ✅ Now includes industry with fallback
  nodes: draft.draftGraph.nodes.map((node) => ({
    // ...
  })),
  // ...
};

// Store industry whenever flow changes
useEffect(() => {
  if (currentFlow && !isInitialLoadRef.current) {
    onFlowChanged?.(currentFlow);
    // Store industry in localStorage for persistence
    if (flowId && currentFlow.industry) {
      storeIndustry(flowId, currentFlow.industry);
    }
  }
}, [currentFlow, onFlowChanged, flowId]);
```

---

### **3. Demo App (`src/demo/DemoApp.tsx`)**

Added industry to create flow request and localStorage:

```typescript
const result = await flowAPI.createFlow({
  name: newFlowName.trim(),
  primaryGoal: 'BOOKING',
  description: `A ${newFlowIndustry} conversation flow`,
  industry: newFlowIndustry,  // ✅ Pass to backend
  draftGraph: { ... },
  editorState: { ... },
});

// Store in localStorage immediately (temporary until backend supports it)
try {
  localStorage.setItem(`flow_industry_${result.flowId}`, newFlowIndustry);
} catch (error) {
  console.warn('Failed to store industry in localStorage:', error);
}
```

---

## How It Works Now

### **Creating a Flow:**
1. User selects industry (e.g., "Finance") in create dialog
2. `POST /agent/flows` is called with `industry: "Finance"`
3. Backend may or may not store it (doesn't matter)
4. Frontend stores `flow_industry_{flowId} = "Finance"` in localStorage
5. Editor opens with Finance-specific items in palette ✅

### **Loading a Flow:**
1. `GET /agent/flows?flowId={flowId}` is called
2. Backend returns flow (may or may not include `industry`)
3. Frontend checks fallback chain:
   - Backend `flow.industry` ✅ (if backend supports it)
   - localStorage `flow_industry_{flowId}` ✅ (temporary fallback)
   - Default to `'Other'` (if neither available)
4. ConversationFlow is created with correct industry
5. Palette shows correct industry-specific items ✅

### **Updating Industry (in Overview Panel):**
1. User changes industry dropdown
2. `updateFlow({ industry: 'Healthcare' })` is called
3. Local state updates immediately
4. Palette re-renders with new items ✅
5. Industry is stored in localStorage
6. (Future: will also call `patchFlowMetadata({ industry: 'Healthcare' })`)

---

## Testing

### **Test 1: Create Flow with Industry**
1. Click "Create New Flow"
2. Enter name: "Test Finance Flow"
3. Select industry: "Finance"
4. Click "Create Flow"
5. ✅ Palette shows general items + Finance-specific items:
   - Risk Assessment
   - Account Type Selection
   - Investment Goals
   - Credit Check

### **Test 2: Reload Page**
1. Create flow with industry "Healthcare"
2. Refresh browser page (F5)
3. ✅ Industry persists (from localStorage)
4. ✅ Palette still shows Healthcare-specific items

### **Test 3: Change Industry**
1. Open Overview panel (right sidebar)
2. Change industry from "Finance" to "Technology"
3. ✅ Palette immediately updates with Tech-specific items:
   - Demo Request
   - Technical Requirements
   - Integration Needs
   - Support Tier Selection

---

## Backend TODO (Future)

When implementing backend support for `industry`:

1. **DynamoDB Schema:**
   ```typescript
   {
     PK: "TENANT#tenant_xxx",
     SK: "FLOW#flow_xxx",
     flowId: "flow_xxx",
     tenantId: "tenant_xxx",
     name: "My Flow",
     description: "...",
     industry: "Finance",  // ✅ Add this field
     primaryGoal: "BOOKING",
     // ...
   }
   ```

2. **API Endpoints:**
   - `POST /agent/flows` - Store `industry` from request body
   - `GET /agent/flows?flowId={flowId}` - Return `industry` in response
   - `PATCH /agent/flows?flowId={flowId}` - Allow updating `industry`

3. **Frontend Cleanup:**
   - Remove localStorage fallback code (no longer needed)
   - Keep only `flow.industry || 'Other'` fallback

---

## Notes

- ✅ Industry is now fully functional for palette filtering
- ✅ Industry persists across page reloads (via localStorage)
- ✅ Industry can be changed in Overview panel
- ⚠️ localStorage is temporary - will be replaced once backend supports it
- ⚠️ Industry updates don't yet trigger metadata PATCH (future enhancement)

---

## Files Modified

- `packages/kx-axis-fe/src/types/flow-api.ts` - Added `industry` to types
- `packages/kx-axis-fe/src/context/FlowDataContext.tsx` - Added localStorage fallback
- `packages/kx-axis-fe/src/demo/DemoApp.tsx` - Store industry on creation
- `packages/kx-axis-fe/INDUSTRY_SUPPORT_FIX.md` - This documentation

