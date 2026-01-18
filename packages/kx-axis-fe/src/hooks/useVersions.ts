/**
 * useVersions - Manage flow version history
 * 
 * Uses includeVersions query param and versionId query param
 */

import { useState, useCallback } from 'react';
import { flowAPI } from '../api/flowClient';
import type { VersionSummary, FlowVersion, FlowApiError } from '../types/flow-api';

export interface UseVersionsResult {
  versions: VersionSummary[];
  currentVersion: FlowVersion | null;
  isLoading: boolean;
  error: FlowApiError | null;
  loadVersion: (versionId: string) => Promise<void>;
  clearVersion: () => void;
}

export function useVersions(flowId: string | null): UseVersionsResult {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [currentVersion, setCurrentVersion] = useState<FlowVersion | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FlowApiError | null>(null);

  /**
   * Load a specific version
   * Uses GET /agent/flows?flowId={flowId}&versionId=xxx
   */
  const loadVersion = useCallback(
    async (versionId: string) => {
      if (!flowId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await flowAPI.getFlow(flowId, { versionId });
        
        if (response.version) {
          setCurrentVersion(response.version);
        }
      } catch (err) {
        setError(err as FlowApiError);
      } finally {
        setIsLoading(false);
      }
    },
    [flowId]
  );

  /**
   * Clear currently loaded version (go back to draft)
   */
  const clearVersion = useCallback(() => {
    setCurrentVersion(null);
  }, []);

  return {
    versions,
    currentVersion,
    isLoading,
    error,
    loadVersion,
    clearVersion,
  };
}
