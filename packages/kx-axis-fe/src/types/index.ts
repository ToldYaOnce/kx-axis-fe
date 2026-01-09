/**
 * KxAxis Flow Composer - Types
 * 
 * Philosophy: Configure WHAT the agent says next, NEVER HOW it says it.
 * The LLM chooses phrasing. The system controls eligibility, prerequisites, and sequencing.
 */

// ========== GOAL LENS SYSTEM ==========

/**
 * Deadline enforcement policy for goal capture
 */
export type DeadlinePolicy = 
  | 'EXACT_DATE'      // Must get specific date (e.g., "March 15th")
  | 'RANGE_OK'        // Can accept date range (e.g., "early March")
  | 'DURATION_OK';    // Can accept duration (e.g., "3 months")

/**
 * Metric definition within a goal lens
 */
export interface MetricDefinition {
  id: string;
  name: string;
  description?: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;  // Is this metric mandatory for this goal?
}

/**
 * Metric Bundle - defines what data is needed for a specific goal
 */
export interface MetricBundle {
  baselineMetrics: MetricDefinition[];  // What we need to know NOW
  targetMetrics: MetricDefinition[];    // What they want to ACHIEVE
  deadlinePolicy: DeadlinePolicy;        // How precise the deadline must be
}

/**
 * Goal Lens - a lens through which we view the user's desired outcome
 * 
 * Example: BODY_COMPOSITION, STRENGTH_PR, PERFORMANCE, WELLNESS
 */
export interface GoalLens {
  id: string;
  name: string;
  description: string;
  industry: string;  // e.g., "Fitness", "Legal", "Finance"
  metricBundle: MetricBundle;
  
  // Visual metadata
  icon?: string;
  color?: string;
}

/**
 * Registry of available Goal Lenses for an industry
 */
export interface GoalLensRegistry {
  industry: string;
  lenses: GoalLens[];
}

// ========== NODE TYPES ==========

/**
 * Node kinds represent CONVERSATION MOMENTS, not fields
 */
export type NodeKind =
  | 'EXPLANATION'              // Inform, educate, build trust
  | 'REFLECTIVE_QUESTION'      // Ask them to reflect on readiness
  | 'GOAL_DEFINITION'          // Capture which goal they want
  | 'BASELINE_CAPTURE'         // Adaptive: asks baseline Q's based on goal
  | 'DEADLINE_CAPTURE'         // Capture deadline per policy
  | 'GOAL_GAP_TRACKER'         // Delta-first: target → baseline → delta → category
  | 'ACTION_BOOKING'           // Schedule something
  | 'HANDOFF';                 // Transfer to human

/**
 * Eligibility Lanes - hard gates in the conversation flow
 */
export type EligibilityLane = 
  | 'BEFORE_CONTACT'    // No contact required
  | 'CONTACT_GATE'      // Node that satisfies contact
  | 'AFTER_CONTACT'     // Requires contact to run
  | 'AFTER_BOOKING';    // Requires booking to run

/**
 * Visual positioning within lane
 */
export interface NodeUI {
  x: number;
  y: number;
  lane: EligibilityLane;
}

/**
 * What this node satisfies (gates, metrics, states)
 */
export interface NodeSatisfaction {
  gates?: ('CONTACT' | 'BOOKING' | 'HANDOFF')[];
  metrics?: string[];  // Metric IDs from goal lens
  states?: string[];   // Custom state flags
}

/**
 * Deadline enforcement configuration for DEADLINE_CAPTURE nodes
 */
export interface DeadlineEnforcement {
  policy: DeadlinePolicy;
  narrowingStrategy: 'IMMEDIATE' | 'FOLLOW_UP';  // How to handle duration answers
  promptOnViolation?: string;  // Optional hint (but NOT full phrasing)
}

/**
 * Delta computation mode for GOAL_GAP_TRACKER
 */
export type DeltaComputeMode = 
  | 'AUTO'          // Recommended: system determines best approach
  | 'TIME_BASED'    // For time-based goals (faster 5K, longer plank)
  | 'LOAD_BASED'    // For weight/resistance (heavier bench, more weight)
  | 'REPS_BASED'    // For repetition goals (more pushups, more reps)
  | 'PERCENT_BASED' // For percentage goals (lower body fat %, higher completion rate)
  | 'MANUAL';       // No automatic compute; classification only

/**
 * Category definition for GOAL_GAP_TRACKER
 */
export interface GoalGapCategory {
  id: string;
  name: string;
  recommendedNextNodeId?: string;  // Optional: which node to run next for this category
  deadlinePolicyOverride?: 'INHERIT' | DeadlinePolicy;  // Override deadline precision
}

/**
 * Configuration for GOAL_GAP_TRACKER nodes
 * Delta-first philosophy: Target → Baseline → Delta → Category
 */
export interface GoalGapTrackerConfig {
  // Semantic labels for capture (NOT full prompts)
  targetLabel: string;          // e.g., "What's the exact outcome you want?"
  baselineLabel: string;        // e.g., "Where are you at right now with that?"
  
  // Examples to show end-user
  showExamples: boolean;
  examples: string[];           // e.g., ["run 3 miles in 21 minutes", "bench 300", "lose 15 lbs"]
  
