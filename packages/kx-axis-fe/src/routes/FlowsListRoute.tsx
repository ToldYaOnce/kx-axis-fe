import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FlowsList } from '../components/FlowsList/FlowsList';
import { ToastProvider } from '../context/ToastContext';

export interface FlowsListRouteProps {
  /**
   * Base path for flows (e.g., '/flows')
   * Used to construct navigation URLs
   */
  basePath?: string;
}

/**
 * Route component for Flows List
 * Handles navigation to flow details
 */
export const FlowsListRoute: React.FC<FlowsListRouteProps> = ({ 
  basePath = '/flows' 
}) => {
  const navigate = useNavigate();

  const handleOpenFlow = (flowId: string, versionId?: string) => {
    if (versionId) {
      navigate(`${basePath}/${flowId}/versions/${versionId}`);
    } else {
      navigate(`${basePath}/${flowId}`);
    }
  };

  return (
    <ToastProvider>
      <FlowsList onOpenFlow={handleOpenFlow} />
    </ToastProvider>
  );
};

