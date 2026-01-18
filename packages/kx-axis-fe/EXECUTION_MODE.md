# KxAxis Execution Mode

## Overview

Execution Mode is a full-page simulator UI for testing and debugging conversation flows deterministically. It simulates the KxAxis Conversation Execution Engine, showing turn-by-turn execution with controller decisions, known facts, and readiness states.

## Core Product Rules (ENFORCED)

These rules are non-negotiable and implemented in the UI:

✅ **Design Mode and Execution Mode are mutually exclusive**
   - Execution Mode does NOT show the conversation canvas
   - Toggle between modes in DemoApp

✅ **History is immutable**
   - Cannot edit past turns
   - Cannot append to non-leaf nodes
   - Sending from a non-leaf node MUST fork

✅ **User impersonation**
   - The human operator types as the lead
   - User input composer fixed at bottom
   - No auto-generated user messages

✅ **Deterministic execution**
   - All decisions traced to backend responses
   - No hallucinated readiness
   - Inspector shows reasoning for every turn

✅ **Automatic forking**
   - Button changes to "Fork & Send" when on non-leaf node
   - Confirmation dialog before forking
   - New branch created and selected automatically

✅ **Causality is obvious**
   - Every execution decision is inspectable
   - Control flags shown on hover
   - Readiness changes tracked per turn

## Architecture

### Components

1. **ScenarioBar** (Top)
   - Scenario selection and configuration
   - Channel and lead state settings
   - Start/Reset controls
   - Mock data toggle

2. **ExecutionTree** (Left Panel, 280px)
   - Visual tree of branches and nodes
   - Branch selection and management
   - Fork functionality from any node
   - Node status indicators (VALID/DRIFTED/INVALID)

3. **Playback** (Center, Flex)
   - Chat-style turn-by-turn display
   - User messages (right-aligned, blue bubbles)
   - Agent messages (left-aligned, gray bubbles)
   - Turn metadata (centered: turn number + decision badge)
   - Inspector icon reveals execution data on click:
     - Execution decision
     - Reasoning
     - Control flags
     - Affect scalars
     - Newly known facts
   - User input composer (fixed at bottom):
     - "Send" button (when at leaf node)
     - "Fork & Send" button (when on non-leaf node)

