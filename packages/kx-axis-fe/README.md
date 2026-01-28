# KxAxis – Conversation Flow Designer 🎨

**A React + TypeScript UI library for designing, testing, and managing agentic conversation flows for AI platforms.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Architecture](#architecture)
- [Features](#features)
- [Routing](#routing)
- [API Integration](#api-integration)
- [Execution Mode (Simulator)](#execution-mode-simulator)
- [Theming & Design](#theming--design)
- [Development](#development)
- [Advanced Topics](#advanced-topics)
- [Mock Data & Fixtures](#mock-data--fixtures)
- [Contributing](#contributing)

---

## Overview

KxAxis is a **minimalistic, canvas-first** conversation flow designer built for AI agent platforms. It lets you visually design conversation flows without needing to think about workflow logic, prompts, or rule trees.

### Philosophy

- **System controls WHAT, LLM controls HOW** – Configuration defines structure, style layer handles phrasing
- **Edge-less, agentic flows** – Controller decides dynamically based on state, not hardcoded paths
- **Gate-driven completion** – Flows complete when gates (CONTACT, BOOKING) are satisfied
- **Visual clarity** – Eligibility and prerequisites visible at a glance

### Key Features

- 🎨 **Canvas-first** interaction for flow visualization
- 🔍 **Inspector-based configuration** (no inline rule soup)
- 🎯 **Industry-aware conversation items** (15 industries supported)
- 🚀 **Execution Mode** – Turn-by-turn simulator with branching
- 📦 **Embeddable** – Designed as a library component
- 🔌 **API Integration** – Load, autosave, validate, publish flows
- 🎭 **Routing support** – React Router integration for multi-page apps
- 🎨 **Themeable** – MUI v5 with built-in professional themes
- 📊 **Goal Lens System** – Adaptive baseline capture based on user goals

---

## Installation

```bash
npm install @toldyaonce/kx-axis-fe react-router-dom
```

**Peer Dependencies:**
- React 18+
- React Router Dom 6+ (optional, for routing features)
- MUI v5 (Material-UI)

---

## Quick Start

### Basic Usage (Standalone)

```tsx
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';
import type { ConversationFlow } from '@toldyaonce/kx-axis-fe';

const myFlow: ConversationFlow = {
  id: 'my-flow',
  name: 'My Custom Flow',
  description: 'A conversation flow for...',
  industry: 'Fitness & Wellness',
  nodes: [],
};

function App() {
  const handleChange = (updatedFlow: ConversationFlow) => {
    console.log('Flow updated:', updatedFlow);
  };

  return (
    <KxAxisComposer
      initialConfig={myFlow}
      onChange={handleChange}
    />
  );
}
```

### With Routing

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { KxAxisRoutes, kxgryndeTheme } from '@toldyaonce/kx-axis-fe';
import { ThemeProvider } from '@mui/material';

function App() {
  return (
    <ThemeProvider theme={kxgryndeTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/flows/*" element={<KxAxisRoutes basePath="/flows" />} />
          {/* Your other routes */}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
```

**This sets up:**
- `/flows` → Flows List
- `/flows/:flowId` → Flow Designer
- `/flows/:flowId/simulate` → Flow Simulator
- `/flows/:flowId/versions/:versionId` → Version Viewer

---

## Core Concepts

### 1. Conversation Flows

A **Conversation Flow** is a collection of conversation moments (nodes) with:
- **Nodes** – Building blocks (questions, actions, explanations)
- **Gates** – Hard prerequisites (CONTACT, BOOKING, HANDOFF)
- **Eligibility Lanes** – Visual grouping by prerequisite requirements

### 2. Nodes (Conversation Moments)

Nodes represent conversation moments, NOT fields:

| Node Type | Purpose | Example |
|-----------|---------|---------|
| **EXPLANATION** | Inform, educate, build trust | "Here's how our coaching works..." |
| **REFLECTIVE_QUESTION** | Emotional/psychological check | "What makes you confident you can achieve this?" |
| **GOAL_GAP_TRACKER** | Target → Baseline → Delta → Category | Adaptive goal tracking |
| **BASELINE_CAPTURE** | Capture current state metrics | User's current weight, fitness level |
| **ACTION_BOOKING** | Schedule consultation/appointment | Book a call, schedule a session |
| **HANDOFF** | Transfer to human agent | Connect with a human trainer |

### 3. Eligibility Lanes

Lanes visually show **WHEN** nodes can execute based on **HARD GATES**:

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ BEFORE CONTACT  │  CONTACT GATE   │ AFTER CONTACT   │ AFTER BOOKING   │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│                 │                 │                 │                 │
│ • Welcome       │ • Get Email     │ • Capture Stats │ • Send Promo    │
│ • Explain Value │   🔓 Unlocks    │   🔒 Requires   │   🔒 Requires   │
│ • Reflective Q  │     CONTACT     │      CONTACT    │      BOOKING    │
│                 │                 │                 │                 │
│                 │                 │ • Book Call     │ • Handoff       │
│                 │                 │   🔓 Unlocks    │                 │
│                 │                 │      BOOKING    │                 │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Key Takeaways:**
- Lanes = Eligibility, not sequence
- Gates = Hard prerequisites (CONTACT, BOOKING)
- No workflow arrows – controller decides execution order

### 4. Gate Semantics

**Gates are satisfied by facts, NOT by nodes declaring metrics.**

```json
{
  "gateDefinitions": {
    "CONTACT": {
      "satisfiedBy": {
        "metricsAny": ["contact_email", "contact_phone"]
      }
    },
    "BOOKING": {
      "satisfiedBy": {
        "metricsAll": ["booking_date", "booking_type"]
      }
    }
  }
}
```

Nodes declare intent (`satisfies.gates`), gate definitions are authoritative.

### 5. Goal Lens System

Goal Lenses enable **adaptive baseline capture** based on user goals:

**Problem:** Field-first design asks irrelevant questions  
**Solution:** Goal-first design adapts questions to user's stated goal

```typescript
// STRENGTH_PR Lens
{
  baselineMetrics: ['lift_type', 'current_lift_value', 'lift_context?'],
  targetMetrics: ['target_lift_value'],
  deadlinePolicy: 'EXACT_DATE'
}

// BODY_COMPOSITION Lens
{
  baselineMetrics: ['current_weight', 'current_bodyfat?'],
  targetMetrics: ['target_weight', 'target_bodyfat?'],
  deadlinePolicy: 'RANGE_OK'
}
```

**User says:** "I want to bench 300 lbs"  
**System asks ONLY:** "What's your current bench press max?"

---

## Architecture

### Component Structure

```
src/
├── types/                      # TypeScript definitions
│   ├── index.ts                # Core flow types
│   ├── flow-api.ts             # Backend API types
│   └── simulator.ts            # Execution mode types
│
├── context/                    # React Context providers
│   ├── FlowContext.tsx         # Flow state management
│   ├── FlowDataContext.tsx     # API integration
│   ├── SimulatorContext.tsx    # Execution mode state
│   └── ToastContext.tsx        # Toast notifications
│
├── components/
│   ├── KxAxisComposer.tsx      # Main composer component
│   ├── TopBar.tsx              # Actions bar
│   │
│   ├── Canvas/
│   │   ├── Canvas.tsx          # Main canvas with lanes
│   │   └── NodeCard.tsx        # Individual node cards
│   │
│   ├── ConversationItems/
│   │   └── ConversationItemsPalette.tsx  # Draggable items
│   │
│   ├── Inspector/
│   │   ├── Inspector.tsx                 # Panel router
│   │   ├── SimplifiedNodeInspector.tsx   # Node config
│   │   └── GoalGapTrackerInspector.tsx   # Specialized inspector
│   │
│   ├── Simulator/
│   │   ├── ExecutionMode.tsx             # Main simulator
│   │   ├── ExecutionTree.tsx             # Branch tree
│   │   ├── Playback.tsx                  # Chat view
│   │   └── ReadinessPanel.tsx            # Facts panel
│   │
│   └── FlowsList/
│       └── FlowsList.tsx                 # Flows management
│
├── routes/                     # Route components
│   ├── FlowsListRoute.tsx
│   ├── FlowDesignerRoute.tsx
│   ├── FlowSimulatorRoute.tsx
│   └── KxAxisRoutes.tsx
│
├── api/                        # API clients
│   ├── flowClient.ts           # Flow CRUD
│   └── simulatorClient.ts      # Execution API
│
├── hooks/                      # Custom hooks
│   ├── useFlowData.ts          # Load flow from API
│   ├── useDraftSave.ts         # Autosave drafts
│   ├── useValidate.ts          # Validation
│   └── usePublish.ts           # Publishing
│
├── theme/                      # Theming
│   ├── defaultLightTheme.ts
│   └── kxgryndeTheme.ts
│
├── config/
│   └── industryConversationItems.json    # Industry items
│
├── fixtures/
│   └── simulatorFixtures.ts              # Mock simulation data
│
├── demo/                       # Demo app
│   ├── DemoAppRouted.tsx
│   └── main-routed.tsx
│
└── index.ts                    # Public API exports
```

### Data Flow

```
User Input → Canvas Interaction → FlowContext (State) → onChange Callback → Parent App
                                                      ↓
                                            FlowDataContext (API)
                                                      ↓
                                            Backend (Save/Validate/Publish)
```

---

## Features

### Canvas Features

✅ **Space + Drag Panning** – Hold spacebar and drag to pan  
✅ **Native Scrollbars** – Overflow scrolling for large flows  
✅ **Eligibility Lanes** – Visual grouping by prerequisites  
✅ **Drag & Drop** – Conversation items → Canvas  
✅ **Primary Goal Marker** – Visual indicator for main goal  
✅ **Grid Layout** – Nodes stack vertically in lanes  
✅ **Discoverability Hints** – Action-based dismissal  

### Inspector Features

✅ **Context-sensitive** – Adapts to selection  
✅ **Node Configuration** – Title, type, requirements, produces  
✅ **Primary Goal Toggle** – Set/unset per node  
✅ **Title Case Display** – Snake_case → Title Case  
✅ **Gate Indicators** – Requires/Satisfies chips  

### API Integration Features

✅ **Autosave** – Debounced draft saving  
✅ **Validation** – Pre-publish error checking  
✅ **Publishing** – Immutable version creation  
✅ **Version History** – View past versions (read-only)  
✅ **Save Status Indicators** – Pending, Saving, Saved, Failed  
✅ **Loading Indicator** – Visual feedback while fetching  

### Execution Mode Features

✅ **Turn-by-turn simulation** – Chat-style playback  
✅ **Multi-branch support** – Fork from any node  
✅ **Alternate Reply Mode** – Create divergent paths  
✅ **Execution Inspector** – View controller decisions  
✅ **Readiness Panel** – Track facts and gates  
✅ **Mock Data** – Offline development support  
✅ **Node Status Tracking** – VALID/DRIFTED/INVALID  

---

## Routing

### Quick Setup

```tsx
import { BrowserRouter } from 'react-router-dom';
import { KxAxisRoutes } from '@toldyaonce/kx-axis-fe';

<BrowserRouter>
  <Routes>
    <Route path="/flows/*" element={<KxAxisRoutes />} />
  </Routes>
</BrowserRouter>
```

### Individual Route Components

```tsx
import {
  FlowsListRoute,
  FlowDesignerRoute,
  FlowSimulatorRoute,
} from '@toldyaonce/kx-axis-fe';

<Routes>
  <Route path="/flows" element={<FlowsListRoute />} />
  <Route path="/flows/:flowId" element={<FlowDesignerRoute />} />
  <Route path="/flows/:flowId/simulate" element={<FlowSimulatorRoute />} />
</Routes>
```

### Route Props

| Component | Props | Description |
|-----------|-------|-------------|
| `KxAxisRoutes` | `basePath?: string` | Base path for all routes (default: `/flows`) |
| `FlowDesignerRoute` | `basePath?: string`<br/>`showBackButton?: boolean`<br/>`onBack?: () => void` | Flow editor with optional back navigation |
| `FlowSimulatorRoute` | `basePath?: string`<br/>`showBackButton?: boolean` | Flow simulator with back navigation |

---

## API Integration

### Setup

```tsx
<KxAxisComposer
  flowId="flow-123"
  enableApiIntegration={true}
  autosaveEnabled={true}
  autosaveDelay={1000}
/>
```

### Environment Configuration

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3001/api
VITE_KXAXIS_AUTH_MODE=service-key
VITE_KXAXIS_SERVICE_KEY=your-dev-key
VITE_KXAXIS_TENANT_ID=your-tenant-id
```

### Authentication

**Service Key Mode (Dev/Staging):**
```bash
VITE_KXAXIS_AUTH_MODE=service-key
VITE_KXAXIS_SERVICE_KEY=dev-service-key-123
```

**Cognito JWT Mode (Production):**
```bash
VITE_KXAXIS_AUTH_MODE=cognito-jwt
# JWT token stored in localStorage['kx-id-token']
```

### API Endpoints

The integration uses:
- `GET /flows/{flowId}` – Get flow + draft
- `PUT /flows/{flowId}/draft` – Save draft
- `POST /flows/{flowId}/validate` – Validate flow
- `POST /flows/{flowId}/publish` – Publish version
- `GET /flows/{flowId}/versions` – List versions

### Using Hooks Directly

```tsx
import {
  useFlowData,
  useDraftSave,
  useValidate,
  usePublish,
} from '@toldyaonce/kx-axis-fe';

function MyEditor({ flowId }) {
  const { flow, isLoading, error } = useFlowData(flowId);
  const { saveDraft, saveStatus } = useDraftSave({ flowId });
  const { validate, report } = useValidate(flowId);
  const { publish } = usePublish(flowId);

  // Your custom UI
}
```

---

## Execution Mode (Simulator)

Execution Mode is a full-page simulator UI for testing flows deterministically.

### Features

✅ Turn-by-turn execution with controller analysis  
✅ Multi-branch support with visual tree  
✅ Alternate reply mode for creating divergent paths  
✅ Inspector showing execution decisions  
✅ Readiness panel tracking facts & gates  
✅ 3 demo scenarios (Fitness, Legal, Real Estate)  

### Usage

```tsx
import { ExecutionMode, SimulatorProvider } from '@toldyaonce/kx-axis-fe';

<SimulatorProvider>
  <ExecutionMode />
</SimulatorProvider>
```

### Mock Data

```typescript
import { mockSimulatorResponses } from '@toldyaonce/kx-axis-fe/fixtures';

// Enable mock data (offline development)
const { start, steps } = mockSimulatorResponses['flow-fitness-onboarding'];
```

**Available Scenarios:**
1. **Fitness Onboarding** – Multi-branch with goal tracking
2. **Legal Consultation** – High vulnerability, needs reassurance
3. **Real Estate** – Fast-track booking with known lead

### Execution Decisions

| Decision | Meaning |
|----------|---------|
| **ADVANCE** | Progress to next step |
| **STALL** | Not enough information, repeat/clarify |
| **EXPLAIN** | User needs reassurance/explanation |
| **FAST_TRACK** | Skip ahead (high confidence) |
| **HANDOFF** | Transfer to human |

---

## Theming & Design

### Using Built-in Themes

```tsx
import { kxgryndeTheme, defaultLightTheme } from '@toldyaonce/kx-axis-fe';
import { ThemeProvider } from '@mui/material';

<ThemeProvider theme={kxgryndeTheme}>
  <KxAxisComposer {...props} />
</ThemeProvider>
```

### Custom Theme

```tsx
import { createKxAxisTheme } from '@toldyaonce/kx-axis-fe';

const myTheme = createKxAxisTheme({
  palette: {
    primary: { main: '#FF0059' },
    secondary: { main: '#A6E22E' },
  },
});

<KxAxisComposer theme={myTheme} {...props} />
```

### KxGrynde Theme

**Professional dark-on-light with strategic accents:**

| Element | Color | Purpose |
|---------|-------|---------|
| **Primary** | Blue Slate `#5A6B7D` | Professional foundation |
| **Secondary** | Cyan `#39D0C9` | Fresh energy, success states |
| **Warning** | Soft Purple `#A78BFA` | Thoughtful, time-sensitive |
| **Error** | Magenta `#FF0059` | High-value actions |
| **Background** | Light Gray `#F6F7F8` | Soft, warm base |
| **Paper** | Jet Black `#1B1B1B` | High contrast cards |

**Design Principles:**
- Flat & minimal (no gradients, minimal shadows)
- High contrast for readability
- Strategic use of accent colors
- Lots of white space

---

## Development

### Run Demo

```bash
cd packages/kx-axis-fe
npm install
npm run dev
```

This starts the routed demo app on `http://localhost:5173`.

### Build Library

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Project Structure

```
packages/kx-axis-fe/
├── src/                    # Source code
├── dist/                   # Build output
├── index.html              # Demo entry point
├── vite.config.ts          # Vite config
├── tsconfig.json           # TypeScript config
└── package.json
```

---

## Advanced Topics

### Controller Runtime Specification

The controller interprets flows using **deterministic execution semantics**:

**Core Principles:**
1. **Edge-less** – No explicit sequencing
2. **Agentic** – Controller decides dynamically
3. **Deterministic** – Same state → same decision
4. **Gate-driven** – Completion by gate satisfaction

**Runtime State:**
```typescript
{
  facts: Set<string>,             // Extracted canonical facts
  states: Set<string>,            // Boolean completion flags
  gatesSatisfied: Set<string>,    // Derived from facts/states
  attemptsByNode: Record<nodeId, number>,     // Retry tracking
  executionsByNode: Record<nodeId, number>,   // Execution tracking
}
```

**Node Eligibility:**
- Execution cap not exceeded
- Required gates satisfied
- Required states satisfied
- Node's gates not already satisfied

### Industry-Specific Conversation Items

15 industries supported with custom conversation items:

```json
{
  "industries": ["Technology", "Healthcare", "Finance", ...],
  "generalItems": [...],  // Always available
  "industryItems": {
    "Technology": [...],
    "Healthcare": [...],
    ...
  }
}
```

**Available in:** `src/config/industryConversationItems.json`

### Primary Goal Feature

**Cardinality:** Zero or one primary goal at any time  
**Visual Treatment:** Star icon, "PRIMARY GOAL" badge, golden border  
**Contextual Highlighting:** Lane header and background tint  

**Usage:**
```typescript
// Set primary goal
setPrimaryGoalNode(nodeId);

// Unset
setPrimaryGoalNode(undefined);
```

### Space + Drag Panning

**UX Constraints:**
- Hold spacebar → cursor changes to grab hand
- Space + drag → pans canvas
- Prevents default spacebar scrolling
- Discoverability hint (dismisses after first use)
- Active feedback pill while panning
- Guardrails: disabled when input fields focused

---

## Mock Data & Fixtures

### Simulator Fixtures

Complete mock conversation data for offline development:

```typescript
import { 
  fitnessScenario,
  legalScenario,
  realEstateScenario 
} from '@toldyaonce/kx-axis-fe/fixtures';
```

**Fitness Scenario Structure:**
- 4 branches (Main, Strength, Weight Loss, Urgent)
- 21 nodes total
- 2 divergence points (multi-way splits)
- Demonstrates nested branching

**JSON Format:**
```json
{
  "run": {
    "runId": "run-fitness-001",
    "flowId": "flow-fitness-onboarding",
    "branches": [...],
    "nodes": [...]
  }
}
```

---

## Contributing

### Guidelines

1. **Use flat, calm design** – No gradients, minimal shadows
2. **Keep it minimal** – Lots of white space
3. **Config-only** – No LLM logic in frontend
4. **Type-safe** – Full TypeScript coverage
5. **Test with both themes** – Light and KxGrynde

### File Naming

- Components: PascalCase (`NodeCard.tsx`)
- Types: index files (`types/index.ts`)
- Utils: camelCase (`conversationItems.ts`)
- Config: kebab-case (`industry-conversation-items.json`)

---

## Support

For issues, questions, or feature requests:
- **GitHub Issues:** [toldyaonce/kx-axis-fe](https://github.com/toldyaonce/kx-axis-fe/issues)
- **Documentation:** This README + inline code comments
- **Demo:** Run `npm run dev` to see it in action

---

## License

MIT License – See [LICENSE](./LICENSE) for details.

---

**Built with ❤️ for AI agent platforms. Clean. Minimal. Obvious.**
