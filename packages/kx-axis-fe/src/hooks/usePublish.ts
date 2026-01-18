/**
 * usePublish - Publish current draft as new version
 * 
 * REQUIRES sourceDraftHash for optimistic concurrency control
 */

import { useState, useCallback } from 'react';
import { flowAPI } from '../api/flowClient';
import type { PublishFlowResponse, ValidationReport, FlowApiError } from '../types/flow-api';

export interface UsePublishResult {
  publish: (publishNote: string | undefined, sourceDraftHash: string) => Promise<PublishFlowResponse | null>;
  publishResult: PublishFlowResponse | null;
  isPublishing: boolean;
  error: FlowApiError | null;
  clearResult: () => void;
}

export function usePublish(flowId: string | null): UsePublishResult {
  const [publishResult, setPublishResult] = useState<PublishFlowResponse | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [error, setError] = useState<FlowApiError | null>(null);

  const publish = useCallback(
    async (publishNote: string | undefined, sourceDraftHash: string): Promise<PublishFlowResponse | null> => {
      if (!flowId) return null;

      setIsPublishing(true);
      setError(null);

      try {
        const response = await flowAPI.publishFlow(flowId, {
          publishNote,
          sourceDraftHash,  // Required!
        });
        
        setPublishResult(response);
        return response;
      } catch (err) {
        const apiError = err as FlowApiError;
        setError(apiError);
        
        // Special handling for 409 conflict
        if (apiError.status === 409) {
          console.error('Draft conflict: sourceHash mismatch. Reload draft and try again.');
        }
        
        return null;
      } finally {
        setIsPublishing(false);
      }
    },
    [flowId]
  );

  const clearResult = useCallback(() => {
    setPublishResult(null);
    setError(null);
  }, []);

  return {
    publish,
    publishResult,
    isPublishing,
    error,
    clearResult,
  };
}
