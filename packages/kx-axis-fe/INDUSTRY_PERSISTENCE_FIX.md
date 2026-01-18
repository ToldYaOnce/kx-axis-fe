# Industry Persistence Fix

## Issue
User selected "Finance" when creating a flow, but the editor shows "Industry: Other" and only general conversation items are visible (no Finance-specific items).

## Root Cause
Industry field is stored in localStorage but not being correctly loaded when the flow is initialized in the editor. Multiple issues:

1. `initialConfig` doesn't include industry from localStorage
2. Timing issue: localStorage is checked after initial render
3. FlowId might have prefixes that cause key mismatch

## Fix Applied

### **1. Enhanced Initial Flow State**
Modified `KxAxisComposer.tsx` to read industry from localStorage during state initialization:

```typescript
const [currentFlow, setCurrentFlow] = useState<ConversationFlow | null>(() => {
  // Enhance initialConfig with industry from localStorage if available
  if (initialConfig && flowId) {
    try {
      const storedIndustry = localStorage.getItem(`flow_industry_${flowId}`);
      if (storedIndustry) {
        return { ...initialConfig, industry: storedIndustry };
      }
    } catch (error) {
      console.warn('Failed to read industry from localStorage:', error);
    }
  }
  return initialConfig || null;
});
```

### **2. Added Console Logging**
Added debug logging to track industry resolution:

**In FlowDataContext:**
```typescript
console.log('🏭 Industry Resolution:', {
  flowId: flow.flowId,
  fromBackend: flow.industry,
  fromLocalStorage: storedIndustry,
  finalIndustry: industry,
});
```

**In DemoApp:**
```typescript
console.log('✅ Stored industry in localStorage:', {
  key: `flow_industry_${result.flowId}`,
  value: newFlowIndustry,
});
```

## Immediate Workaround

**For users experiencing this issue RIGHT NOW:**

1. Open the **Overview panel** (right sidebar)
2. Change the **Industry dropdown** from "Other" to "Finance"
3. The palette will **immediately** show Finance-specific items:
   - 📊 Risk Assessment
   - 🏦 Account Type Selection
   - 🎯 Investment Goals
   - ✅ Credit Check

## Debugging Steps

If the issue persists, check the browser console for:

1. **When creating flow:**
   ```
   ✅ Stored industry in localStorage: {
     key: "flow_industry_flow_123456",
     value: "Finance"
   }
   ```

2. **When loading flow:**
   ```
   🏭 Industry Resolution: {
     flowId: "flow_123456",
     fromBackend: undefined,
     fromLocalStorage: "Finance",
     finalIndustry: "Finance"
   }
   ```

## Common Issues & Solutions

### **Issue 1: localStorage Key Mismatch**
**Symptom:** Industry not found in localStorage despite being stored

**Cause:** FlowId might have prefix (e.g., `FLOW#flow_123` vs `flow_123`)

**Solution:** Ensure flowId is cleaned before using as localStorage key (already handled by `cleanId` function)

### **Issue 2: localStorage Disabled**
**Symptom:** Console shows "Failed to store industry in localStorage"

**Cause:** Browser has localStorage disabled or in private mode

**Solution:** 
- Enable localStorage in browser settings
- Exit private/incognito mode
- Or manually set industry in Overview panel each time

### **Issue 3: Timing Issue**
**Symptom:** Industry briefly shows as "Other" then updates to "Finance"

**Cause:** Initial render happens before localStorage is read

**Solution:** Already fixed with state initializer function

## Testing Checklist

- [ ] Create new flow with "Finance" industry
- [ ] Verify console shows "✅ Stored industry in localStorage"
- [ ] Verify editor loads with "Industry: Finance" (not "Other")
- [ ] Verify palette shows Finance-specific items immediately
- [ ] Refresh page (F5) and verify industry persists
- [ ] Change industry in Overview panel → palette updates immediately
- [ ] Create flow with different industry (e.g., "Healthcare")
- [ ] Verify Healthcare-specific items appear

## Backend TODO

Once backend adds full support for `industry` field:

1. Update `Flow` type in DynamoDB to include `industry`
2. `POST /agent/flows` - Store `industry` from request
3. `GET /agent/flows?flowId={flowId}` - Return `industry` in response
4. `PATCH /agent/flows?flowId={flowId}` - Allow updating `industry`
5. Remove localStorage fallback (no longer needed)

## Files Modified

- `packages/kx-axis-fe/src/components/KxAxisComposer.tsx` - Enhanced initial state
- `packages/kx-axis-fe/src/context/FlowDataContext.tsx` - Added logging
- `packages/kx-axis-fe/src/demo/DemoApp.tsx` - Added logging
- `packages/kx-axis-fe/INDUSTRY_PERSISTENCE_FIX.md` - This documentation

## Related Documentation

- `INDUSTRY_SUPPORT_FIX.md` - Original industry support implementation
- `INDUSTRY_CONVERSATION_ITEMS.md` - Industry-specific items configuration
- `ICON_MAPPING_FIX.md` - Icon support for all industries