  // Delta computation
  computeMode: DeltaComputeMode;
  askClarifierIfIncomparable: boolean;  // If target/baseline aren't comparable, ask follow-up
  
  // Deadline policy (default for this tracker)
  deadlinePolicyDefault: 'INHERIT' | DeadlinePolicy;
  
  // Category taxonomy (Google tracking style)
  categories: GoalGapCategory[];
}

/**
 * Flow Node - represents a conversation moment
 * 
 * NEVER contains phrasing or prompts.
 * Only eligibility, prerequisites, and what it satisfies.
 */
export interface FlowNode {
  id: string;
  kind: NodeKind;
  title: string;
  purpose?: string;  // Why this node exists (for operator understanding)
  
  // Prerequisites (hard gates)
  requires?: string[];  // Gate IDs: 'CONTACT', 'BOOKING', or other node IDs
  
  // What this node satisfies
  satisfies?: NodeSatisfaction;
  
  // Visual
  ui?: NodeUI;
  
  // Goal Lens association (for adaptive nodes)
  goalLensId?: string;  // If this node adapts to a goal lens
  
  // Deadline enforcement (for DEADLINE_CAPTURE nodes)
  deadlineEnforcement?: DeadlineEnforcement;
  
  // Goal Gap Tracker configuration (for GOAL_GAP_TRACKER nodes)
  goalGapTracker?: GoalGapTrackerConfig;
  
  // Eligibility rules
  eligibility?: {
    channels?: string[];
    leadStates?: string[];
    requiresGoalSet?: boolean;  // Can only run after goal is defined
  };
  
  // Priority (deprecated - use importance instead)
  priority?: {
    baseRank?: number;  // 0-100
    capRank?: number;   // Maximum rank
  };
  
  // Execution metadata (NOT phrasing)
  execution?: {
    speechAct?: string;  // e.g., "inform", "request", "confirm"
    allowPrefix?: boolean;  // Can this be prefaced with context?
  };
  
  // ========== SIMPLIFIED DESIGNER-FACING FIELDS ==========
  
  // Importance (replaces priority.baseRank/capRank with human terms)
  importance?: 'low' | 'normal' | 'high';  // Default: 'normal'
  
  // Max runs (how many times can this node run?)
  maxRuns?: 'once' | 'multiple' | 'unlimited';  // Default: 'multiple'
  
  // Cooldown (min turns between runs)
  cooldownTurns?: number;  // Default: 0 (no cooldown)
  
  // Style allowance (replaces execution.allowPrefix with plain language)
  allowSupportiveLine?: boolean;  // Can system add a short supportive line before the main message?
}

// ========== CONVERSATION FLOW ==========

/**
 * Active Goal Lens selection in this flow
 */
export interface ActiveGoalLens {
  lensId: string;
  required: boolean;  // Must user select this goal lens?
  usageLabel?: string;  // How this lens is used in the flow
}

/**
 * Conversation Flow - the complete configuration
 * 
 * Output is PURE JSON:
 * - No phrasing
 * - No prompts
 * - No LLM logic
 * - Only eligibility, prerequisites, and satisfactions
 */
export interface ConversationFlow {
  id: string;
  name: string;
  description?: string;
  
  // Nodes (conversation moments)
  nodes: FlowNode[];
  
  // Active goal lenses in this flow
  activeGoalLenses: ActiveGoalLens[];
  
  // Metadata
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    version?: string;
    industry?: string;
  };
}

// ========== COMPOSER PROPS ==========

export interface KxAxisComposerProps {
  initialConfig: ConversationFlow;
  goalLensRegistry: GoalLensRegistry;
  onChange?: (updatedConfig: ConversationFlow) => void;
  onValidate?: () => void;
  onSimulate?: () => void;
  onPublish?: (config: ConversationFlow) => void;
}

// ========== SELECTION STATE ==========

export type SelectionType = 'node' | 'goal-lens' | 'overview';

export interface Selection {
  type: SelectionType;
  id?: string;  // Node ID or Goal Lens ID
}

// ========== SIMULATION TYPES ==========

export interface SimulationInput {
  channel: string;
  leadState: string;
  vulnerability: number;
  contactCaptured: boolean;
  bookingCaptured: boolean;
  goalLensSelected?: string;  // Which goal lens user selected
}

export interface SimulationOutput {
  eligibleNodes: string[];  // Node IDs
  selectedNode?: string;  // Node ID
  exampleMessage: string;  // Placeholder (style-agnostic)
  adaptiveQuestions?: string[];  // For BASELINE_CAPTURE, show which Q's would be asked
  goalGapTrackerOutputs?: {  // Mock outputs for GOAL_GAP_TRACKER
    target: string;
    baseline: string;
    delta: string;
    category: string;
    deadlinePolicy: string;
  };
}

// ========== RUNTIME OUTPUT ==========

/**
 * This is what the composer outputs for consumption by:
 * - Intent Capture (controller)
 * - Blabber (style-only)
 * - Workflow Nudge Question creation
 */
export interface FlowConfiguration {
  flow: ConversationFlow;
  goalLenses: GoalLens[];  // Resolved lens definitions
  
  // Validation metadata
  isValid: boolean;
  validationErrors?: string[];
}
