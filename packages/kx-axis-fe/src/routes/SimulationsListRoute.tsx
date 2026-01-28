import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, IconButton, Tooltip, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { SimulationsList } from '../components/Simulator/SimulationsList';
import { ToastProvider } from '../context/ToastContext';
import { flowAPI } from '../api/flowClient';

export interface SimulationsListRouteProps {
  /**
   * Base path for flows (e.g., '/flows')
   */
  basePath?: string;
  
  /**
   * Show back button to navigate to flow designer
   * @default true
   */
  showBackButton?: boolean;
  
  /**
   * Custom back button handler
   */
  onBack?: () => void;
}

/**
 * Route component for Simulations List
 * Shows all simulations for a specific flow
 */
export const SimulationsListRoute: React.FC<SimulationsListRouteProps> = ({ 
  basePath = '/flows',
  showBackButton = true,
  onBack,
}) => {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  const [flowName, setFlowName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load flow name
  useEffect(() => {
    if (!flowId) return;
    
    const loadFlow = async () => {
      try {
        const response = await flowAPI.getFlow(flowId);
        setFlowName(response.flow.name);
      } catch (error) {
        console.error('Failed to load flow:', error);
        setFlowName('Unknown Flow');
      } finally {
        setIsLoading(false);
      }
    };

    loadFlow();
  }, [flowId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(`${basePath}/${flowId}`);
    }
  };

  if (!flowId) {
    return (
      <Box p={3}>
        <p>Error: No flow ID provided</p>
      </Box>
    );
  }

  return (
    <ToastProvider>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {showBackButton && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Back to Designer">
              <IconButton onClick={handleBack}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : (
            <SimulationsList 
              flowId={flowId} 
              flowName={flowName}
              basePath={basePath}
            />
          )}
        </Box>
      </Box>
    </ToastProvider>
  );
};

