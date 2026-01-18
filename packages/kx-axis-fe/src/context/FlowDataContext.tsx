/**
 * FlowDataContext - Manages Flow API integration
 * 
 * MATCHES BACKEND API EXACTLY
 * Wraps FlowContext and adds:
 * - Flow loading from API
 * - Draft autosave with sourceHash tracking
 * - Validation
 * - Publishing with optimistic concurrency
 * - Version management
 */

import React, { createContext, useContext, useEffect, useCallback, ReactNode, useState, useRef } from 'react';
import { useFlowData } from '../hooks/useFlowData';
import { useDraftSave, SaveStatus } from '../hooks/useDraftSave';
import { useValidate } from '../hooks/useValidate';
import { usePublish } from '../hooks/usePublish';
import { useVersions } from '../hooks/useVersions';
import type { ConversationFlow } from '../types';
import type { 
  DraftGraph, 
  UiLayout, 
  ValidateFlowResponse,
  PublishFlowResponse, 
  VersionSummary,
  FlowVersion, 
  FlowApiError 
} from '../types/flow-api';

export interface FlowDataContextValue {
  // Loading state
  flowId: string | null;
  isLoading: boolean;
  error: FlowApiError | null;
  
  // Save state
  saveStatus: SaveStatus;
  saveError: FlowApiError | null;
  lastSavedAt: Date | null;
  currentSourceHash: string | null;  // Track sourceHash for publishing
  
  // Validation
  validationReport: ValidateFlowResponse | null;
  isValidating: boolean;
  validateFlow: () => Promise<void>;
  clearValidation: () => void;
  
  // Publishing (requires sourceHash!)
  publishResult: PublishFlowResponse | null;
  isPublishing: boolean;
  publishError: FlowApiError | null;
  publishFlow: (note?: string) => Promise<void>;
  
  // Versions
  versions: VersionSummary[];
  currentVersion: FlowVersion | null;
  loadVersion: (versionId: string) => Promise<void>;
  backToDraft: () => void;
  
  // View mode
  isReadOnly: boolean;  // True when viewing a published version
  
  // Manual refresh
  refetch: () => Promise<void>;
}

const FlowDataContext = createContext<FlowDataContextValue | undefined>(undefined);

export interface FlowDataProviderProps {
  children: ReactNode;
  flowId: string | null;
  
  // Callbacks
  onFlowLoaded?: (flow: ConversationFlow) => void;
  onFlowChanged?: (flow: ConversationFlow) => void;
  onSaveSuccess?: () => void;
  onValidationComplete?: (report: ValidateFlowResponse) => void;
  onPublishSuccess?: (result: PublishFlowResponse) => void;
  
  // Config
  autosaveEnabled?: boolean;
  autosaveDelay?: number;
}

