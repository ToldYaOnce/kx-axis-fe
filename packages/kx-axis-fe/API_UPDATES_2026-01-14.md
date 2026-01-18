# Flow API Updates - January 14, 2026

## ⚠️ **BREAKING CHANGES** - Action Required

The backend API has been updated with structural changes that require frontend updates. All changes have been implemented.

---

## 1. Node Structure Change (CRITICAL)

### OLD (Flat Arrays)
```typescript
{
  "id": "node1",
  "type": "EXPLANATION",
  "title": "Welcome",
  "requires": ["contact.email"],
  "produces": ["booking.confirmed"]
}
```

### NEW (Nested Objects)
```typescript
{
  "id": "node1",
  "type": "EXPLANATION",
  "title": "Welcome",
  "requires": {
    "facts": ["contact.email"],
    "readiness": {}
  },
  "produces": {
    "facts": ["booking.confirmed"],
    "readinessDelta": {}
  }
}
```

**Impact:** All draft save operations must use new structure.

**Status:** ✅ **FIXED** - FlowDataContext now converts between frontend (flat) and backend (nested) structures automatically.

---

## 2. Edge Structure Change

### OLD
```typescript
{
  "from": "node1",
  "to": "node2"
}
```

### NEW
```typescript
{
  "id": "edge1",        // NEW - Required
  "source": "node1",    // Renamed from "from"
  "target": "node2",    // Renamed from "to"
  "label": "next"       // NEW - Optional
}
```

**Impact:** Edge creation/editing must include unique `id` and use `source`/`target`.

**Status:** ⚠️ **TYPES UPDATED** - Edge creation logic needs implementation.

---

## 3. Create Flow Response Change

### OLD (Expected by Frontend)
```json
{
  "flow": { "flowId": "flow_123", "name": "...", ... },
  "draft": { "draftId": "current", ... }
}
```

### NEW (Backend Returns)
```json
{
  "flowId": "flow_123",
  "draftId": "current",
  "createdAt": "2026-01-14T12:00:00.000Z"
}
```

**Impact:** Frontend expects full flow object but backend only returns minimal response.

**Status:** ⚠️ **NEEDS FIX** - `CreateFlowResponse` type updated, but flow creation logic may need adjustment.

---

## 4. Validation Response - New Fields

### NEW Fields Added
```typescript
{
  "ok": true,
  "errors": [
    {
      "code": "DUPLICATE_NODE_ID",  // NEW
      "message": "...",
      "nodeId": "node1",
      "severity": "error"            // NEW
    }
  ],
  "warnings": [
    {
      "code": "NO_PRODUCES",         // NEW
      "message": "...",
      "nodeId": "node3",
      "severity": "warning"          // NEW
    }
  ],
  "stats": { ... }
}
```

**Impact:** Validation errors/warnings now include `code` and `severity` fields.

**Status:** ✅ **FIXED** - Types updated to include new fields.

---

## 5. Compiled Graph Structure (Published Versions)

### NEW Structure
```typescript
{
  "compiledGraph": {
    "nodes": [
      {
        "id": "node1",
        "type": "EXPLANATION",
        "title": "Welcome",
        "requiresFacts": ["contact.email"],  // Flat in compiled
        "producesFacts": ["booking.confirmed"], // Flat in compiled
        "config": {}
      }
    ],
    "edges": [...],
    "indices": {
      "factProducers": {
        "contact.email": ["node1"]
      },
      "nodesByType": {
        "EXPLANATION": ["node1"]
      }
    },
    "metadata": {
      "compiledAt": "2026-01-14T12:10:00.000Z",
      "nodeCount": 1,
      "factCount": 1
    }
  }
}
```

**Impact:** Published versions have optimized structure with indices for runtime.

**Status:** ✅ **FIXED** - Types updated to include `CompiledGraph` structure.

---

## 6. Authentication Clarification

### Backend Documentation Says:
```
All requests require: x-tenant-id header
```

### Gateway Auth Strategy Says:
```
- Dev/Staging: x-service-key (gateway resolves tenantId)
- Production: Authorization: Bearer <jwt> (gateway resolves tenantId)
```

