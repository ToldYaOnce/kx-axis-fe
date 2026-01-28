/**
 * Scenario Bar - Top control bar for Execution Mode
 */

import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useSimulator } from '../../context/SimulatorContext';
import { useToast } from '../../context/ToastContext';

export const ScenarioBar: React.FC = () => {
  const { showError, showConfirm } = useToast();
  const { currentRun, flow, isLoadingFlow, reset } = useSimulator();
  
  // Debug: log flow state
  useEffect(() => {
    console.log('🎯 ScenarioBar: flow state changed:', {
      hasFlow: !!flow,
      flowName: flow?.name,
      nodeCount: flow?.nodes?.length,
      isLoadingFlow,
    });
  }, [flow, isLoadingFlow]);

  const handleReset = async () => {
    const confirmed = await showConfirm(
      'Reset simulation? This will clear all progress.',
      'Confirm Reset'
    );
    if (confirmed) {
      reset();
    }
  };

  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        px: 3,
        py: 2,
        backgroundColor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {/* Mode Indicator */}
      <Chip
        label="EXECUTION MODE"
        color="secondary"
        size="small"
        sx={{ fontWeight: 700, letterSpacing: 0.5 }}
      />

      {/* Current Run Info */}
      {currentRun ? (
        <>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {currentRun.flowName}
          </Typography>
          <Chip
            label={currentRun.scenarioContext.channel}
            size="small"
            variant="outlined"
          />
          <Chip
            label={currentRun.scenarioContext.leadState}
            size="small"
            variant="outlined"
          />
        </>
      ) : flow ? (
        <Typography variant="body2" color="text.secondary">
          {flow.name} - No active simulation
        </Typography>
      ) : isLoadingFlow ? (
        <Typography variant="body2" color="text.secondary">
          Loading flow...
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No flow loaded
        </Typography>
      )}

      <Box sx={{ flex: 1 }} />

      {/* Reset Button (only show when simulation is running) */}
      {currentRun && (
        <Button
          variant="outlined"
          startIcon={<RestartAltIcon />}
          onClick={handleReset}
          size="small"
          sx={{
            borderColor: '#ec4899',
            color: '#ec4899',
            '&:hover': {
              borderColor: '#ec4899',
              backgroundColor: 'rgba(236, 72, 153, 0.1)',
            }
          }}
        >
          Reset
        </Button>
      )}
    </Box>
  );
};