export const FlowDataProvider: React.FC<FlowDataProviderProps> = ({
  children,
  flowId,
  onFlowLoaded,
  onFlowChanged,
  onSaveSuccess,
  onValidationComplete,
  onPublishSuccess,
  autosaveEnabled = true,
  autosaveDelay = 1000,
}) => {
  const [currentFlow, setCurrentFlow] = useState<ConversationFlow | null>(null);
  const isInitialLoadRef = useRef(true);
  
  // Load flow data (with versions list)
  const { flow, draft, versions, isLoading, error, refetch } = useFlowData(flowId, {
    includeVersions: true,
  });
  
  // Temporary: Store industry in localStorage until backend fully supports it
  const getStoredIndustry = (flowId: string): string | null => {
    try {
      return localStorage.getItem(`flow_industry_${flowId}`);
    } catch {
      return null;
    }
  };
  
  const storeIndustry = (flowId: string, industry: string) => {
    try {
      localStorage.setItem(`flow_industry_${flowId}`, industry);
    } catch {
      // Ignore storage errors
    }
  };
  
  // Draft save (tracks sourceHash)
  const {
    saveDraft,
    saveStatus,
    saveError,
    lastSavedAt,
    currentSourceHash,
  } = useDraftSave({
    flowId,
    autosaveDelay,
    onSaveSuccess,
  });
  
  // Validation
  const {
    validate,
    report: validationReport,
    isValidating,
    clearReport: clearValidation,
  } = useValidate(flowId);
  
  // Publishing
  const {
    publish,
    publishResult,
    isPublishing,
    error: publishError,
    clearResult: clearPublishResult,
  } = usePublish(flowId);
  
  // Versions
  const {
    versions: _,  // We get versions from useFlowData
    currentVersion,
    loadVersion,
    clearVersion,
  } = useVersions(flowId);
  
  // Determine if we're in read-only mode
  const isReadOnly = currentVersion !== null;
  
  // Notify parent when flow is loaded
  useEffect(() => {
    if (flow && draft) {
      // Convert Draft to ConversationFlow for backward compat
      // Try to get industry from: 1) backend, 2) localStorage, 3) default to 'Other'
      const storedIndustry = getStoredIndustry(flow.flowId);
      const industry = flow.industry || storedIndustry || 'Other';
      
      console.log('🏭 Industry Resolution:', {
        flowId: flow.flowId,
        fromBackend: flow.industry,
        fromLocalStorage: storedIndustry,
        finalIndustry: industry,
      });
      
      // Load UI layout from localStorage
      let uiLayout: { nodePositions: Record<string, { x: number; y: number }>; laneAssignments: Record<string, string> } | null = null;
      if (flowId) {
        try {
          const storedLayout = localStorage.getItem(`flow-${flowId}-layout`);
          if (storedLayout) {
            uiLayout = JSON.parse(storedLayout);
            console.log('📐 Loaded UI layout from localStorage:', uiLayout);
          }
        } catch (error) {
          console.warn('Failed to load layout from localStorage:', error);
        }
      }
      
      const conversationFlow: ConversationFlow = {
        id: flow.flowId,
        name: flow.name,
        description: flow.description,
        industry,  // Include industry with fallback chain
        nodes: draft.draftGraph.nodes.map((node) => {
          // Apply UI layout if available
          const position = uiLayout?.nodePositions?.[node.id];
          const lane = uiLayout?.laneAssignments?.[node.id];
          
          return {
            id: node.id,
            type: node.type as any,  // Map backend 'type' to frontend 'type' (NOT 'kind')
            title: node.title,
            // Convert backend nested structure to frontend flat arrays
            requires: node.requires?.facts || [],
            produces: node.produces?.facts || [],
            // Apply UI positioning from localStorage
            ...(position && lane ? {
              ui: {
                x: position.x,
                y: position.y,
                lane: lane as any,
              }
            } : {}),
            // Copy over any config data that should be in the node
            ...(node.config?.satisfies ? { satisfies: node.config.satisfies } : {}),
            ...(node.config?.goalGapTracker ? { goalGapTracker: node.config.goalGapTracker } : {}),
            ...(node.config?.deadlineEnforcement ? { deadlineEnforcement: node.config.deadlineEnforcement } : {}),
            ...(node.config?.eligibility ? { eligibility: node.config.eligibility } : {}),
          };
        }),
        activeGoalLenses: [],
        metadata: {
          createdAt: flow.createdAt,
          updatedAt: draft.updatedAt,
        },
      };
      
      setCurrentFlow(conversationFlow);
      
      if (isInitialLoadRef.current) {
        onFlowLoaded?.(conversationFlow);
        // Note: Don't set isInitialLoadRef to false yet - let autosave effect do it
      }
    }
  }, [flow, draft, onFlowLoaded, flowId]);
  
  // Autosave when flow changes (but not on initial load or when viewing a version)
  useEffect(() => {
    // Skip autosave if disabled, no flow loaded, viewing a version, or on initial load
    if (!autosaveEnabled || !currentFlow || currentVersion) {
      return;
    }
    
    // Skip autosave on initial load, then mark as no longer initial
    if (isInitialLoadRef.current) {
      console.log('⏭️  Skipping autosave on initial load');
      isInitialLoadRef.current = false;
      return;
    }
    
    // Convert ConversationFlow to DraftGraph
    // Include all normalization fields for deterministic controller
    const draftGraph: DraftGraph = {
      // ========== EXECUTION METADATA ==========
      entryNodeIds: (currentFlow as any).entryNodeIds || [currentFlow.nodes[0]?.id],
      
      primaryGoal: (currentFlow as any).primaryGoal || {
        type: 'GATE',
        gate: 'BOOKING',
        description: 'User has booked a consultation',
      },
      
      gateDefinitions: (currentFlow as any).gateDefinitions || {
        CONTACT: {
          satisfiedBy: {
            metricsAny: ['contact_email', 'contact_phone'],
          },
        },
        BOOKING: {
          satisfiedBy: {
            metricsAll: ['booking_date', 'booking_type'],
          },
        },
        HANDOFF: {
          satisfiedBy: {
            statesAll: ['HANDOFF_COMPLETE'],
          },
        },
      },
      
      factAliases: (currentFlow as any).factAliases || {
        target: 'goal_target',
        baseline: 'goal_baseline',
        delta: 'goal_delta',
        category: 'goal_category',
        email: 'contact_email',
        phone: 'contact_phone',
      },
      
      defaults: (currentFlow as any).defaults || {
        retryPolicy: {
          maxAttempts: 2,
          onExhaust: "BROADEN",
          cooldownTurns: 0,
          promptVariantStrategy: "ROTATE"
        }
      },
      
      _semantics: (currentFlow as any)._semantics || {
        retryPolicy: "RetryPolicy counts attempts to achieve a node's objective across turns. Attempts may re-ask/rephrase the node prompt without re-executing side effects. runPolicy.maxExecutions remains the hard cap for executing the node."
      },
      
      // ========== NODES ==========
      nodes: currentFlow.nodes.map((node) => {
        const nodeSatisfies = (node as any).satisfies;
        const cleanedSatisfies = nodeSatisfies ? {
          ...(nodeSatisfies.gates && { gates: nodeSatisfies.gates }),
          ...(nodeSatisfies.states && { states: nodeSatisfies.states }),
          // Explicitly exclude metrics (Option B semantics)
        } : undefined;
        
        const nodeRunPolicy = (node as any).runPolicy;
        const nodeRetryPolicy = (node as any).retryPolicy;
        
        // Build config object with all extra fields
        const config: Record<string, any> = {};
        
        if ((node as any).purpose) config.purpose = (node as any).purpose;
        if ((node as any).importance) config.importance = (node as any).importance;
        if (!nodeRunPolicy && (node as any).maxRuns) config.maxRuns = (node as any).maxRuns;
        if (nodeRunPolicy) config.runPolicy = nodeRunPolicy;
        if (nodeRetryPolicy) config.retryPolicy = nodeRetryPolicy;
        if ((node as any).requiresStates) config.requiresStates = (node as any).requiresStates;
        if (cleanedSatisfies) config.satisfies = cleanedSatisfies;
        if ((node as any).eligibility) config.eligibility = (node as any).eligibility;
        if ((node as any).allowSupportiveLine) config.allowSupportiveLine = (node as any).allowSupportiveLine;
        if ((node as any).goalGapTracker) config.goalGapTracker = (node as any).goalGapTracker;
        if ((node as any).deadlineEnforcement) config.deadlineEnforcement = (node as any).deadlineEnforcement;
        if ((node as any).priority) config.priority = (node as any).priority;
        if ((node as any).execution) config.execution = (node as any).execution;
        if ((node as any).goalLensId) config.goalLensId = (node as any).goalLensId;
        
        return {
          id: node.id,
          type: node.type,
          title: node.title,
          // ALWAYS include requires, produces, config (even if empty)
          requires: {
            facts: node.requires && node.requires.length > 0 ? node.requires : []
          },
          produces: {
            facts: node.produces && node.produces.length > 0 ? node.produces : []
          },
          config,  // Always include config (even if empty object)
        };
      }),
      edges: [],
    };
    
    // Store UI layout in localStorage (backend doesn't want it)
    const uiLayout = {
      nodePositions: {} as Record<string, { x: number; y: number }>,
      laneAssignments: {} as Record<string, string>,
    };
    
    currentFlow.nodes.forEach((node) => {
      if (node.ui) {
        uiLayout.nodePositions[node.id] = { x: node.ui.x, y: node.ui.y };
        uiLayout.laneAssignments[node.id] = node.ui.lane;
      }
    });
    
    // Save layout to localStorage (client-side only)
    if (flowId) {
      try {
        localStorage.setItem(`flow-${flowId}-layout`, JSON.stringify(uiLayout));
      } catch (error) {
        console.warn('Failed to save layout to localStorage:', error);
      }
    }
    
    // Debug: Log what we're about to save
    console.log('🔄 AUTOSAVE TRIGGERED - Draft Graph (correct structure):', {
      entryNodeIds: draftGraph.entryNodeIds,
      nodeCount: draftGraph.nodes.length,
      firstNode: draftGraph.nodes[0],
      nodeStructureCheck: {
        hasRequiresFacts: !!draftGraph.nodes[0]?.requires?.facts,
        hasProducesFacts: !!draftGraph.nodes[0]?.produces?.facts,
        hasConfig: !!draftGraph.nodes[0]?.config,
      }
    });
    
    // ❌ DO NOT send uiLayout to backend!
    saveDraft(draftGraph);
  }, [currentFlow, autosaveEnabled, currentVersion, saveDraft]);
  
  // Expose flow change handler & store industry
  useEffect(() => {
    if (currentFlow && !isInitialLoadRef.current) {
      onFlowChanged?.(currentFlow);
      // Store industry in localStorage for persistence (temporary until backend supports it)
      if (flowId && currentFlow.industry) {
        storeIndustry(flowId, currentFlow.industry);
      }
    }
  }, [currentFlow, onFlowChanged, flowId]);
  
  /**
   * Validate with callback
   */
  const validateFlow = useCallback(async () => {
    const report = await validate();
    if (report && onValidationComplete) {
      onValidationComplete(report);
    }
  }, [validate, onValidationComplete]);
  
  /**
   * Publish with callback
   * REQUIRES currentSourceHash!
   */
  const publishFlow = useCallback(
    async (note?: string) => {
      if (!currentSourceHash) {
        console.error('Cannot publish: no sourceHash available');
        return;
      }
      
      const result = await publish(note, currentSourceHash);
      if (result && onPublishSuccess) {
        onPublishSuccess(result);
        
        // Refetch to update latestPublishedVersionId and versions list
        await refetch();
      }
    },
    [publish, currentSourceHash, onPublishSuccess, refetch]
  );
  
  /**
   * Back to draft mode
   */
  const backToDraft = useCallback(() => {
    clearVersion();
    clearValidation();
    clearPublishResult();
  }, [clearVersion, clearValidation, clearPublishResult]);
  
  const value: FlowDataContextValue = {
    flowId,
    isLoading,
    error,
    saveStatus,
    saveError,
    lastSavedAt,
    currentSourceHash,
    validationReport,
    isValidating,
    validateFlow,
    clearValidation,
    publishResult,
    isPublishing,
    publishError,
    publishFlow,
    versions,
    currentVersion,
    loadVersion,
    backToDraft,
    isReadOnly,
    refetch,
  };
  
  return (
    <FlowDataContext.Provider value={value}>
      {children}
    </FlowDataContext.Provider>
  );
};

export const useFlowDataContext = (): FlowDataContextValue => {
  const context = useContext(FlowDataContext);
  if (!context) {
    throw new Error('useFlowDataContext must be used within FlowDataProvider');
  }
  return context;
};

/**
 * Optional version - returns null if provider is not present
 * Use this when API integration is optional
 */
export const useOptionalFlowDataContext = (): FlowDataContextValue | null => {
  return useContext(FlowDataContext);
};
