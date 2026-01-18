# Flow API Integration

This document describes how to integrate KxAxis with the Flow API for loading, saving, validating, and publishing conversation flows.

## Overview

The Flow API integration adds the following capabilities:
- **Load flows** from the backend
- **Autosave drafts** with debounce
- **Validate flows** with detailed error reporting
- **Publish versions** as immutable snapshots
- **View version history** and load published versions (read-only)

## Quick Start

### 1. Enable API Integration

Pass `enableApiIntegration={true}` and a `flowId` to `KxAxisComposer`:

```tsx
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';

function App() {
  return (
    <KxAxisComposer
      initialConfig={initialFlow}
      goalLensRegistry={registry}
      flowId="flow-123"
      enableApiIntegration={true}
      autosaveEnabled={true}
      autosaveDelay={1000}
    />
  );
}
```

### 2. Configure Backend URL

Set the backend base URL in your environment:

```bash
VITE_API_BASE_URL=http://localhost:3001/api
```

### 3. Set Tenant ID

The API client uses a tenant ID from localStorage or a placeholder:

```typescript
localStorage.setItem('kx-tenant-id', 'your-tenant-id');
```

## Features

### Autosave

Drafts are automatically saved 1 second (configurable) after changes stop:

```tsx
<KxAxisComposer
  autosaveEnabled={true}
  autosaveDelay={1000} // ms
  {...props}
/>
```

**Save indicators:**
- "Pending…" - Change detected, waiting to save
- "Saving…" - Save in progress
- "Saved" - Successfully saved (shows timestamp on hover)
- "Save failed" - Error occurred (shows error on hover)

### Validation

Click **Validate** to check the flow for errors:

- Displays validation results in a right-side panel
- Shows errors (red), warnings (yellow), and info (blue)
- Click an issue to jump to the relevant node
- Publish button is disabled if there are validation errors

### Publishing

Click **Publish** to create an immutable version:

1. Opens a dialog to add an optional publish note
2. Validates the flow before publishing
3. Creates a new version with a version number
4. Shows success notification

**Published versions:**
- Are immutable (cannot be edited)
- Include the entire compiled graph
- Include a source draft hash for integrity
- Include optional publish notes

### Version History

Click **Versions** to view all published versions:

- Lists all versions with timestamps and notes
- Shows node count for each version
- Click a version to load it (read-only mode)
- "Back to Draft" button returns to editing mode

**Read-only mode:**
- Yellow banner indicates read-only mode
- Edit controls are disabled
- Canvas shows published version
- "Back to Draft" button restores editing

## API Endpoints

The integration uses the following endpoints:

### Flows
- `POST /flows` - Create a new flow
- `GET /flows/{flowId}` - Get flow + current draft
- `PATCH /flows/{flowId}` - Update flow metadata

### Drafts
- `PUT /flows/{flowId}/draft` - Replace entire draft

### Validation & Publishing
- `POST /flows/{flowId}/validate` - Validate current draft
- `POST /flows/{flowId}/publish` - Publish draft as new version

### Versions
- `GET /flows/{flowId}/versions` - List all versions
- `GET /flows/{flowId}/versions/{versionId}` - Get specific version

## Headers

All requests include:
- `Content-Type: application/json`
- `x-tenant-id: <tenant-id>`

## Error Handling

The integration handles common errors:

### 401/403 - Unauthorized
- Check tenant ID in localStorage
- Verify backend authentication

### 404 - Not Found
- Flow or version doesn't exist
- Check flowId parameter

### 409 - Conflict
- Draft conflict (another user edited)
- UI shows "Reload Draft" button

### 500 - Server Error
- Backend error
- Error message displayed in UI

## Advanced Usage

### Using Hooks Directly

For custom UI, use the hooks directly:

