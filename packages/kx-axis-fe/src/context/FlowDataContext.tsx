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
      
      const conversationFlow: ConversationFlow = {
        id: flow.flowId,
        name: flow.name,
        description: flow.description,
        industry,  // Include industry with fallback chain
        nodes: draft.draftGraph.nodes.map((node) => ({
          id: node.id,
          kind: node.type as any,  // Map backend 'type' to frontend 'kind'
          title: node.title,
          // Convert backend nested structure to frontend flat arrays
          requires: node.requires?.facts || [],
          produces: node.produces?.facts || [],
          // Note: uiLayout is separate in backend
        })),
        activeGoalLenses: [],
        metadata: {
          createdAt: flow.createdAt,
          updatedAt: draft.updatedAt,
        },
      };
      
      setCurrentFlow(conversationFlow);
      
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        onFlowLoaded?.(conversationFlow);
      }
    }
  }, [flow, draft, onFlowLoaded]);
  
  // Autosave when flow changes (but not on initial load or when viewing a version)
  useEffect(() => {
    if (!autosaveEnabled || !currentFlow || isInitialLoadRef.current || currentVersion) {
      return;
    }
    
    // Convert ConversationFlow to DraftGraph
    const draftGraph: DraftGraph = {
      nodes: currentFlow.nodes.map((node) => ({
        id: node.id,
        type: node.kind,  // Map frontend 'kind' to backend 'type'
        title: node.title,
        // Convert frontend flat arrays to backend nested structure
        requires: node.requires && node.requires.length > 0 
          ? { facts: node.requires }
          : undefined,
        produces: node.produces && node.produces.length > 0
          ? { facts: node.produces }
          : undefined,
        config: {},  // TODO: map node config
      })),
      edges: [],  // TODO: extract edges from nodes
    };
    
    const uiLayout: UiLayout = {
      nodePositions: {},
      laneAssignments: {},
    };
    
    // Extract UI layout from nodes
    currentFlow.nodes.forEach((node) => {
      if (node.ui) {
        uiLayout.nodePositions[node.id] = { x: node.ui.x, y: node.ui.y };
        uiLayout.laneAssignments[node.id] = node.ui.lane;
      }
    });
    
    saveDraft(draftGraph, uiLayout);
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
