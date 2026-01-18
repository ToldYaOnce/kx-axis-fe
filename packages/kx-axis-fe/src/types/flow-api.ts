/**
 * KxAxis Flow API Types
 * 
 * MATCHES BACKEND API EXACTLY - Updated 2026-01-14
 * Base: https://<api-gateway>/agent/flows
 * Auth: x-tenant-id header (or service key/JWT via gateway)
 */

// ========== CORE TYPES ==========

/**
 * Node requirements (what the node needs)
 */
export interface NodeRequires {
  facts?: string[];  // Required fact names (e.g., ["contact.email"])
  readiness?: Record<string, any>;  // Readiness requirements
}

/**
 * Node produces (what the node outputs)
 */
export interface NodeProduces {
  facts?: string[];  // Produced fact names
  readinessDelta?: Record<string, any>;  // Readiness changes
}

/**
 * Node in draft graph (matches backend Node type)
 */
export interface Node {
  id: string;  // Required - unique identifier
  type: string;  // Required - NodeKind (EXPLANATION, REFLECTIVE_QUESTION, etc.)
  title: string;  // Required - display name
  requires?: NodeRequires;  // Optional - prerequisites
  produces?: NodeProduces;  // Optional - outputs
  config?: Record<string, any>;  // Optional - type-specific configuration
}

/**
 * Edge between nodes
 */
export interface Edge {
  id: string;  // Required - unique identifier
  source: string;  // Required - source nodeId
  target: string;  // Required - target nodeId
  label?: string;  // Optional - edge label (e.g., "next")
}

/**
 * Draft Graph - the working copy of the flow
 */
export interface DraftGraph {
  // Execution metadata (added for deterministic controller)
  entryNodeIds?: string[];
  primaryGoal?: {
    type: 'GATE' | 'STATE';
    gate?: string;
    state?: string;
    description?: string;
  };
  gateDefinitions?: Record<string, {
    satisfiedBy: {
      metricsAll?: string[];
      metricsAny?: string[];
      statesAll?: string[];
    };
  }>;
  factAliases?: Record<string, string>;
  defaults?: {
    retryPolicy?: {
      maxAttempts: number;
      escalateOnFailure?: boolean;
      onExhaust?: string;
      cooldownTurns?: number;
      promptVariantStrategy?: string;
    };
  };
  _semantics?: Record<string, string>;
  
  // Core graph structure
  nodes: Node[];
  edges?: Edge[];  // Optional
}

/**
 * Lane definition
 */
export interface Lane {
  id: string;
  name?: string;
  order?: number;
}

/**
 * UI Layout - positions and visual metadata
 */
export interface UiLayout {
  nodePositions: Record<string, { x: number; y: number }>;
  laneAssignments: Record<string, string>;  // nodeId => laneId
  lanes?: Lane[];
}

/**
 * Draft - the current working version
 * NOTE: draftId is always "current"
 */
export interface Draft {
  flowId: string;
  draftId: "current";  // Always "current"
  updatedAt: string;   // ISO timestamp
  updatedBy?: string;
  sourceHash: string;  // SHA-256 hash for optimistic concurrency
  draftGraph: DraftGraph;
  uiLayout: UiLayout;
}

/**
 * Flow - the high-level flow entity
 */
export interface Flow {
  flowId: string;
  tenantId: string;
  name: string;
  description?: string;
  industry?: string;  // Industry (e.g., "Finance", "Healthcare") - frontend extension
  primaryGoal: string;
  createdAt: string;
  updatedAt: string;
  currentDraftId: "current";
  latestPublishedVersionId?: string;
}

/**
 * Version summary (in list)
 */
export interface VersionSummary {
  versionId: string;
  createdAt: string;
  publishedBy?: string;
  publishNote?: string;
  flowSignature: string;
}

/**
 * Compiled graph metadata
 */
export interface CompiledGraphMetadata {
  compiledAt: string;
  nodeCount: number;
  factCount: number;
}

/**
 * Compiled graph indices
 */
export interface CompiledGraphIndices {
  factProducers: Record<string, string[]>;  // factName => nodeIds[]
  nodesByType: Record<string, string[]>;    // nodeType => nodeIds[]
}

/**
 * Compiled graph (in published version)
 */
export interface CompiledGraph {
  nodes: Array<{
    id: string;
    type: string;
    title: string;
    requiresFacts: string[];  // Flat array in compiled graph
    producesFacts: string[];  // Flat array in compiled graph
    config: Record<string, any>;
  }>;
  edges: Edge[];
  indices: CompiledGraphIndices;
  metadata: CompiledGraphMetadata;
}

