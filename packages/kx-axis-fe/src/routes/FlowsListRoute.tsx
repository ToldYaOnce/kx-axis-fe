import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlowsList } from '../components/FlowsList/FlowsList';
import { ToastProvider, useToast } from '../context/ToastContext';
import { flowAPI } from '../api/flowClient';

export interface FlowsListRouteProps {
  /**
   * Base path for flows (e.g., '/flows')
   * Used to construct navigation URLs
   */
  basePath?: string;
}

/**
 * Inner component that uses ToastContext
 */
const FlowsListContent: React.FC<{ basePath: string }> = ({ basePath }) => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const handleOpenFlow = (flowId: string, versionId?: string) => {
    if (versionId) {
      navigate(`${basePath}/${flowId}/versions/${versionId}`);
    } else {
      navigate(`${basePath}/${flowId}`);
    }
  };

  const handleCreateNew = async () => {
    if (isCreating) return; // Prevent double-clicks

    setIsCreating(true);
    try {
      // Create a new flow via API
      const response = await flowAPI.createFlow({
        name: 'Untitled Flow',
        primaryGoal: 'BOOKING', // Required field - standard placeholder value
        description: '',
      });

      // Navigate to the newly created flow
      navigate(`${basePath}/${response.flowId}`);
    } catch (err: any) {
      console.error('Failed to create flow:', err);
      showError(err.message || 'Failed to create new flow');
      setIsCreating(false);
    }
  };

  return (
    <FlowsList 
      onOpenFlow={handleOpenFlow} 
      onCreateNew={handleCreateNew}
    />
  );
};

/**
 * Route component for Flows List
 * Handles navigation to flow details and creation
 */
export const FlowsListRoute: React.FC<FlowsListRouteProps> = ({ 
  basePath = '/flows' 
}) => {
  return (
    <ToastProvider>
      <FlowsListContent basePath={basePath} />
    </ToastProvider>
  );
};

