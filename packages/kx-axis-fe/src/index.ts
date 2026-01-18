/**
 * @toldyaonce/kx-axis-fe
 * 
 * Minimalistic React UI for composing Conversation Flows and Captures
 * for AI agent platforms.
 */

// Main component
export { KxAxisComposer } from './components/KxAxisComposer';

// Themes
export { 
  defaultLightTheme, 
  kxgryndeTheme, 
  createKxAxisTheme 
} from './theme';

// Types
export type {
  // Node types
  NodeKind,
  NodeUI,
  FlowNode,
  EligibilityLane,
  
  // Goal Gap Tracker types
  DeltaComputeMode,
  GoalGapCategory,
  GoalGapTrackerConfig,
  
  // Goal Lens types
  DeadlinePolicy,
  MetricDefinition,
  MetricBundle,
  GoalLens,
  GoalLensRegistry,
  
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

// Auth utilities
export { 
  getAuthHeaders, 
  getAuthMode, 
  validateAuthConfig, 
  getAuthModeDescription,
  AuthError,
  type AuthMode,
} from './auth/authHeaders';

// Flow API types (MATCHES BACKEND)
export type {
  // Core types
  Node,
  Edge,
  DraftGraph,
  Lane,
  UiLayout,
  Draft,
  
  // Flow entity
  Flow,
  
  // Version types
  VersionSummary,
  FlowVersion,
  
  // Validation types
  ValidationError,
  ValidationWarning,
  ValidationStats,
  ValidationReport,
  
  // API request/response types
  CreateFlowRequest,
  CreateFlowResponse,
  GetFlowOptions,
  GetFlowResponse,
  PatchFlowMetadataRequest,
  ReplaceDraftRequest,
  PatchFlowMetadataResponse,
  ReplaceDraftResponse,
  ValidateFlowResponse,
  PublishFlowRequest,
  PublishFlowResponse,
  FlowApiError,
} from './types/flow-api';

// Context (for advanced usage)
export { FlowProvider, useFlow } from './context/FlowContext';
export { FlowDataProvider, useFlowDataContext, useOptionalFlowDataContext } from './context/FlowDataContext';

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

// Flow API hooks
export { useFlowData } from './hooks/useFlowData';
export { useDraftSave } from './hooks/useDraftSave';
export { useValidate } from './hooks/useValidate';
export { usePublish } from './hooks/usePublish';
export { useVersions } from './hooks/useVersions';

// Flow API client
export { flowAPI } from './api/flowClient';

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

