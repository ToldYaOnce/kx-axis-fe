# Flow API Implementation Summary

## What Was Built

This implementation adds complete backend API integration to KxAxis for managing conversation flows. The integration includes:

### 1. **API Client Layer** (`src/api/flowClient.ts`)
- Typed client for all Flow API endpoints
- Centralized base URL and tenant header injection
- Normalized error handling
- RESTful endpoints:
  - `POST /flows` - Create flow
  - `GET /flows/{flowId}` - Get flow + draft
  - `PATCH /flows/{flowId}` - Update metadata
  - `PUT /flows/{flowId}/draft` - Save draft
  - `POST /flows/{flowId}/validate` - Validate draft
  - `POST /flows/{flowId}/publish` - Publish version
  - `GET /flows/{flowId}/versions` - List versions
  - `GET /flows/{flowId}/versions/{versionId}` - Get version

### 2. **Type System** (`src/types/flow-api.ts`)
Complete TypeScript types for:
- **Draft** - working copy with graph + UI layout
- **Flow** - entity metadata (name, description, IDs)
- **FlowVersion** - immutable published snapshot
- **ValidationReport** - issues with severity levels
- **Request/Response** types for all endpoints
- **FlowApiError** - normalized error structure

### 3. **React Hooks** (Pure, no context dependencies)
- **`useFlowData(flowId)`** - Load flow + draft with loading/error states
- **`useDraftSave({ flowId, autosaveDelay })`** - Save with debounce, optimistic UI, queue
- **`useValidate(flowId)`** - Validate with caching
- **`usePublish(flowId)`** - Publish with validation
- **`useVersions(flowId)`** - List/load versions

### 4. **Context Provider** (`src/context/FlowDataContext.tsx`)
High-level state management:
- Wraps hooks for integrated state
- Autosave trigger on flow changes (debounced)
- Read-only mode detection (when viewing versions)
- Lifecycle callbacks (onFlowLoaded, onSaveSuccess, etc.)
- Exposes unified API for UI components

### 5. **UI Components**
- **`SaveIndicator`** - Shows save status (pending/saving/saved/error) with tooltips
- **`ValidationPanel`** - Right-side panel with error list, click to jump to node
- **`VersionsModal`** - List versions, load read-only snapshots
- **Updated TopBar** - Wired Validate/Publish/Versions buttons, read-only banner

### 6. **Integration** (`src/components/KxAxisComposer.tsx`)
- New props: `flowId`, `enableApiIntegration`, `autosaveEnabled`, `autosaveDelay`
- Conditionally wraps `FlowProvider` with `FlowDataProvider`
- Backward compatible (works with or without API)

## Key Features

### Autosave
- **Debounced**: waits `autosaveDelay` ms after last change
- **Non-overlapping**: queues saves if one is in progress
- **Status indicators**: pending → saving → saved/error
- **Optimistic UI**: immediate local updates, async persistence

### Validation
- **On-demand**: manual trigger via Validate button
- **Error display**: right-side panel with severity badges
- **Node navigation**: click issue to jump to node
- **Publish gate**: can't publish if validation fails

### Publishing
- **Immutable versions**: published versions never change
- **Validation enforced**: must pass validation first
- **Publish notes**: optional description of changes
- **Version numbering**: auto-incremented

### Version History
- **List all versions**: timestamp, note, node count
- **Load read-only**: view published versions
- **Back to draft**: single-click return to editing

## Architecture Decisions

### 1. No React Query
- Repo doesn't have React Query
- Implemented minimal hook-based caching instead
- Hooks are pure (no context dependencies)
- Can migrate to React Query later if needed

### 2. Replace Entire Draft (PUT)
- No granular patching (PATCH)
- Simpler conflict resolution
- Easier to reason about
- Backend can implement optimistic concurrency (via etag/version)

### 3. Tenant Header
- All requests include `x-tenant-id`
- Fetched from localStorage or uses placeholder
- Centralized in `flowClient.ts`

### 4. Error Normalization
- All API errors transformed to `FlowApiError`
- Consistent `{ status, code, message, details }` shape
- HTTP status preserved for special handling (401, 404, 409)

### 5. Hooks First, Context Second
- Hooks are reusable without context
- Context orchestrates hooks for convenience
- Advanced users can use hooks directly

### 6. Backward Compatible
- `enableApiIntegration` flag preserves existing behavior
- Can use KxAxisComposer without backend
- Opt-in, not breaking

## File Structure

