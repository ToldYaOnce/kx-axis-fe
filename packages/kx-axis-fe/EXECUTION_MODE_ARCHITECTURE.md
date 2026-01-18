# KxAxis Execution Mode - Complete Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           EXECUTION MODE (Full Page)                     │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  ScenarioBar (Top)                                                      │
│  [Fitness Onboarding ▼]  [SMS]  [ANONYMOUS]  [Use Mock] [Reset]       │
└────────────────────────────────────────────────────────────────────────┘

┌──────────────┬────────────────────────────────┬──────────────────────┐
│ ExecutionTree│         Playback               │   ReadinessPanel     │
│   (280px)    │         (Flex)                 │      (320px)         │
├──────────────┼────────────────────────────────┼──────────────────────┤
│              │                                │                      │
│ ▶ Main       │  ┌──────────────────────────┐ │ KNOWN SO FAR         │
│   ├─ Turn 1  │  │ Turn 1  [ADVANCE]   (i) │ │ ✓ Contact           │
│   ├─ Turn 2  │  │  User: "Hi"             │ │   - email           │
│   └─ Turn 3  │  │  Agent: "Hello!"        │ │   - phone           │
│              │  └──────────────────────────┘ │                      │
│ ▶ Fork 1     │                                │ STILL NEEDED         │
│   └─ Turn 3' │  ┌──────────────────────────┐ │ ⚠ Goal              │
│              │  │ Turn 2  [EXPLAIN]   (i) │ │ ⚠ Deadline          │
│ + Fork       │  │  User: "I need help"    │ │                      │
│              │  │  Agent: "Sure! Let me..." │ UNLOCKS              │
│              │  └──────────────────────────┘ │ → Booking available  │
│              │                                │                      │
│              │  ┌──────────────────────────┐ │                      │
│              │  │ Turn 3  [ADVANCE]   (i) │ │                      │
│              │  │  User: "Book session"   │ │                      │
│              │  │  Agent: "Great! When?"  │ │                      │
│              │  └──────────────────────────┘ │                      │
│              │                                │                      │
│              │  ┌────────────────────────┐   │                      │
│              │  │ [Type as the lead…   ] │   │                      │
│              │  │                        │   │                      │
│              │  │          [Fork & Send]▶│   │                      │
│              │  └────────────────────────┘   │                      │
└──────────────┴────────────────────────────────┴──────────────────────┘
```

## Component Hierarchy

```
ExecutionMode
├── ScenarioBar
│   ├── Scenario Selector (dropdown)
│   ├── Channel Badge
│   ├── Lead State Badge
│   ├── Mock Toggle
│   └── Reset Button
│
├── Box (flex container for 3 panels)
│   │
│   ├── ExecutionTree (left, 280px)
│   │   ├── Branch List
│   │   │   ├── Branch Item
│   │   │   │   ├── Branch Label
│   │   │   │   ├── Node List
│   │   │   │   │   └── Node Item
│   │   │   │   │       ├── Turn Number
│   │   │   │   │       ├── Decision Badge
│   │   │   │   │       └── Status Badge (VALID/DRIFTED/INVALID)
│   │   │   │   └── Collapse/Expand
│   │   └── Fork Dialog
│   │
│   ├── Playback (center, flex)
│   │   ├── Conversation History (scrollable)
│   │   │   └── Turn Card (for each node)
│   │   │       ├── Turn Metadata (centered)
│   │   │       │   ├── Turn Number Chip
│   │   │       │   ├── Decision Badge
│   │   │       │   └── Inspector Icon (click to open)
│   │   │       ├── User Message Bubble (blue, right)
│   │   │       ├── Agent Message Bubble (gray, left)
│   │   │       └── Inspector Popover
│   │   │           ├── Reasoning
│   │   │           ├── Control Flags
│   │   │           ├── Affect Scalars
│   │   │           └── Newly Known Facts
│   │   │
│   │   └── User Turn Composer (fixed bottom) ← KEY COMPONENT
│   │       ├── TextField (multiline)
│   │       └── Send/Fork & Send Button
│   │
│   └── ReadinessPanel (right, 320px)
│       ├── Known So Far
│       │   └── Fact chips (grouped by category)
│       ├── Still Needed
│       │   └── Missing fact chips
│       └── Unlocks
│           └── Readiness delta chips
```

## Data Flow

### User Input Flow

```
┌──────────────────┐
│ User types in    │
│ Composer         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ isLeafNode()     │  ← Determines if selected node has children
└────┬───────┬─────┘
     │       │
 YES │       │ NO
     │       │
     ▼       ▼
