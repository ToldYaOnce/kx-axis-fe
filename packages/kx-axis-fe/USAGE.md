# KxAxis Composer Usage Guide

## Quick Start

### 1. Install dependencies

```bash
cd packages/kx-axis-fe
npm install
```

### 2. Run the demo

```bash
npm run dev
```

This will start a local dev server with the demo app showing a sample Fitness onboarding flow.

## Integration

### Basic Usage

```tsx
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';
import type { ConversationFlow, IndustryCaptureRegistry } from '@toldyaonce/kx-axis-fe';

const myFlow: ConversationFlow = {
  id: 'my-flow',
  name: 'My Flow',
  description: 'Description',
  nodes: [],
  capturing: [],
};

const registry: IndustryCaptureRegistry = {
  industry: 'MyIndustry',
  captures: [
    {
      id: 'capture-1',
      name: 'Capture Name',
      description: 'What this captures',
      dataType: 'string',
    },
  ],
};

function App() {
  const handleChange = (updatedFlow: ConversationFlow) => {
    // Save the updated flow
    console.log('Flow changed:', updatedFlow);
  };

  return (
    <KxAxisComposer
      initialConfig={myFlow}
      industryCaptureRegistry={registry}
      onChange={handleChange}
    />
  );
}
```

### With All Callbacks

```tsx
<KxAxisComposer
  initialConfig={myFlow}
  industryCaptureRegistry={registry}
  onChange={(flow) => {
    // Called whenever the flow is modified
    saveToBackend(flow);
  }}
  onValidate={() => {
    // Called when user clicks Validate
    console.log('Validating...');
  }}
  onSimulate={() => {
    // Called when user clicks Simulate
    console.log('Opening simulation...');
  }}
  onPublish={(flow) => {
    // Called when user clicks Publish
    publishToProduction(flow);
  }}
/>
```

## Data Model

### ConversationFlow

```typescript
interface ConversationFlow {
  id: string;
  name: string;
  description?: string;
  nodes: FlowNode[];
  capturing: ActiveCapture[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    version?: string;
  };
}
```

### FlowNode

```typescript
type NodeKind = 
  | 'DATA_CAPTURE'
  | 'ACTION_BOOKING'
  | 'EXPLANATION'
  | 'REFLECTIVE_QUESTION'
  | 'HANDOFF';

interface FlowNode {
  id: string;
  kind: NodeKind;
  title: string;
  purpose?: string;
  requires?: string[]; // Prerequisite node IDs
  satisfies?: string[]; // Capture IDs this node satisfies
  ui?: {
    x: number;
    y: number;
    group: 'gated' | 'freeform';
  };
  eligibility?: {
    channels?: string[];
    leadStates?: string[];
    requiresContact?: boolean;
  };
  priority?: {
    baseRank?: number;
    capRank?: number;
  };
  execution?: {
    speechAct?: string;
    allowPrefix?: boolean;
  };
}
```

### Captures

```typescript
interface CaptureDefinition {
  id: string;
  name: string;
  description?: string;
  dataType?: 'string' | 'number' | 'date' | 'boolean';
  industry?: string;
}

interface ActiveCapture {
  captureId: string;
  required: boolean;
  confidenceThreshold?: number; // 0-1
  usageLabel?: string;
}

interface IndustryCaptureRegistry {
  industry: string;
  captures: CaptureDefinition[];
}
```

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ Top Bar (Title, Simulate, Validate, Publish)           │
├──────────────┬─────────────────────────┬────────────────┤
│              │                         │                │
│  Available   │      Canvas Area        │   Inspector    │
│  Captures    │   (Nodes visualization) │     Panel      │
│              │                         │                │
│  Capturing   │                         │  (Context-     │
│  (Active)    │                         │   sensitive)   │
│              │                         │                │
└──────────────┴─────────────────────────┴────────────────┘
```

## Features

### Canvas
- Visual representation of flow nodes
- Two areas: Gated Path and Freeform Pool
- Minimal card design
- Click to select and configure in Inspector

### Inspector
- Context-sensitive right panel
- Shows node details, capture config, or flow overview
- All configuration happens here (not inline)

### Captures
- Left panel with two lists:
  - Available Captures (from registry)
  - Capturing (active in this flow)
- Click to add captures
- Click active capture to configure in Inspector

### Simulate
- Lightweight simulation panel
- Set scenario parameters
- See which nodes would be eligible
- View example message output

## Tips

1. **Start with captures**: Define your capture registry first
2. **Build nodes on canvas**: Add nodes and position them
3. **Configure in inspector**: Click nodes to configure details
4. **Link captures to nodes**: Use the "satisfies" field
5. **Simulate**: Test your flow with different scenarios
6. **Publish**: Export when ready

## Advanced

### Custom Theme

The composer uses MUI v5 internally. You can wrap it in your own ThemeProvider:

```tsx
import { ThemeProvider, createTheme } from '@mui/material';

const myTheme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
  },
});

<ThemeProvider theme={myTheme}>
  <KxAxisComposer {...props} />
</ThemeProvider>
```

### Using Context Directly

For advanced integrations:

```tsx
import { FlowProvider, useFlow } from '@toldyaonce/kx-axis-fe';

function CustomComponent() {
  const { flow, updateNode, addCapture } = useFlow();
  
  // Direct access to flow state and mutations
  return <div>Custom UI</div>;
}

<FlowProvider initialFlow={myFlow} registry={registry}>
  <CustomComponent />
</FlowProvider>
```