/**
 * Full published version
 */
export interface FlowVersion {
  flowId: string;
  versionId: string;
  createdAt: string;
  publishedBy?: string;
  publishNote?: string;
  compiledGraph: CompiledGraph;
  sourceDraftHash: string;
  flowSignature: string;
  validationReportSnapshot: ValidationReport;
}

// ========== VALIDATION TYPES ==========

export interface ValidationError {
  code: string;  // Error code (e.g., "DUPLICATE_NODE_ID")
  message: string;
  nodeId?: string;
  field?: string;
  severity: "error";  // Always "error" for errors
}

export interface ValidationWarning {
  code: string;  // Warning code (e.g., "NO_PRODUCES")
  message: string;
  nodeId?: string;
  context?: string;
  severity: "warning";  // Always "warning" for warnings
}

export interface ValidationStats {
  nodeCount: number;
  edgeCount: number;
  factCount: number;
  entryNodeCount: number;
}

export interface ValidationReport {
  ok: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

// ========== API REQUEST/RESPONSE TYPES ==========

/**
 * GET /agent/flows - List all flows for tenant
 */
export interface ListFlowsResponse {
  flows: FlowListItem[];
}

export interface FlowListItem {
  flowId: string;
  name: string;
  description?: string;
  industry?: string;
  primaryGoal: string;  // Flow-level primaryGoal is always a string (e.g., "BOOKING")
  status: 'DRAFT' | 'PUBLISHED';
  currentDraftId: 'current';
  currentDraftUpdatedAt: string;
  latestPublishedVersionId: string | null;
  latestPublishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * POST /agent/flows - Create a new flow
 * 
 * Can include full draftGraph to create flow + draft in one request
 */
export interface CreateFlowRequest {
  name: string;  // Required
  primaryGoal: string;  // Required - MUST be a string (e.g., "BOOKING"), NOT an object
  description?: string;  // Optional
  industry?: string;  // Optional - Industry classification (e.g., "Finance", "Healthcare")
  draftGraph?: DraftGraph;  // Optional - if provided, creates draft immediately (draftGraph.primaryGoal can be an object)
  editorState?: { uiLayout?: UiLayout };  // Optional - UI presentation state
  autoPublish?: boolean;  // Optional - if true, validate and publish immediately
}

export interface CreateFlowResponse {
  flowId: string;
  draftId: "current";
  createdAt: string;
  sourceHash?: string;  // Present if draftGraph was provided
  versionId?: string;  // Present if autoPublish=true
  validationReport?: ValidateFlowResponse;  // Present if autoPublish=true
}

/**
 * GET /agent/flows?flowId={flowId} - Get flow + draft/version
 * Additional query params:
 * - include=versions : include versions list
 * - versionId=ver_xxx : return specific version instead of draft
 */
export interface GetFlowOptions {
  includeVersions?: boolean;
  versionId?: string;
}

export interface GetFlowResponse {
  flow: Flow;
  draft?: Draft;  // Present if no versionId specified
  version?: FlowVersion;  // Present if versionId specified
  versions?: VersionSummary[];  // Present if include=versions
}

/**
 * PATCH /agent/flows?flowId={flowId} - Update metadata OR replace draft
 * 
 * OVERLOADED ENDPOINT:
 * - If body contains draftGraph => Replace Draft
 * - If body contains only name/description/primaryGoal => Update Metadata
 */
export interface PatchFlowMetadataRequest {
  name?: string;
  description?: string;
  primaryGoal?: string;
  industry?: string;  // Industry classification
}

export interface ReplaceDraftRequest {
  draftGraph: DraftGraph;  // Required
  uiLayout?: UiLayout;  // Optional
  updatedBy?: string;  // Optional
}

export interface PatchFlowMetadataResponse {
  flow: Flow;
}

export interface ReplaceDraftResponse {
  draftId: "current";
  updatedAt: string;
  sourceHash: string;
}

/**
 * PATCH /agent/flows?flowId={flowId}&action=validate - Validate draft
 */
export interface ValidateFlowResponse {
  ok: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

/**
 * PATCH /agent/flows?flowId={flowId}&action=publish - Publish draft
 */
export interface PublishFlowRequest {
  publishNote?: string;
  publishedBy?: string;  // Optional - user who published
  sourceDraftHash?: string;  // Optional for optimistic concurrency check
}

export interface PublishFlowResponse {
  versionId: string;
  createdAt: string;
  flowSignature: string;
  validationReport: ValidationReport;
}

// ========== ERROR TYPES ==========

export interface FlowApiError {
  status: number;
  code: string;
  message: string;
  details?: any;
}
