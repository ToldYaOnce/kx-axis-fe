# Flow API Integration - Quick Start

## 🎯 What You Got

Your KxAxis frontend now has **full backend API integration** for:
- ✅ Loading flows from the backend
- ✅ Autosaving drafts (debounced)
- ✅ Validating flows with error display
- ✅ Publishing immutable versions
- ✅ Viewing version history

## 🚀 Quick Start

### 1. Enable API Integration

```tsx
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';

function App() {
  return (
    <KxAxisComposer
      initialConfig={fallbackFlow}  // Used if API fails
      goalLensRegistry={registry}
      
      // NEW: API Integration
      flowId="flow-123"
      enableApiIntegration={true}
      autosaveEnabled={true}
      autosaveDelay={1000}
    />
  );
}
```

### 2. Set Environment Variable

```bash
# .env or .env.local
VITE_API_BASE_URL=http://localhost:3001/api
```

### 3. Set Tenant ID (Optional)

```typescript
// In your app initialization
localStorage.setItem('kx-tenant-id', 'your-tenant-id');
```

That's it! The UI will now:
- Load the flow on mount
- Autosave changes after 1 second
- Show "Saving…" / "Saved" indicator
- Enable Validate/Publish/Versions buttons

## 📁 New Files Created

```
src/
├── api/
│   └── flowClient.ts              # API client with typed endpoints
├── types/
│   └── flow-api.ts                # Complete type definitions
├── hooks/
│   ├── useFlowData.ts             # Load flow + draft
│   ├── useDraftSave.ts            # Save with debounce
│   ├── useValidate.ts             # Validation
│   ├── usePublish.ts              # Publishing
│   └── useVersions.ts             # Version history
├── context/
│   └── FlowDataContext.tsx        # Orchestrates hooks
└── components/
    └── Flow/
        ├── SaveIndicator.tsx      # Save status UI
        ├── ValidationPanel.tsx    # Error display
        └── VersionsModal.tsx      # Version history UI
```

## 🎨 UI Changes

### TopBar
- **Save Indicator** - Shows "Saving…", "Saved", "Save failed"
- **Validate Button** - Opens validation panel with errors/warnings
- **Versions Button** - Shows version history modal
- **Publish Button** - Opens publish dialog, disabled if validation fails

### ValidationPanel (Right Side)
- Lists all validation issues (errors, warnings, info)
- Click an issue to jump to the node
- Red/yellow/blue badges for severity
- Prevents publishing if errors exist

### VersionsModal
- Lists all published versions
- Shows timestamp, notes, node count
- Click to load read-only version
- "Back to Draft" button to return to editing

### Read-Only Mode
- Yellow banner when viewing a published version
- All edit controls disabled
- "Back to Draft" button prominent

## 🔌 API Endpoints Expected

Your backend must implement:

```
POST   /flows                          # Create flow
GET    /flows/{flowId}                 # Get flow + draft
PATCH  /flows/{flowId}                 # Update metadata
PUT    /flows/{flowId}/draft           # Save draft
POST   /flows/{flowId}/validate        # Validate
POST   /flows/{flowId}/publish         # Publish
GET    /flows/{flowId}/versions        # List versions
GET    /flows/{flowId}/versions/{id}   # Get version
```

**All requests include:**
- `Content-Type: application/json`
- `x-tenant-id: <tenant-id>`

## 📄 API Contracts

### GET /flows/{flowId}

**Response:**
```json
{
  "flow": {
    "flowId": "flow-123",
    "name": "Fitness Onboarding",
    "description": "...",
    "currentDraftId": "draft-456",
    "latestPublishedVersionId": "v-789",
    "createdAt": "2026-01-13T10:00:00Z",
    "updatedAt": "2026-01-13T10:30:00Z"
  },
  "draft": {
    "draftId": "draft-456",
    "draftGraph": {
      "nodes": [...]
    },
    "uiLayout": {
      "nodePositions": {...},
      "laneByNodeId": {...}
    },
    "updatedAt": "2026-01-13T10:30:00Z"
  }
}
```

### PUT /flows/{flowId}/draft

