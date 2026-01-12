/**
 * @toldyaonce/kx-axis-fe
 * 
 * Minimalistic React UI for composing Conversation Flows and Captures
 * for AI agent platforms.
 */

// Main component
export { KxAxisComposer } from './components/KxAxisComposer';

// Types
export type {
  // Node types
  NodeKind,
  NodeGroup,
  NodeUI,
  FlowNode,
  EligibilityLane,
  
  // Capture types (legacy)
  CaptureDefinition,
  ActiveCapture,
  IndustryCaptureRegistry,
  
  // Goal Gap Tracker types (NEW)
  DeltaComputeMode,
  GoalGapCategory,
  GoalGapTrackerConfig,
  
  // Goal Lens types
  DeadlinePolicy,
  MetricDefinition,
  MetricBundle,
  GoalLens,
  
  // Flow types
  ConversationFlow,
  
  // Simulation types
  SimulationInput,
  SimulationOutput,
  
  // Component props
  KxAxisComposerProps,
  
  // Selection types
  SelectionType,
  Selection,
} from './types';

// Context (for advanced usage)
export { FlowProvider, useFlow } from './context/FlowContext';

// Utilities
export {
  GATES,
  LANE_CONFIG,
  calculateNodeLane,
  getNodeGateRequirements,
  getNodeGateSatisfactions,
  validateNodeInLane,
  updateNodeForLane,
} from './utils/laneLogic';

// ========== EXECUTION MODE ==========

// Main Execution Mode component
export { ExecutionMode } from './components/Simulator/ExecutionMode';

// Simulator context
export { SimulatorProvider, useSimulator } from './context/SimulatorContext';

// Simulator types
export type {
  Channel,
  LeadState,
  ScenarioContext,
  KnownFacts,
  Intent,
  AffectScalars,
  Signals,
  Progress,
  BlabberMode,
  ControlFlags,
  ControllerOutput,
  ExecutionDecision,
  ConstraintDelta,
  ExecutionMetadata,
  ExecutionResult,
  ConversationTurn,
  NodeStatus,
  SimulationNode,
  SimulationBranch,
  SimulationRun,
  StartSimulationRequest,
  StartSimulationResponse,
  StepSimulationRequest,
  StepSimulationResponse,
  ForkSimulationRequest,
  ForkSimulationResponse,
} from './types/simulator';

