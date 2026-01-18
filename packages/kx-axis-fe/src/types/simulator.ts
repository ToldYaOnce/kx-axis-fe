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

export interface SimulationNode {
  nodeId: string;
  parentNodeId: string | null;
  branchId: string;
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

export interface StartSimulationRequest {
  flowId: string;
  scenarioContext: ScenarioContext;
  initialFacts?: Partial<KnownFacts>;
}

export interface StartSimulationResponse {
  run: SimulationRun;
}

export interface StepSimulationRequest {
  runId: string;
  branchId: string;
  parentNodeId: string;
  userMessage: string;
}

export interface StepSimulationResponse {
  node: SimulationNode;
  updatedFacts: KnownFacts;
}

export interface ForkSimulationRequest {
  runId: string;
  forkFromNodeId: string;
  newBranchLabel: string;
}

export interface ForkSimulationResponse {
  branch: SimulationBranch;
  replayedHistory: SimulationNode[];
}



