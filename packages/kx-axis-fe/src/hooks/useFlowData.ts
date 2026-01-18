/**
 * useFlowData - Load and manage flow + draft data
 * 
 * Matches backend API exactly
 */

import { useState, useEffect, useCallback } from 'react';
import { flowAPI } from '../api/flowClient';
import type { Flow, Draft, FlowVersion, VersionSummary, FlowApiError } from '../types/flow-api';

export interface UseFlowDataOptions {
  includeVersions?: boolean;
}

export interface UseFlowDataResult {
  flow: Flow | null;
  draft: Draft | null;
  versions: VersionSummary[];
  isLoading: boolean;
  error: FlowApiError | null;
  refetch: () => Promise<void>;
}

export function useFlowData(flowId: string | null, options?: UseFlowDataOptions): UseFlowDataResult {
  const [flow, setFlow] = useState<Flow | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FlowApiError | null>(null);

  const fetchFlow = useCallback(async () => {
    if (!flowId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await flowAPI.getFlow(flowId, {
        includeVersions: options?.includeVersions,
      });
      
      setFlow(response.flow);
      setDraft(response.draft || null);
      setVersions(response.versions || []);
    } catch (err) {
      setError(err as FlowApiError);
    } finally {
      setIsLoading(false);
    }
  }, [flowId, options?.includeVersions]);

  useEffect(() => {
    fetchFlow();
  }, [fetchFlow]);

  return {
    flow,
    draft,
    versions,
    isLoading,
    error,
    refetch: fetchFlow,
  };
}
