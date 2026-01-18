# Backend API Migration - Complete ✅

## What Changed

The Flow API integration has been **completely rewritten** to match your backend API exactly. All endpoints, request/response shapes, and data types now align with the backend specification.

## Key Changes

### 1. **Base URL Changed**
- **Old:** `/flows`
- **New:** `/agent/flows`

### 2. **Endpoints Updated**

| Method | Old Endpoint | New Endpoint |
|--------|-------------|--------------|
| POST | `/flows` | `/agent/flows` |
| GET | `/flows/{flowId}` | `/agent/flows/{flowId}?include=versions&versionId=xxx` |
| PATCH | `/flows/{flowId}` (metadata) | `/agent/flows/{flowId}` (metadata OR draft) |
| PUT | `/flows/{flowId}/draft` | **REMOVED** - use PATCH |
| POST | `/flows/{flowId}/validate` | **REMOVED** - use `PATCH?action=validate` |
| POST | `/flows/{flowId}/publish` | **REMOVED** - use `PATCH?action=publish` |
| GET | `/flows/{flowId}/versions` | **REMOVED** - use `GET?include=versions` |
| GET | `/flows/{flowId}/versions/{versionId}` | **REMOVED** - use `GET?versionId=xxx` |

### 3. **PATCH Endpoint is Overloaded**

The `PATCH /agent/flows/{flowId}` endpoint handles **3 different operations**:

```typescript
// 1. Update Metadata (if body has name/description/primaryGoal)
await flowAPI.patchFlowMetadata(flowId, { name: 'New Name' });

// 2. Replace Draft (if body has draftGraph)
await flowAPI.replaceDraft(flowId, { draftGraph, uiLayout });

// 3. Validate (if ?action=validate)
await flowAPI.validateDraft(flowId);

// 4. Publish (if ?action=publish)
await flowAPI.publishFlow(flowId, { publishNote, sourceDraftHash });
```

### 4. **Data Shape Changes**

#### Draft
```typescript
// OLD
{
  draftId: string;  // Generated ID
  draftGraph: { nodes, edges? },
  uiLayout: { nodePositions, laneByNodeId },
}

// NEW
{
  draftId: "current";  // Always "current"
  flowId: string;
  updatedAt: string;
  updatedBy?: string;
  sourceHash: string;  // SHA-256 for optimistic concurrency
  draftGraph: { nodes, edges },  // edges required
  uiLayout: { nodePositions, laneAssignments, lanes? },  // laneAssignments not laneByNodeId
}
```

#### Validation Report
```typescript
// OLD
{
  isValid: boolean;
  issues: [{ severity, message, nodeId?, field? }];
  validatedAt: string;
  draftHash: string;
}

// NEW
{
  ok: boolean;  // Not isValid!
  errors: [{ message, nodeId?, field?, code? }];
  warnings: [{ message, nodeId?, context? }];
  stats: { nodeCount, edgeCount, factCount, entryNodeCount };
}
```

#### Version
```typescript
// OLD
{
  versionId: string;
  compiledGraph: DraftGraph;
  sourceDraftHash: string;
  flowSignature: string;
  createdAt: string;
  publishNote?: string;
  versionNumber?: number;  // Frontend-only
}

// NEW (VersionSummary in list)
{
  versionId: string;
  createdAt: string;
  publishedBy?: string;
  publishNote?: string;
  flowSignature: string;
}

// NEW (FlowVersion when loaded)
{
  flowId: string;
  versionId: string;
  createdAt: string;
  publishedBy?: string;
  publishNote?: string;
  compiledGraph: DraftGraph;
  sourceDraftHash: string;
  flowSignature: string;
  validationReportSnapshot: ValidationReport;
}
```

### 5. **Node Type Mapping**

```typescript
// Frontend uses 'kind', backend uses 'type'
{
  id: string;
  kind: "EXPLANATION";  // Frontend
  type: "EXPLANATION";  // Backend
  title: string;
  requires?: string[];  // Fact names (must match /^[a-z0-9_.]+$/)
  produces?: string[];
  config?: Record<string, any>;
}
```

### 6. **Source Hash for Optimistic Concurrency**

```typescript
// Publishing REQUIRES sourceDraftHash
const { sourceHash } = await flowAPI.replaceDraft(flowId, { draftGraph, uiLayout });

// Later...
await flowAPI.publishFlow(flowId, {
  publishNote: 'Initial release',
  sourceDraftHash: sourceHash,  // Must match current draft!
});

// 409 Conflict if hash doesn't match
// => Show "Draft modified, reload and try again"
```

## Updated Files

### Core API Layer
- ✅ **`src/types/flow-api.ts`** - Complete rewrite to match backend types
- ✅ **`src/api/flowClient.ts`** - Complete rewrite to match backend endpoints

### Hooks
- ✅ **`src/hooks/useFlowData.ts`** - Updated for new response shape
- ✅ **`src/hooks/useDraftSave.ts`** - Tracks `sourceHash` from response
- ✅ **`src/hooks/useValidate.ts`** - Updated for new validation shape
- ✅ **`src/hooks/usePublish.ts`** - Requires `sourceDraftHash` parameter
- ✅ **`src/hooks/useVersions.ts`** - Uses query params instead of separate endpoints