┌─────────┐ ┌──────────────────┐
│ Send    │ │ Fork & Send      │
│ (leaf)  │ │ (non-leaf)       │
└────┬────┘ └─────┬────────────┘
     │            │
     │            ▼
     │      ┌──────────────────┐
     │      │ POST /simulator/ │
     │      │      fork        │
     │      └─────┬────────────┘
     │            │
     │            ▼
     │      ┌──────────────────┐
     │      │ New branch       │
     │      │ created          │
     │      └─────┬────────────┘
     │            │
     └────────────┘
              ▼
     ┌──────────────────┐
     │ POST /simulator/ │
     │      step        │
     └─────┬────────────┘
           │
           ▼
     ┌──────────────────┐
     │ Backend returns  │
     │ - User turn node │
     │ - Agent turn     │
     │ - Execution data │
     │ - Readiness Δ    │
     └─────┬────────────┘
           │
           ▼
     ┌──────────────────┐
     │ SimulatorContext │
     │ updates state    │
     └─────┬────────────┘
           │
           ├─────────────────────┬─────────────────────┐
           ▼                     ▼                     ▼
     ┌─────────────┐   ┌─────────────────┐   ┌─────────────────┐
     │ Execution   │   │ Playback        │   │ Readiness       │
     │ Tree        │   │ (new turns)     │   │ Panel           │
     │ (new branch)│   │                 │   │ (updated facts) │
     └─────────────┘   └─────────────────┘   └─────────────────┘
```

### State Management

```
SimulatorContext
├── runs: SimulatorRun[]
├── currentRunId: string | null
├── activeBranchId: string | null
├── selectedNodeId: string | null
├── mockMode: boolean
│
├── Actions:
│   ├── startNewRun(scenario)
│   ├── step(userMessage)         ← Called by Composer on "Send"
│   ├── forkSimulation(nodeId)    ← Called by Composer on "Fork & Send"
│   ├── selectNode(nodeId)
│   ├── selectBranch(branchId)
│   └── resetSimulation()
│
└── Computed:
    ├── currentRun
    ├── activeBranch
    ├── getNodesForBranch(branchId)
    └── getKnownFacts()
