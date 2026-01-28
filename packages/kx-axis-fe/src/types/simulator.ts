/**
 * KxAxis Execution Mode Types
 * 
 * These types represent the simulator/execution engine's data structures.
 * Backend validates with Zod; frontend consumes typed responses.
 */

// ========== SCENARIO & CONTEXT ==========

export type Channel = 'SMS' | 'Email' | 'Web Chat' | 'Phone';
export type LeadState = 'ANONYMOUS' | 'KNOWN';

export interface ScenarioContext {
  channel: Channel;
  leadState: LeadState;
  resumable: boolean;
  urgencyContext?: string;
}

// ========== KNOWN FACTS ==========

export interface KnownFacts {
  identity?: {
    name?: string;
    timezone?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
  };
  motive?: {
    primaryGoal?: string;
    painPoints?: string[];
  };
  goal?: {
    target?: string;
    baseline?: string;
    delta?: string;
    category?: string;
  };
  logistics?: {
    deadline?: string;
    availability?: string[];
  };
  constraints?: {
    known: Record<string, any>;
    missing: string[];
  };
}

// ========== CONTROLLER OUTPUT ==========

export interface Intent {
  primary: string;
  secondary?: string;
  confidence: number;
}

export interface AffectScalars {
  pain: number;        // 0-10
  urgency: number;     // 0-10
  vulnerability: number; // 0-10
}

export interface Signals {
  hesitation: boolean;
  objection: boolean;
  confusion: boolean;
  engagement: number; // 0-10
}

export interface Progress {
  madeProgress: boolean;
  stallDetected: boolean;
  stagnationTurns: number;
}

export type BlabberMode = 'ACK' | 'REASSURE' | 'EXPLAIN' | 'HYPE' | 'NONE';

export interface ControlFlags {
  canAdvance: boolean;
  needsExplanation: boolean;
  fastTrackEligible: boolean;
  humanTakeoverAllowed: boolean;
  recommendedStep?: {
    stepId: string;
    confidence: number;
  };
  allowedBlabberModes: BlabberMode[];
}

export interface ControllerOutput {
  intent: Intent;
  affectScalars: AffectScalars;
  signals: Signals;
  progress: Progress;
  stepSufficiency: boolean;
  controlFlags: ControlFlags;
}

// ========== EXECUTION DECISION ==========

export type ExecutionDecision = 
  | 'ADVANCE' 
  | 'STALL' 
  | 'EXPLAIN' 
  | 'FAST_TRACK' 
  | 'HANDOFF' 
  | 'NO_OP';

export interface ConstraintDelta {
  operation: 'ADD' | 'REMOVE' | 'MODIFY';
  constraintType: string;
  value: any;
  reason?: string;
}

export interface ExecutionMetadata {
  blabberModeUsed: BlabberMode;
  stepSatisfiedThisTurn: boolean;
  newlyKnownFacts: string[];
  readinessDelta: string[];
}

export interface ExecutionResult {
  executionDecision: ExecutionDecision;
  reasoning: string;
  agentMessage?: string;
  constraintDeltas?: ConstraintDelta[];
  executionMetadata: ExecutionMetadata;
}

// ========== CONVERSATION HISTORY ==========

export interface ConversationTurn {
  turnId: string;
  speaker: 'user' | 'agent';
  message: string;
  timestamp: string;
}

// ========== SIMULATION RUN ==========

export type NodeStatus = 'VALID' | 'DRIFTED' | 'INVALID';

// Flat structure with parent-child relationships (DynamoDB-optimized)
export interface SimulationNode {
  nodeId: string;
  parentNodeId: string | null;
  branchId: string | null; // Branch concept deprecated - rely on parentNodeId for tree structure
  turnNumber: number;
  
  // Input
  userMessage?: string;
  knownFactsBefore: KnownFacts;
  
  // Processing
  controllerOutput: ControllerOutput;
  executionResult: ExecutionResult;
  
  // Output
  agentMessage?: string;
  knownFactsAfter: KnownFacts;
  
  // Metadata
  timestamp: string;
  contractVersion: string;
  designVersionHash: string;
  status: NodeStatus;
  
  // API Response Metadata (optional - for real API data)
  metadata?: {
    tickSignals?: {
      pain: number;
      vulnerability: number;
      urgency: number;
      engagement: number;
      hesitation: number;
      confusion: number;
      objections: string[];
    };
    intentDetection?: any;
    controllerOutput?: any;
    executionResult?: any;
    sim?: any;
    knownFactsBefore?: string[];
    knownFactsAfter?: string[];
    [key: string]: any;
  };
  
  // Intent Detection (for user nodes)
  intentDetection?: any;
  
  // Top-level fields from GET API responses (duplicated for convenience)
  tickSignals?: {
    pain: number;
    vulnerability: number;
    urgency: number;
    engagement: number;
    hesitation: number;
    confusion: number;
    objections: string[];
  };
  timing?: {
    intentDetection: number;
    stepRecommender: number;
    controllerProcessing: number;
    processorLLM: number;
    total: number;
  };
  progress?: {
    knownSoFar: string[];
    learnedThisTurn: string[];
    pendingToLearn: string[];
  };
}

