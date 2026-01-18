# Create Flow Dialog - Updated

## Changes Made

### **Removed:**
- ❌ "Existing Flow ID" text input
- ❌ "Load Existing Flow" button
- ❌ "— OR —" divider
- ❌ `handleLoadExistingFlow()` function
- ❌ `flowIdInput` state variable

### **Added:**
- ✅ **Flow Name** text input (required, with validation)
- ✅ **Industry** dropdown selector (15 industries)
- ✅ Validation: "Create Flow" button disabled until name is entered
- ✅ Success toast: Shows name and industry after creation
- ✅ Helper text explaining that items will be tailored to industry
- ✅ Auto-focus on Flow Name field when dialog opens

---

## New Dialog Structure

```
┌─────────────────────────────────────────┐
│ Create New Conversation Flow            │
├─────────────────────────────────────────┤
│ Choose a name and industry for your new │
│ flow. Conversation items will be...     │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ Flow Name (required)                │ │
│ │ e.g., Fitness Onboarding...         │ │
│ └─────────────────────────────────────┘ │
│   Give your conversation flow a...      │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ Industry ▼                          │ │
│ └─────────────────────────────────────┘ │
│   Available conversation items will...  │
│                                          │
│             [Cancel]  [Create Flow]     │
└─────────────────────────────────────────┘
```

---

## User Flow

1. User clicks "Create New Flow" button
2. Dialog opens with:
   - Empty "Flow Name" field (focused)
   - "Industry" defaulted to "Other"
3. User enters a flow name (e.g., "Fitness Onboarding")
4. User selects industry (e.g., "Fitness & Wellness")
5. "Create Flow" button becomes enabled
6. User clicks "Create Flow"
7. API creates flow with name and description
8. Success toast appears: ✅ Created "Fitness Onboarding" (Fitness & Wellness)
9. Editor opens with empty canvas
10. Left palette shows general + fitness-specific items

---

## State Management

### **New State Variables:**
```typescript
const [newFlowName, setNewFlowName] = useState<string>('');
const [newFlowIndustry, setNewFlowIndustry] = useState<string>('Other');
```

### **Removed State Variables:**
```typescript
// ❌ Removed
const [flowIdInput, setFlowIdInput] = useState<string>('');
```

---

## API Integration

### **Create Flow Request:**
```typescript
await flowAPI.createFlow({
  name: newFlowName.trim(),
  primaryGoal: 'BOOKING',
  description: `A ${newFlowIndustry} conversation flow`,
  draftGraph: {
    nodes: [],
    edges: [],
    entryNodeIds: [],
    primaryGoal: { type: 'GATE', gate: 'BOOKING', description: 'Flow completion goal' },
    gateDefinitions: {},
    factAliases: {},
  },
  editorState: {
    uiLayout: {
      nodePositions: {},
      laneAssignments: {},
    },
  },
});
```

---

## Validation

- **Flow Name**: Must be non-empty (whitespace trimmed)
- **Industry**: Always has a value (defaults to "Other")
- **Create Button**: Disabled if name is empty or flow is being created

---

## Empty Flow Template

The `emptyFlow` is now dynamically generated using `React.useMemo` based on the selected name and industry:

```typescript
const emptyFlow = React.useMemo<ConversationFlow>(() => ({
  id: 'new-flow',
  name: newFlowName || 'New Conversation Flow',
  description: `A ${newFlowIndustry} conversation flow`,
  industry: newFlowIndustry,
  nodes: [],
  activeGoalLenses: [],
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
    tags: [],
  },
}), [newFlowName, newFlowIndustry]);
```

This ensures the industry is immediately available when the editor loads, allowing the palette to show the correct conversation items.

---

## Backend Considerations

**Note:** The backend Flow API may not yet persist the `industry` field in flow metadata. When this is added:

1. Include `industry` in the `CreateFlowRequest` or flow metadata
2. Return `industry` in the `GetFlowResponse`
3. Allow updating `industry` via `PATCH /agent/flows?flowId={flowId}`

For now, the industry is managed in the frontend state and will need to be re-selected if the flow is reloaded from the backend (until backend persistence is implemented).

---

## Files Modified

- `packages/kx-axis-fe/src/demo/DemoApp.tsx`
  - Added `newFlowName` and `newFlowIndustry` state
  - Removed `flowIdInput` state and `handleLoadExistingFlow` function
  - Updated dialog UI (removed "Existing Flow ID", added name + industry fields)
  - Updated `handleCreateNewFlow` to use new state and validate name
  - Made `emptyFlow` dynamic using `useMemo`
  - Added `MenuItem` import from MUI
  - Added `INDUSTRIES` import from utils

---

## Testing Checklist

- [ ] Open the Create Flow dialog
- [ ] Verify "Create Flow" button is disabled when name is empty
- [ ] Enter a flow name
- [ ] Verify "Create Flow" button becomes enabled
- [ ] Select different industries from dropdown
- [ ] Click "Create Flow"
- [ ] Verify success toast shows correct name and industry
- [ ] Verify editor opens with empty canvas
- [ ] Verify left palette shows general + industry-specific items
- [ ] Change industry in Overview panel (right sidebar)
- [ ] Verify palette updates with new industry items