```
src/
├── api/
│   ├── flowClient.ts          # API client (follows simulatorClient pattern)
│   └── simulatorClient.ts      # Existing
├── types/
│   ├── flow-api.ts             # NEW: Flow API types
│   ├── index.ts                # Core types (updated exports)
│   └── simulator.ts            # Existing
├── hooks/
│   ├── useFlowData.ts          # NEW: Load flow
│   ├── useDraftSave.ts         # NEW: Save with debounce
│   ├── useValidate.ts          # NEW: Validation
│   ├── usePublish.ts           # NEW: Publishing
│   └── useVersions.ts          # NEW: Version history
├── context/
│   ├── FlowContext.tsx         # Existing (unchanged)
│   ├── FlowDataContext.tsx     # NEW: API orchestration
│   └── SimulatorContext.tsx    # Existing
├── components/
│   ├── Flow/
│   │   ├── SaveIndicator.tsx   # NEW: Save status UI
│   │   ├── ValidationPanel.tsx # NEW: Validation results
│   │   └── VersionsModal.tsx   # NEW: Version history
│   ├── TopBar.tsx              # UPDATED: Wired API actions
│   └── KxAxisComposer.tsx      # UPDATED: API integration
└── index.ts                     # UPDATED: New exports
```

## Usage Examples

### Basic (with API)

```tsx
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';

<KxAxisComposer
  initialConfig={initialFlow}
  goalLensRegistry={registry}
  flowId="flow-123"
  enableApiIntegration={true}
/>
```

### Advanced (custom hooks)

```tsx
import { useFlowData, useDraftSave } from '@toldyaonce/kx-axis-fe';

function MyEditor({ flowId }) {
  const { flow, draft, isLoading } = useFlowData(flowId);
  const { saveDraft, saveStatus } = useDraftSave({ flowId });

  const handleChange = (newGraph) => {
    saveDraft(newGraph, uiLayout);
  };

  return <div>...</div>;
}
```

### Without API (existing behavior)

```tsx
<KxAxisComposer
  initialConfig={initialFlow}
  goalLensRegistry={registry}
  onChange={(flow) => console.log(flow)}
/>
```

## Testing Checklist

- [ ] Load flow from API on mount
- [ ] Autosave triggers after delay
- [ ] Multiple rapid changes only trigger one save (debounce)
- [ ] Save status indicator updates correctly
- [ ] Validate button shows validation panel
- [ ] Validation errors prevent publishing
- [ ] Publish creates new version
- [ ] Versions modal lists all versions
- [ ] Loading version switches to read-only mode
- [ ] "Back to Draft" returns to editing
- [ ] Error handling (401, 404, 409, 500)

## Backend Requirements

The backend must implement:

1. **Flow CRUD**: Create, Read, Update flows
2. **Draft Storage**: PUT replaces entire draft
3. **Validation**: Returns `ValidationReport` with issues
4. **Publishing**: Creates immutable `FlowVersion`
5. **Version History**: List and retrieve versions
6. **Tenant Isolation**: Use `x-tenant-id` header
7. **Error Responses**: Return `{ code, message, details }`

## Next Steps

### Immediate
- [ ] Implement backend API endpoints
- [ ] Test with real backend
- [ ] Add conflict resolution UI (409 errors)
- [ ] Add loading skeletons

### Future Enhancements
- [ ] Migrate to React Query for better caching
- [ ] Add optimistic concurrency control (etags)
- [ ] Add version diff viewer
- [ ] Add version rollback
- [ ] Add collaborative editing (WebSockets)
- [ ] Add draft history / undo
- [ ] Add draft comments / annotations

## Migration Notes

For existing KxAxis users:

1. **No breaking changes** - API integration is opt-in
2. **Backward compatible** - existing code works as-is
3. **New props** - `flowId`, `enableApiIntegration` are optional
4. **New exports** - hooks and types are available for advanced usage
5. **Environment variable** - `VITE_API_BASE_URL` for backend URL

## Performance Considerations

- **Debounce saves**: prevents excessive API calls
- **Optimistic UI**: immediate local updates
- **Cached validation**: reports cached until re-validated
- **Lazy version loading**: versions loaded on demand
- **No polling**: event-driven (future: WebSockets)

## Security Considerations

- **Tenant isolation**: all requests include tenant ID
- **Auth headers**: extensible header injection
- **HTTPS**: use HTTPS in production
- **CORS**: backend must allow frontend origin
- **XSS**: React escapes by default
- **CSRF**: use token-based auth (JWT/Bearer)

---

**Implementation Complete!** ✅

All TODOs completed. Ready for backend integration and testing.



