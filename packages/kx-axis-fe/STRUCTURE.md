# Package Structure

```
packages/kx-axis-fe/
├── src/
│   ├── types/
│   │   └── index.ts                 # All TypeScript type definitions
│   │
│   ├── context/
│   │   └── FlowContext.tsx          # React context for flow state management
│   │
│   ├── components/
│   │   ├── KxAxisComposer.tsx       # Main exported component
│   │   │
│   │   ├── TopBar.tsx               # Top bar with actions
│   │   │
│   │   ├── Canvas/
│   │   │   ├── Canvas.tsx           # Main canvas area
│   │   │   └── NodeCard.tsx         # Individual node visualization
│   │   │
│   │   ├── Inspector/
│   │   │   ├── Inspector.tsx        # Context-sensitive panel router
│   │   │   ├── NodeInspector.tsx    # Node configuration UI
│   │   │   ├── CaptureInspector.tsx # Capture configuration UI
│   │   │   └── OverviewInspector.tsx# Flow overview UI
│   │   │
│   │   ├── Simulate/
│   │   │   └── SimulatePanel.tsx    # Simulation drawer
│   │   │
│   │   └── Captures/
│   │       └── CapturesList.tsx     # Available & Active captures
│   │
│   ├── demo/
│   │   ├── main.tsx                 # Demo entry point
│   │   ├── DemoApp.tsx              # Demo application
│   │   └── sampleData.ts            # Sample fitness flow & registry
│   │
│   └── index.ts                     # Public API exports
│
├── index.html                       # Demo HTML entry
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── README.md
├── USAGE.md
├── LICENSE
├── .gitignore
└── .npmignore
```

## Key Files

### Public API (`src/index.ts`)
- Exports `KxAxisComposer` component
- Exports all TypeScript types
- Exports context hooks for advanced usage

### Main Component (`src/components/KxAxisComposer.tsx`)
- Root component that composes all parts
- Manages theme and layout
- Wraps everything in FlowProvider

### State Management (`src/context/FlowContext.tsx`)
- Central state for flow configuration
- CRUD operations for nodes and captures
- Selection state management
- onChange notification

### Types (`src/types/index.ts`)
- Complete type definitions
- No backend assumptions
- Frontend-only data model

### Canvas (`src/components/Canvas/`)
- Visual representation of nodes
- Gated path and freeform pool
- NodeCard for minimal node display

### Inspector (`src/components/Inspector/`)
- Context-sensitive configuration panel
- Three modes: Node, Capture, Overview
- All detailed editing happens here

### Captures (`src/components/Captures/CapturesList.tsx`)
- Two-list UI: Available and Active
- Add/remove captures
- Click to configure in Inspector

### Simulate (`src/components/Simulate/SimulatePanel.tsx`)
- Drawer panel for simulation
- Mock eligibility checking
- Example message generation

### Demo (`src/demo/`)
- Complete working example
- Fitness industry sample data
- Shows all features in action

## Design Principles

1. **No inline configuration** - All editing in Inspector
2. **Minimal visual noise** - Flat design, lots of whitespace
3. **Context-sensitive** - Inspector adapts to selection
4. **No backend dependencies** - Pure frontend
5. **Embeddable** - Designed as a library component
6. **Type-safe** - Full TypeScript coverage
7. **MUI v5 only** - No heavy dependencies

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start demo dev server
npm run build        # Build library
npm run type-check   # TypeScript validation
```

## Integration

```tsx
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';
import type { ConversationFlow, IndustryCaptureRegistry } from '@toldyaonce/kx-axis-fe';

<KxAxisComposer
  initialConfig={myFlow}
  industryCaptureRegistry={myRegistry}
  onChange={handleChange}
/>
```

See `USAGE.md` for complete integration examples.