```

## User Turn Composer - Integration Points

### 1. Context Hooks

```typescript
const {
  currentRun,           // Active simulation run
  activeBranchId,       // Current branch being viewed
  selectedNodeId,       // Which turn is selected
  stepSimulation,       // Send user message
  forkSimulation,       // Create new branch
  getNodesForBranch     // Get all turns in branch
} = useSimulator();
```

### 2. Leaf Detection

```typescript
const isLeafNode = () => {
  if (!selectedNodeId) return true;
  const nodes = getNodesForBranch(activeBranchId);
  const selectedNode = nodes.find(n => n.nodeId === selectedNodeId);
  
  // A node is a leaf if no other node has it as a parent
  return !nodes.some(n => n.parentNodeId === selectedNodeId);
};
```

### 3. Send Handler

```typescript
const handleSendMessage = async () => {
  if (!userInput.trim() || isSending) return;

  setIsSending(true);
  try {
    // Fork automatically if not on leaf (no confirmation)
    if (!isLeafNode() && selectedNodeId) {
      const branchLabel = `Fork ${Date.now()} (from Turn ${turnNumber})`;
      await forkSimulation(selectedNodeId, branchLabel);
    }
    
    // Send user message
    await stepSimulation(userInput);
    setUserInput('');  // Clear input
    // Focus stays in composer (handled by React)
  } catch (error) {
    console.error('Failed to send:', error);
  } finally {
    setIsSending(false);
  }
};
```

### 4. Keyboard Behavior

```typescript
const handleKeyPress = (event: React.KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSendMessage();  // Send on Enter
    // Shift+Enter → new line (default textarea behavior)
  }
};
```

## API Contract

### POST /simulator/step

**Request:**
```json
{
  "runId": "run_abc123",
  "branchId": "branch_xyz",
  "cursorNodeId": "node_leaf",
  "userMessage": "I want to lose weight"
}
```

**Response:**
```json
{
  "nodes": [
    {
      "nodeId": "node_new_user",
      "parentNodeId": "node_leaf",
      "turnNumber": 6,
      "userMessage": "I want to lose weight",
      "agentMessage": null,
      "timestamp": "2026-01-12T..."
    },
    {
      "nodeId": "node_new_agent",
      "parentNodeId": "node_new_user",
      "turnNumber": 7,
      "userMessage": null,
      "agentMessage": "That's great! Let's figure out...",
      "executionResult": {
        "executionDecision": "ADVANCE",
        "reasoning": "User expressed clear motive...",
        "executionMetadata": {
          "newlyKnownFacts": ["motive.weight_loss"],
          "blabberModeUsed": "REASSURE"
        }
      },
      "controllerOutput": {
        "controlFlags": {
          "canAdvance": true,
          "fastTrackEligible": false
        },
        "affectScalars": {
          "pain": 0.3,
          "urgency": 0.5
        }
      },
      "knownFacts": {
        "identity": {},
        "contact": {},
        "motive": { "weight_loss": true },
        "constraints": {}
      },
      "timestamp": "2026-01-12T..."
    }
  ],
  "readinessDelta": {
    "added": ["motive.weight_loss"],
    "unlocked": []
  }
}
```

### POST /simulator/fork

**Request:**
```json
{
  "runId": "run_abc123",
  "fromNodeId": "node_turn_3",
  "branchLabel": "Fork 1736227461534 (from Turn 3)"
}
```

**Response:**
```json
{
  "branchId": "branch_new_fork",
  "nodes": [
    // Copy of all nodes from root to fromNodeId
    { "nodeId": "node_turn_1", ... },
    { "nodeId": "node_turn_2", ... },
    { "nodeId": "node_turn_3", ... }
  ],
  "leafNodeId": "node_turn_3"  // Ready for new input
}
```

## Critical Invariants

1. **History is immutable**
   - ✅ Enforced by fork-on-send from non-leaf
   - ✅ No edit buttons on past turns
   - ✅ No in-place updates

2. **User never auto-generated**
   - ✅ Composer requires manual input
   - ✅ No AI suggestions
   - ✅ No quick-reply auto-selection

3. **Deterministic execution**
   - ✅ All decisions from backend
   - ✅ No client-side interpretation
   - ✅ Inspector shows raw reasoning

4. **Forking is automatic**
   - ✅ No modal confirmations
   - ✅ Button label changes ("Fork & Send")
   - ✅ Tree updates immediately

5. **Causality is obvious**
   - ✅ Inspector on every turn
   - ✅ Readiness panel shows deltas
   - ✅ Decision badges color-coded

## File Locations

| Component | File | Lines |
|-----------|------|-------|
| User Turn Composer | `Playback.tsx` | 290-320 |
| Send Handler | `Playback.tsx` | 212-236 |
| Leaf Detection | `Playback.tsx` | 204-210 |
| Keyboard Handler | `Playback.tsx` | 238-243 |
| Execution Tree | `ExecutionTree.tsx` | Full file |
| Readiness Panel | `ReadinessPanel.tsx` | Full file |
| Scenario Bar | `ScenarioBar.tsx` | Full file |
| Simulator Context | `SimulatorContext.tsx` | Full file |
| Type Definitions | `types/simulator.ts` | Full file |
| API Client | `api/simulatorClient.ts` | Full file |
| Mock Fixtures | `fixtures/simulatorFixtures.ts` | Full file |

## Success Metrics

A successful implementation allows a developer/operator to:

1. ✅ Select a scenario and start simulation
2. ✅ Type as the lead and see agent responses
3. ✅ Navigate conversation history
4. ✅ Click any past turn and fork from it
5. ✅ Understand why the agent made each decision
6. ✅ See what facts are known vs missing
7. ✅ Explore multiple branches independently
8. ✅ Test edge cases without modifying code

**Without:**
- Reading system documentation
- Understanding backend architecture
- Modal interruptions
- Ambiguous UI states
- Hidden constraints

## Complete

✅ User Turn Composer is fully implemented  
✅ Fork-on-send is automatic (no confirmation)  
✅ All core rules enforced  
✅ Execution Mode is production-ready  

**The simulator proves that the agentic system is controllable and deterministic.**