```tsx
import {
  useFlowData,
  useDraftSave,
  useValidate,
  usePublish,
  useVersions,
} from '@toldyaonce/kx-axis-fe';

function MyEditor({ flowId }) {
  const { flow, draft, isLoading, error, refetch } = useFlowData(flowId);
  const { saveDraft, saveStatus } = useDraftSave({ flowId });
  const { validate, report, isValidating } = useValidate(flowId);
  const { publish, isPublishing } = usePublish(flowId);
  const { versions, loadVersion } = useVersions(flowId);

  // ... your custom UI
}
```

### Using Flow API Client

For direct API access:

```typescript
import { flowAPI } from '@toldyaonce/kx-axis-fe';

// Get flow
const { flow, draft } = await flowAPI.getFlow('flow-123');

// Save draft
await flowAPI.putDraft('flow-123', {
  draftGraph: { nodes: [...] },
  uiLayout: { nodePositions: {...} },
});

// Validate
const { report } = await flowAPI.validateFlow('flow-123');

// Publish
const { version } = await flowAPI.publishFlow('flow-123', {
  publishNote: 'Initial release',
});

// List versions
const { versions } = await flowAPI.listVersions('flow-123');

// Get version
const { version } = await flowAPI.getVersion('flow-123', 'v-456');
```

### Using FlowDataProvider Directly

For custom integration:

```tsx
import { FlowDataProvider, useFlowDataContext } from '@toldyaonce/kx-axis-fe';

function App() {
  return (
    <FlowDataProvider flowId="flow-123" autosaveEnabled={true}>
      <YourCustomUI />
    </FlowDataProvider>
  );
}

function YourCustomUI() {
  const {
    flowId,
    isLoading,
    saveStatus,
    validationReport,
    validateFlow,
    publishFlow,
    versions,
    isReadOnly,
  } = useFlowDataContext();

  // ... your UI
}
```

## Type Definitions

### Draft Graph

```typescript
interface DraftGraph {
  nodes: FlowNode[];
  edges?: { from: string; to: string }[];
}
```

### UI Layout

```typescript
interface UiLayout {
  nodePositions: Record<string, { x: number; y: number }>;
  laneByNodeId: Record<string, string>;
  canvasZoom?: number;
  canvasScroll?: { x: number; y: number };
}
```

### Validation Report

```typescript
interface ValidationReport {
  isValid: boolean;
  issues: ValidationIssue[];
  validatedAt: string;
  draftHash: string;
}

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  nodeId?: string;
  field?: string;
  code?: string;
}
```

### Flow Version

```typescript
interface FlowVersion {
  versionId: string;
  compiledGraph: DraftGraph;
  sourceDraftHash: string;
  flowSignature: string;
  createdAt: string;
  publishNote?: string;
  versionNumber?: number;
}
```

## Best Practices

### 1. Enable Autosave
Always enable autosave to prevent data loss:
```tsx
<KxAxisComposer autosaveEnabled={true} />
```

### 2. Validate Before Publishing
The UI enforces this, but you should also validate on the backend.

### 3. Use Publish Notes
Add meaningful notes to track what changed:
```typescript
await publishFlow('Added goal gap tracker for fitness goals');
```

### 4. Handle Errors Gracefully
The UI displays errors, but you can add custom handling:
```tsx
<FlowDataProvider
  flowId={flowId}
  onSaveSuccess={() => console.log('Saved!')}
  onValidationComplete={(report) => console.log(report)}
  onPublishSuccess={(version) => console.log(version)}
/>
```

### 5. Use Version History
Keep users informed about version history and allow rollback to previous versions if needed.

## Troubleshooting

### Autosave Not Working
- Check `autosaveEnabled` is `true`
- Check browser console for errors
- Verify backend is reachable

### Validation Errors Not Showing
- Check validation report in DevTools
- Ensure ValidationPanel is not being closed immediately
- Verify backend validation logic

### Publish Button Disabled
- Run validation first
- Fix any validation errors
- Ensure flow is not in read-only mode

### Can't Edit After Loading Version
- Check for read-only banner
- Click "Back to Draft" to return to editing mode

## Support

For issues or questions:
- Check backend API logs
- Verify network requests in DevTools
- Review this documentation
- Check the codebase comments in `src/api/flowClient.ts` and `src/hooks/`