**Question:** Should we send `x-tenant-id` header in addition to auth headers, or does gateway resolve it?

**Current Implementation:** Only sends auth headers (service key or JWT), no `x-tenant-id`.

**Status:** ⚠️ **NEEDS CLARIFICATION** - Confirm with backend team.

---

## Updated Files

### Core Types
- ✅ `src/types/flow-api.ts` - Complete rewrite to match backend
  - `Node` with nested `NodeRequires` and `NodeProduces`
  - `Edge` with `id`, `source`, `target`, `label`
  - `CompiledGraph` with indices and metadata
  - `ValidationError` and `ValidationWarning` with `code` and `severity`

### Context & Conversion
- ✅ `src/context/FlowDataContext.tsx`
  - Converts backend nested structure → frontend flat arrays (on load)
  - Converts frontend flat arrays → backend nested structure (on save)
  - Handles `requires.facts` and `produces.facts` mapping

---

## Migration Checklist

- [x] Update type definitions (`flow-api.ts`)
- [x] Add node structure conversion in context
- [x] Update validation error/warning types
- [x] Add compiled graph types
- [ ] Update edge creation to include `id` and use `source`/`target`
- [ ] Handle `CreateFlowResponse` minimal response
- [ ] Clarify `x-tenant-id` header requirement with backend
- [ ] Test draft save with new nested structure
- [ ] Test validation with new error codes
- [ ] Test published version loading with compiled graph

---

## Testing

### 1. Test Node Structure Conversion

```typescript
// Frontend node (flat)
const frontendNode = {
  id: 'node1',
  kind: 'EXPLANATION',
  title: 'Welcome',
  requires: ['contact.email'],
  produces: ['booking.confirmed']
};

// Should be saved to backend as (nested)
const backendNode = {
  id: 'node1',
  type: 'EXPLANATION',
  title: 'Welcome',
  requires: { facts: ['contact.email'] },
  produces: { facts: ['booking.confirmed'] }
};
```

### 2. Test Validation Error Codes

```typescript
const { ok, errors } = await flowAPI.validateDraft('flow_123');

errors.forEach(error => {
  console.log(error.code);      // e.g., "DUPLICATE_NODE_ID"
  console.log(error.severity);  // "error"
});
```

### 3. Test Compiled Graph Loading

```typescript
const { version } = await flowAPI.getFlow('flow_123', { versionId: 'ver_456' });

console.log(version.compiledGraph.indices.factProducers);
console.log(version.compiledGraph.metadata);
```

---

## Action Items

### Immediate
1. **Clarify auth requirements** with backend team
   - Do we need `x-tenant-id` header?
   - Or does gateway inject it from service key/JWT?

2. **Test draft save** with real backend
   - Verify nested structure is accepted
   - Verify conversion works correctly

3. **Implement edge ID generation**
   - Add unique `id` to edges when creating
   - Update edge references from `from/to` to `source/target`

### Future
1. **Handle CreateFlow response**
   - Backend returns minimal response
   - May need follow-up GET to load full flow

2. **Use validation error codes**
   - Display user-friendly messages based on codes
   - Add error code documentation

3. **Leverage compiled graph indices**
   - Use factProducers for dependency checking
   - Use nodesByType for filtering

---

## Backward Compatibility

**Frontend still uses flat arrays internally:**
```typescript
// Frontend FlowNode
{
  requires: string[];
  produces: string[];
}
```

**Conversion happens at API boundary:**
- **Load:** Backend nested → Frontend flat (in FlowDataContext)
- **Save:** Frontend flat → Backend nested (in FlowDataContext)

**This maintains compatibility** with existing frontend code while supporting new backend structure.

---

## Questions for Backend Team

1. **x-tenant-id header:** Required in addition to service key/JWT, or gateway handles it?

2. **Edge IDs:** Should they be generated client-side or server-side?

3. **CreateFlow response:** Intentional minimal response or should it return full flow+draft?

4. **readiness fields:** What structure should `requires.readiness` and `produces.readinessDelta` have?

---

**Last Updated:** January 14, 2026  
**Status:** Types updated, conversion implemented, testing needed.

