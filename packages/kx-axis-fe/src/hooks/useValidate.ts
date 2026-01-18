/**
 * useValidate - Validate current flow draft
 * 
 * Matches backend validation response shape
 */

import { useState, useCallback } from 'react';
import { flowAPI } from '../api/flowClient';
import type { ValidationReport, FlowApiError, ValidateFlowResponse } from '../types/flow-api';

export interface UseValidateResult {
  validate: () => Promise<ValidateFlowResponse | null>;
  report: ValidateFlowResponse | null;
  isValidating: boolean;
  error: FlowApiError | null;
  clearReport: () => void;
}

export function useValidate(flowId: string | null): UseValidateResult {
  const [report, setReport] = useState<ValidateFlowResponse | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<FlowApiError | null>(null);

  const validate = useCallback(async (): Promise<ValidateFlowResponse | null> => {
    if (!flowId) return null;

    setIsValidating(true);
    setError(null);

    try {
      const response = await flowAPI.validateDraft(flowId);
      setReport(response);
      return response;
    } catch (err) {
      const apiError = err as FlowApiError;
      setError(apiError);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [flowId]);

  const clearReport = useCallback(() => {
    setReport(null);
    setError(null);
  }, []);

  return {
    validate,
    report,
    isValidating,
    error,
    clearReport,
  };
}