### Context & UI
- ✅ **`src/context/FlowDataContext.tsx`** - Updated to track `sourceHash` and pass to publish
- ✅ **`src/components/TopBar.tsx`** - Updated validation handling, conflict detection
- ✅ **`src/components/Flow/ValidationPanel.tsx`** - Displays errors/warnings separately with stats
- ✅ **`src/components/Flow/VersionsModal.tsx`** - Uses `VersionSummary[]`

## How to Use

### 1. Set Environment Variable

```bash
VITE_API_BASE_URL=https://your-api-gateway.com
```

### 2. Set Tenant ID

```typescript
localStorage.setItem('kx-tenant-id', 'your-tenant-id');
```

### 3. Enable API Integration

```tsx
<KxAxisComposer
  initialConfig={fallbackFlow}
  goalLensRegistry={registry}
  flowId="flow_abc123"
  enableApiIntegration={true}
  autosaveEnabled={true}
/>
```

## API Client Usage

### Create Flow
```typescript
const { flow, draft } = await flowAPI.createFlow({
  name: 'Fitness Onboarding',
  primaryGoal: 'fitness_goal',
  description: 'Help users set fitness goals',
});
```

### Get Flow (with versions)
```typescript
const { flow, draft, versions } = await flowAPI.getFlow(flowId, {
  includeVersions: true,
});

console.log(draft.sourceHash);  // Save this for publishing!
```

### Update Metadata
```typescript
await flowAPI.patchFlowMetadata(flowId, {
  name: 'Updated Name',
  description: 'Updated description',
});
```

### Replace Draft
```typescript
const { sourceHash } = await flowAPI.replaceDraft(flowId, {
  draftGraph: {
    nodes: [
      { id: 'n1', type: 'EXPLANATION', title: 'Welcome', requires: [], produces: [] },
    ],
    edges: [],
  },
  uiLayout: {
    nodePositions: { n1: { x: 100, y: 100 } },
    laneAssignments: { n1: 'lane1' },
  },
  updatedBy: 'user@example.com',
});

// Save sourceHash for publishing!
```

### Validate
```typescript
const { ok, errors, warnings, stats } = await flowAPI.validateDraft(flowId);

if (!ok) {
  console.error('Validation errors:', errors);
}
```

### Publish
```typescript
const { versionId, flowSignature, validationReport } = await flowAPI.publishFlow(flowId, {
  publishNote: 'Added goal gap tracker',
  sourceDraftHash: currentSourceHash,  // REQUIRED!
});

console.log(`Published as ${versionId}`);
```

### Load Version
```typescript
const { flow, version } = await flowAPI.getFlow(flowId, {
  versionId: 'ver_xyz789',
});

console.log(version.compiledGraph);  // Read-only
```

## Error Handling

```typescript
try {
  await flowAPI.publishFlow(flowId, { publishNote, sourceDraftHash });
} catch (err) {
  const error = err as FlowApiError;
  
  if (error.status === 409) {
    // Draft modified - prompt user to reload
    alert('Draft has been modified. Reload and try again.');
  } else if (error.status === 400) {
    // Validation error
    alert(`Validation failed: ${error.message}`);
  } else if (error.status === 401 || error.status === 403) {
    // Auth error
    alert('Unauthorized. Check your tenant ID.');
  } else {
    // Generic error
    alert(`Error: ${error.message}`);
  }
}
```

## Fact Name Validation

```typescript
// Backend validates fact names: /^[a-z0-9_.]+$/
const validFacts = ['email', 'phone_number', 'booking.date'];
const invalidFacts = ['Email', 'phone-number', 'booking date'];

// UI should enforce this or show backend validation errors
```

## Testing Checklist

- [ ] Load flow on mount
- [ ] Autosave draft after changes (debounced)
- [ ] Save indicator shows correct status
- [ ] Validate button shows errors/warnings with stats
- [ ] Publish requires validation passing
- [ ] Publish handles 409 conflict gracefully
- [ ] Versions list loads correctly
- [ ] Loading version switches to read-only mode
- [ ] "Back to Draft" returns to editing
- [ ] Node click in validation panel jumps to node

## Migration Notes

### Breaking Changes
1. **sourceHash tracking** - Frontend must store and pass `sourceHash` to publish
2. **Validation shape** - Use `ok` instead of `isValid`, separate errors/warnings
3. **Version loading** - Use query param instead of separate endpoint
4. **Node field naming** - Frontend uses `kind`, backend uses `type`

### Non-Breaking
- UI presentation remains the same
- Component API unchanged (props, callbacks)
- Autosave behavior unchanged
- All backwards compatible with `enableApiIntegration={false}`

## Next Steps

1. **Test with Real Backend**
   - Set `VITE_API_BASE_URL` to your API gateway
   - Set `kx-tenant-id` in localStorage
   - Enable API integration
   - Test full flow: load → edit → validate → publish

2. **Handle Edge Cases**
   - 409 conflicts (show reload dialog)
   - 400 validation errors (show in panel)
   - Network failures (show retry)

3. **Add Features**
   - Version diff viewer
   - Draft history / undo
   - Collaborative editing indicators

---

**✅ Migration Complete!** The frontend now matches your backend API exactly.