4. **ReadinessPanel** (Right Panel, 320px)
   - **Known so far**: Facts captured with categories
   - **Still needed**: Missing facts/constraints
   - **Unlocks**: Readiness delta (what's now available)
   - Uses availability language (not schema jargon)

### Data Flow

```
User Input → Controller Analysis → Execution Decision → Agent Response → Updated Facts
```

### State Management

**SimulatorContext** provides:
- `currentRun`: Active simulation run
- `activeBranchId`: Selected branch
- `selectedNodeId`: Selected node
- `useMockData`: Toggle for mock vs real API
- Actions: `startSimulation`, `stepSimulation`, `forkSimulation`
- Computed: `getNodesForBranch`, `getCurrentFacts`, etc.

### API Client

**simulatorAPI** provides typed methods:
- `startSimulation(request)`: Start new run
- `stepSimulation(request)`: Execute one turn
- `forkSimulation(request)`: Create branch from node

## Mock Data

### Demo Scenarios

1. **Fitness Onboarding** (Happy Path)
   - User: "I want to bench 300 lbs"
   - Flow: Smooth progression through goal setting
   - Decision: ADVANCE

2. **Legal Consultation** (Stall/Explain)
   - High vulnerability + hesitation
   - Flow: Needs reassurance before advancing
   - Decision: EXPLAIN

3. **Real Estate** (Fast Track)
   - Known lead with clear intent
   - Flow: Fast-track to booking
   - Decision: FAST_TRACK

### Using Mock Data

```typescript
// Enable mock data (default in demo)
setUseMockData(true);

// Mock responses defined in: src/fixtures/simulatorFixtures.ts
const mockData = mockSimulatorResponses['flow-fitness-onboarding'];
```

## Fork Workflow

1. User selects any node in the tree
2. Clicks fork icon (CallSplitIcon)
3. Dialog opens to name the branch
4. System:
   - Creates new branch
   - Replays history up to fork point
   - Branch becomes active
5. User can provide new input from that point

## Node Status

- **VALID**: Matches current contract and design versions
- **DRIFTED**: Contract or design changed since node
- **INVALID**: Node no longer compatible with system

Status computed from:
- `contractVersion`: Backend validation schema version
- `designVersionHash`: Flow design hash at execution time

## Types

All types are in `src/types/simulator.ts`:

```typescript
// Core types
ScenarioContext
KnownFacts
ControllerOutput
ExecutionResult
SimulationNode
SimulationBranch
SimulationRun

// API request/response types
StartSimulationRequest/Response
StepSimulationRequest/Response
ForkSimulationRequest/Response
```

## Usage in Application

### Toggle Between Modes

```typescript
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';
import { ExecutionMode } from '@toldyaonce/kx-axis-fe';

const App = () => {
  const [mode, setMode] = useState('design');
  
  return mode === 'design' ? (
    <KxAxisComposer {...props} />
  ) : (
    <ExecutionMode />
  );
};
```

### Standalone Execution Mode

```typescript
import { ExecutionMode, SimulatorProvider } from '@toldyaonce/kx-axis-fe';

const App = () => (
  <SimulatorProvider>
    <ExecutionMode />
  </SimulatorProvider>
);
```

## Availability Language

The UI uses **availability language** instead of schema jargon:

| ❌ Schema Jargon | ✅ Availability Language |
|-----------------|-------------------------|
| `requires` | "Known so far" |
| `satisfies` | "After this, we know" |
| `constraints.missing` | "Still needed" |
| `readinessDelta` | "Unlocks" |
| `stepSatisfiedThisTurn` | "Made progress this turn" |

## Backend Integration

### Real API Setup

1. Set environment variable:
   ```bash
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

2. Toggle mock data off:
   ```typescript
   setUseMockData(false);
   ```

3. Backend should implement:
   ```
   POST /simulator/run
   POST /simulator/step
   POST /simulator/fork
   ```

### Expected Response Format

Backend should return types matching `src/types/simulator.ts`. Validation is done server-side with Zod; frontend consumes typed responses.

## Execution Decisions

- **ADVANCE**: Progress to next step
- **STALL**: Not enough information, repeat/clarify
- **EXPLAIN**: User needs reassurance/explanation
- **FAST_TRACK**: Skip ahead (high confidence)
- **HANDOFF**: Transfer to human
- **NO_OP**: System decision (no user-visible action)

## Features

✅ Turn-by-turn simulation with full inspector data  
✅ Branch and fork from any node  
✅ Three complete demo scenarios  
✅ Mock data for offline development  
✅ Readiness panel showing facts and unlocks  
✅ Node status tracking (VALID/DRIFTED/INVALID)  
✅ Typed API client  
✅ Clean separation from Design Mode  

## Files

```
src/
├── types/simulator.ts                 # All simulator types
├── api/simulatorClient.ts             # API client
├── context/SimulatorContext.tsx       # State management
├── fixtures/simulatorFixtures.ts      # Mock data
└── components/Simulator/
    ├── ExecutionMode.tsx              # Main page
    ├── ScenarioBar.tsx                # Top bar
    ├── ExecutionTree.tsx              # Left tree
    ├── Playback.tsx                   # Center conversation
    └── ReadinessPanel.tsx             # Right facts panel
```

## Next Steps

1. **Backend Implementation**: Implement the 3 API endpoints
2. **Real Data Testing**: Toggle mock data off and test with backend
3. **Advanced Features**:
   - Export simulation runs
   - Compare branches side-by-side
   - Replay from any node
   - Save/load simulation sessions
4. **Analytics**: Track execution patterns across runs

