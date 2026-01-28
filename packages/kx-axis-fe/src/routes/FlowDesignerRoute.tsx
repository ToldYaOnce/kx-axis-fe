import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, IconButton, Tooltip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { KxAxisComposer } from '../components/KxAxisComposer';
import { ToastProvider } from '../context/ToastContext';
import type { ConversationFlow, GoalLensRegistry } from '../types';

export interface FlowDesignerRouteProps {
  /**
   * Base path for flows (e.g., '/flows')
   * Used for back navigation
   */
  basePath?: string;
  
  /**
   * Show back button to navigate to flows list
   * @default true
   */
  showBackButton?: boolean;
  
  /**
   * Custom back button handler
   * If not provided, navigates to basePath
   */
  onBack?: () => void;
}

/**
 * Route component for Flow Designer (Design Mode)
 * Loads flow by ID from URL params
 */
export const FlowDesignerRoute: React.FC<FlowDesignerRouteProps> = ({ 
  basePath = '/flows',
  showBackButton = true,
  onBack,
}) => {
  const { flowId, versionId } = useParams<{ flowId: string; versionId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(basePath);
    }
  };

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
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {showBackButton && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tooltip title="Back to Flows List">
              <IconButton onClick={handleBack}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
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

