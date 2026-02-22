import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { KxAxisComposer } from '../components/KxAxisComposer';
import { ToastProvider } from '../context/ToastContext';
import type { ConversationFlow, GoalLensRegistry } from '../types';

export interface FlowDesignerRouteProps {
  /**
   * Base path for flows (e.g., '/flows')
   * Used for navigation to simulations
   */
  basePath?: string;
  
  // REMOVED: showBackButton and onBack props
  // Navigation to flows list now handled by clicking "Flows" tab in AppHeader
}

/**
 * Route component for Flow Designer (Design Mode)
 * Loads flow by ID from URL params
 * Navigation back to flows list is handled by the "Flows" tab in AppHeader
 */
export const FlowDesignerRoute: React.FC<FlowDesignerRouteProps> = ({ 
  basePath = '/flows',
}) => {
  const { flowId, versionId } = useParams<{ flowId: string; versionId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSimulations = () => {
    navigate(`${basePath}/${flowId}/simulations`);
  };

  if (!flowId) {
    return (
      <Box p={3}>
        <p>Error: No flow ID provided</p>
      </Box>
    );
  }

  // Placeholder flow - will be replaced by API data
  const placeholderFlow: ConversationFlow = {
    id: flowId,
    name: 'Loading...',
    description: '',
    nodes: [],
    activeGoalLenses: [],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  // Empty registry
  const emptyRegistry: GoalLensRegistry = { lenses: [] };

  return (
    <ToastProvider>
      <Box 
        data-kx="flow-designer-wrapper"
        sx={{ 
          height: '100%',
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* BACK BUTTON REMOVED - Navigation handled by Flows tab in AppHeader */}
        <Box sx={{ flex: '1 1 auto', overflow: 'hidden', minHeight: 0, height: '100%' }}>
          <KxAxisComposer 
            key={`designer-${flowId}-${location.pathname}`}
            initialConfig={placeholderFlow}
            goalLensRegistry={emptyRegistry}
            flowId={flowId}
            enableApiIntegration={true}
            autosaveEnabled={true}
            disableThemeProvider={true}
            onSimulations={handleSimulations}
          />
        </Box>
      </Box>
    </ToastProvider>
  );
};

