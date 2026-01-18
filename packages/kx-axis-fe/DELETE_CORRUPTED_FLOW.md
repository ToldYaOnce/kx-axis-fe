# DELETE CORRUPTED FLOW - Instructions

## 🚨 The Problem

Flow `flow_1768746950413_8z3339k` was created with `primaryGoal` as an OBJECT:
```json
{
  "primaryGoal": {
    "type": "GATE",
    "gate": "BOOKING",
    "description": "..."
  }
}
```

The backend validation code does `flow.primaryGoal.trim()` which crashes because objects don't have `.trim()`.

**This flow is CORRUPTED AT THE DATABASE LEVEL and cannot be fixed.**

---

## ✅ Solution: Delete and Start Fresh

### **STEP 1: Clear Browser State**

1. Open DevTools → Console
2. Run:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
3. **Hard refresh** the page (Ctrl+Shift+R)

---

### **STEP 2: Delete the Corrupted Flow (Optional)**

The corrupted flow can be deleted via API:

```bash
curl -X DELETE 'https://i41zn9fza8.execute-api.us-east-1.amazonaws.com/prod/agent/flows?flowId=flow_1768746950413_8z3339k' \
  -H 'x-service-key: qhO4JD5yBBjVZbzRxnL-BhbapFTvPaSTYNVVu97JxzU' \
  -H 'x-tenant-id: tenant_1757418497028_g9o6mnb4m'
```

Or from DevTools Console:
```javascript
fetch('https://i41zn9fza8.execute-api.us-east-1.amazonaws.com/prod/agent/flows?flowId=flow_1768746950413_8z3339k', {
  method: 'DELETE',
  headers: {
    'x-service-key': 'qhO4JD5yBBjVZbzRxnL-BhbapFTvPaSTYNVVu97JxzU',
    'x-tenant-id': 'tenant_1757418497028_g9o6mnb4m'
  }
}).then(r => r.json()).then(console.log);
```

---

### **STEP 3: Verify the Fix is Working**

After clearing state, click **"Publish"** on your flow.

**Check Console Output:**

```
✅ Create request structure: {
  'Flow primaryGoal (MUST BE STRING)': 'BOOKING',    ✅ STRING!
  'Flow primaryGoal type': 'string',                  ✅ 'string'!
  'DraftGraph primaryGoal (CAN BE OBJECT)': {
    type: 'GATE',
    gate: 'BOOKING',
    description: '...'
  },
  'DraftGraph primaryGoal type': 'object'
}
```

**Check Network Tab (POST /agent/flows):**

Request body should show:
```json
{
  "name": "Sample Conversation Flow",
  "primaryGoal": "BOOKING",              ← STRING!
  "draftGraph": {
    "primaryGoal": {                     ← Object is OK here
      "type": "GATE",
      "gate": "BOOKING",
      "description": "..."
    },
    "nodes": [...]
  }
}
```

---

### **STEP 4: Verify the New Flow is Correct**

After successful creation, GET the new flow:

```javascript
fetch('https://i41zn9fza8.execute-api.us-east-1.amazonaws.com/prod/agent/flows?flowId=NEW_FLOW_ID', {
  headers: {
    'x-service-key': 'qhO4JD5yBBjVZbzRxnL-BhbapFTvPaSTYNVVu97JxzU',
    'x-tenant-id': 'tenant_1757418497028_g9o6mnb4m'
  }
}).then(r => r.json()).then(data => {
  console.log('Flow primaryGoal:', data.flow.primaryGoal);
  console.log('Type:', typeof data.flow.primaryGoal);
});
```

**Expected Output:**
```
Flow primaryGoal: BOOKING          ✅ STRING!
Type: string                        ✅ Correct!
```

---

## ✅ The Fix IS Already in Place

**In `TopBar.tsx` (Line 251-253):**

```typescript
const flowPrimaryGoalString = typeof draftGraph.primaryGoal === 'string' 
  ? draftGraph.primaryGoal 
  : draftGraph.primaryGoal?.gate || 'BOOKING';

const createPayload = {
  name: flow.name,
  primaryGoal: flowPrimaryGoalString,  // ✅ ALWAYS a STRING!
  ...
};
```

This code:
1. Checks if `draftGraph.primaryGoal` is already a string → use it
2. Otherwise, extract the `.gate` property from the object
3. Fallback to `'BOOKING'` if neither works

**The fix is correct. You just need to clear the old corrupted flow from your state.**

---

## 🎯 Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Clear localStorage/sessionStorage | ⏳ Do this |
| 2 | Hard refresh browser | ⏳ Do this |
| 3 | Click "Publish" | ⏳ Do this |
| 4 | Verify console shows STRING primaryGoal | ⏳ Check this |
| 5 | Verify Network tab shows correct payload | ⏳ Check this |
| 6 | Verify new flow has string primaryGoal | ⏳ Check this |

---

**Date:** 2026-01-18  
**Issue:** Corrupted flow with OBJECT primaryGoal  
**Solution:** Clear state, create fresh flow  
**Status:** ✅ Fix is ready, needs testing