**Request:**
```json
{
  "draftGraph": {
    "nodes": [...]
  },
  "uiLayout": {
    "nodePositions": {...},
    "laneByNodeId": {...}
  }
}
```

**Response:**
```json
{
  "draft": {
    "draftId": "draft-456",
    "draftGraph": {...},
    "uiLayout": {...},
    "updatedAt": "2026-01-13T10:31:00Z"
  }
}
```

### POST /flows/{flowId}/validate

**Response:**
```json
{
  "report": {
    "isValid": false,
    "issues": [
      {
        "severity": "error",
        "message": "Node 'Contact Capture' has no prerequisites",
        "nodeId": "node-1",
        "field": "requires",
        "code": "MISSING_PREREQUISITES"
      }
    ],
    "validatedAt": "2026-01-13T10:31:00Z",
    "draftHash": "abc123"
  }
}
```

### POST /flows/{flowId}/publish

**Request:**
```json
{
  "publishNote": "Added goal gap tracker"
}
```

**Response:**
```json
{
  "version": {
    "versionId": "v-789",
    "compiledGraph": {...},
    "sourceDraftHash": "abc123",
    "flowSignature": "sig-xyz",
    "createdAt": "2026-01-13T10:32:00Z",
    "publishNote": "Added goal gap tracker",
    "versionNumber": 1
  },
  "report": {
    "isValid": true,
    "issues": [],
    "validatedAt": "2026-01-13T10:32:00Z",
    "draftHash": "abc123"
  }
}
```

## 🎯 Use Cases

### 1. Load Existing Flow
```tsx
<KxAxisComposer
  flowId="flow-123"
  enableApiIntegration={true}
  // ... other props
/>
```

Flow loads automatically on mount. If API fails, uses `initialConfig`.

### 2. Validate Before Publishing
User clicks **Validate** → ValidationPanel opens → Fix errors → Click **Publish**

### 3. View Version History
User clicks **Versions** → Modal opens → Click version → Read-only mode → "Back to Draft"

### 4. Custom Hooks (Advanced)
```tsx
import { useFlowData, useValidate } from '@toldyaonce/kx-axis-fe';

function MyCustomEditor({ flowId }) {
  const { flow, draft, isLoading } = useFlowData(flowId);
  const { validate, report } = useValidate(flowId);

  return (
    <div>
      {isLoading ? 'Loading...' : flow.name}
      <button onClick={validate}>Validate</button>
      {report && <ValidationDisplay report={report} />}
    </div>
  );
}
```

## 🔍 Debugging

### Check Network Requests
Open DevTools → Network → Filter by "flows" → Inspect requests/responses

### Enable Console Logs
The hooks log errors. Check browser console for:
- API errors (red)
- Autosave triggers
- Validation results

### Test Autosave
1. Make a change (add/edit node)
2. Wait 1 second
3. Check Network tab for `PUT /flows/{flowId}/draft`
4. Watch save indicator: "Pending…" → "Saving…" → "Saved"

### Test Validation
1. Click **Validate**
2. Check Network tab for `POST /flows/{flowId}/validate`
3. ValidationPanel should open
4. Click an issue to jump to node

## 📚 Documentation

- **Full API Docs:** `FLOW_API_INTEGRATION.md`
- **Implementation Details:** `FLOW_API_IMPLEMENTATION.md`
- **Types Reference:** `src/types/flow-api.ts`

## 🐛 Common Issues

### "Failed to fetch"
- Check `VITE_API_BASE_URL` is set
- Check backend is running
- Check CORS is enabled on backend

### "401 Unauthorized"
- Set `localStorage.setItem('kx-tenant-id', 'your-tenant-id')`
- Check backend auth is configured

### "Autosave not working"
- Check `autosaveEnabled={true}`
- Check browser console for errors
- Check `onChange` callback is receiving updates

### "Validation panel not showing"
- Check backend returns `ValidationReport` structure
- Check browser console for errors
- Try hard refresh (Ctrl+Shift+R)

## 🎉 Next Steps

1. **Implement backend endpoints** (see `FLOW_API_INTEGRATION.md`)
2. **Test with real backend**
3. **Deploy and enjoy!**

---

**Questions?** Check `FLOW_API_IMPLEMENTATION.md` for detailed architecture and examples.



