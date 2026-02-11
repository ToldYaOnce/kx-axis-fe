import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, IconButton, Tooltip, CircularProgress, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ExecutionMode } from '../components/Simulator/ExecutionMode';
import { SimulatorProvider } from '../context/SimulatorContext';
import { ToastProvider } from '../context/ToastContext';
import { simulatorAPI } from '../api/simulatorClient';

export interface FlowSimulatorRouteProps {
  /**
   * Base path for flows (e.g., '/flows')
   * Used for back navigation
   */
  basePath?: string;
  
  /**
   * Show back button to navigate back to designer
   * @default true
   */
  showBackButton?: boolean;
  
  /**
   * Custom back button handler
   * If not provided, navigates to designer
   */
  onBack?: () => void;
}

/**
 * Route component for Flow Simulator (Execution Mode)
 * Loads flow by ID from URL params and runs simulations
 */
export const FlowSimulatorRoute: React.FC<FlowSimulatorRouteProps> = ({ 
  basePath = '/flows',
  showBackButton = true,
  onBack,
}) => {
  const { flowId: flowIdParam, simulationId } = useParams<{ flowId?: string; simulationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [flowId, setFlowId] = useState<string | null>(flowIdParam || null);
  const [loading, setLoading] = useState(!flowIdParam);
  const [error, setError] = useState<string | null>(null);
  
  // Extract simulation data from navigation state (if navigating from "Start" button)
  const simulationState = (location.state as any)?.simulationData;
  const channel = (location.state as any)?.channel;
  const leadState = (location.state as any)?.leadState;
  
  console.log('📍 FlowSimulatorRoute - location.state:', location.state);
  console.log('📍 Extracted data:', { simulationState, channel, leadState });

  // If flowId not in URL, fetch simulation to get flowId
  useEffect(() => {
    if (!flowIdParam && simulationId) {
      const fetchSimulation = async () => {
        try {
          setLoading(true);
          const simulation = await simulatorAPI.getSimulation(simulationId);
          setFlowId(simulation.flowId);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load simulation');
        } finally {
          setLoading(false);
        }
      };
      
      fetchSimulation();
    }
  }, [flowIdParam, simulationId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Navigate back to simulations list
      if (basePath === '/simulations') {
        navigate('/simulations');
      } else {
        navigate(`${basePath}/${flowId}/simulations`);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!flowId) {
    return (
      <Box p={3}>
        <Alert severity="error">Error: No flow ID provided</Alert>
      </Box>
    );
  }

  return (
    <ToastProvider>
      <SimulatorProvider 
        flowId={flowId} 
        simulationId={simulationId}
        initialSimulationData={simulationState}
        initialChannel={channel}
        initialLeadState={leadState}
      >
        <Box sx={{ 
          flex: 1,
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {showBackButton && (
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
              <Tooltip title="Back to Simulations">
                <IconButton onClick={handleBack}>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <ExecutionMode />
          </Box>
        </Box>
      </SimulatorProvider>
    </ToastProvider>
  );
};