export interface SimulationBranch {
  branchId: string;
  parentBranchId: string | null;
  forkFromNodeId: string | null;
  label: string;
  createdAt: string;
}

export interface SimulationRun {
  runId: string;
  flowId: string;
  flowName: string;
  scenarioContext: ScenarioContext;
  branches: SimulationBranch[];
  nodes: SimulationNode[];
  createdAt: string;
  updatedAt: string;
}

// ========== API REQUESTS & RESPONSES ==========

// ========== NEW SIMULATION API (matches SIMULATION_API_INTEGRATION.md) ==========

/**
 * Flow Node format for API (simplified from full FlowNode type)
 */
export interface ApiFlowNode {
  id: string;
  title: string;
  type: string;
  producesFacts: string[];
}

/**
 * POST /agent/simulations - Create simulation
 */
export interface StartSimulationRequest {
  name: string;              // Simulation name (e.g., "Fitness Test - Anonymous User")
  flowId: string;            // Flow ID being tested
  leadState: LeadState;      // ANONYMOUS or KNOWN
  personaId: string;         // Persona that will respond in the simulation
  // NO initialMessage - creates empty simulation with root node only
}

export interface StartSimulationResponse {
  simulationId: string;
  rootNodeId: string;      // Root node ID for first PATCH call
  createdAt: string;
}

/**
 * GET /agent/simulations?flowId={flowId}&tenantId={tenantId} - List simulations
 */
export interface ListSimulationsRequest {
  flowId: string;
  tenantId?: string;
  limit?: number;
  offset?: number;
}

export interface SimulationSummary {
  simulationId: string;
  name: string;
  flowId: string;
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  metadata: {
    channel: Channel;
    leadState: LeadState;
    turnCount: number;
    hasLowConfidence?: boolean;
    hasGapDetection?: boolean;
  };
}

export interface ListSimulationsResponse {
  success: boolean;
  data: {
    simulations: SimulationSummary[];
    total: number;
  };
}

/**
 * GET /agent/simulations/:simulationId - Get simulation details
 */
export interface GetSimulationResponse {
  // Flat structure - API returns everything at root level
  flowId: string;
  simulationId: string;
  name: string;
  leadState: string;
  nodes: any[]; // Full conversation history
  state: {
    currentFlowNodeId: string | null;
    personaId: string;
    knownFacts: any[];
  };
  rootNodeId: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  PK: string;
  SK: string;
  metadata?: {
    channel?: string;
    leadState?: string;
    hasGapDetection?: boolean;
  };
}

/**
 * PATCH /agent/simulations?simulationId=xxx - Continue conversation
 */
export interface StepSimulationRequest {
  userMessage: string;
  parentNodeId: string;      // Previous agent node ID
  flowNodes: ApiFlowNode[];  // Flow configuration
}

export interface StepSimulationResponse {
  userNode: {
    nodeId: string;
    parentNodeId: string;
    type: 'user';
    content: string;
    timestamp: string;
    intentDetection: {
      primaryIntent: string;
      signals: {
        hesitation: number;
        objections: string[];
        confusion: number;
      };
    };
  };
  agentNode: {
    nodeId: string;
    parentNodeId: string;
    type: 'agent';
    content: string;
    timestamp: string;
    sim: {
      selectedNodeId: string;
      decision: {
        confidence: number;
        status: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
        margin: number;
      };
      issues: any[];
      gapRecommendation: GapRecommendation | null;
    };
    metadata?: {
      controllerOutput?: any;
      executionResult?: any;
      [key: string]: any;
    };
  };
  updatedState: {
    knownFacts: string[];
    currentFlowNodeId: string;
    personaId: string;
  };
  tickSignals: {
    pain: number;
    vulnerability: number;
    urgency: number;
    engagement: number;
    hesitation: number;
    confusion: number;
    objections: string[];
  };
  factsCollected?: {
    before: string[];
    after: string[];
    newFactsThisTurn: string[];
  };
}

/**
 * Gap Detection (when confidence < 0.60)
 */
export interface GapRecommendation {
  kind: 'FLOW_GAP_RECOMMENDATION_V1';
  shouldSuggest: boolean;
  trigger: {
    type: string;
    why: string;
  };
  gap: {
    gapType: string;
    capability: string;
    confidence: number;
  };
  proposedNodes: Array<{
    id: string;
    title: string;
    type: string;
    description: string;
    requires: { facts: string[] };
    produces: { facts: string[] };
    rationale: string;
  }>;
}

/**
 * OLD API INTERFACES (deprecated - for backward compat with mock data)
 * Keep the old types with different names to avoid conflicts
 */
export interface ForkSimulationRequest {
  runId: string;
  forkFromNodeId: string;
  newBranchLabel: string;
}

export interface ForkSimulationResponse {
  branch: SimulationBranch;
  replayedHistory: SimulationNode[];
}

/**
 * OLD format - used by mock data
 */
export interface MockStartResponse {
  run: SimulationRun;
}

export interface MockStepResponse {
  node: SimulationNode;
  updatedFacts: KnownFacts;
}






