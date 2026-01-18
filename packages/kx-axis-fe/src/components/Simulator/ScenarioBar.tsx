/**
 * Scenario Bar - Top control bar for Execution Mode
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useSimulator } from '../../context/SimulatorContext';
import { demoScenarios } from '../../fixtures/simulatorFixtures';
import type { Channel, LeadState, ScenarioContext } from '../../types/simulator';
import { useToast } from '../../context/ToastContext';

export const ScenarioBar: React.FC = () => {
  const { showError, showConfirm } = useToast();
  const { currentRun, useMockData, setUseMockData, startSimulation, reset } = useSimulator();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState('flow-fitness-onboarding');
  const [channel, setChannel] = useState<Channel>('SMS');
  const [leadState, setLeadState] = useState<LeadState>('ANONYMOUS');
  
  // Toast notification state (for local toast if needed)
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleStartSimulation = async () => {
    const scenario: ScenarioContext = {
      channel,
      leadState,
      resumable: false,
    };

    try {
      await startSimulation(selectedFlow, scenario);
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to start simulation:', error);
      showToast('Failed to start simulation. Check console for details.', 'error');
    }
  };

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
      ) : (
        <Typography variant="body2" color="text.secondary">
          No active simulation
        </Typography>
      )}

      <Box sx={{ flex: 1 }} />

      {/* Mock Data Toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={useMockData}
            onChange={(e) => setUseMockData(e.target.checked)}
            size="small"
          />
        }
        label={
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Use Mock Data
          </Typography>
        }
      />

      {/* Actions */}
      {!currentRun ? (
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{
            backgroundColor: 'secondary.main',
            color: '#000000', // Black text on cyan for high contrast
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'secondary.dark',
            }
          }}
        >
          Start Simulation
        </Button>
      ) : (
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

      {/* Start Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Simulation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Scenario</InputLabel>
              <Select
                value={selectedFlow}
                label="Scenario"
                onChange={(e) => setSelectedFlow(e.target.value)}
              >
                {demoScenarios.map((scenario) => (
                  <MenuItem key={scenario.id} value={scenario.id}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {scenario.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {scenario.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Channel</InputLabel>
              <Select
                value={channel}
                label="Channel"
                onChange={(e) => setChannel(e.target.value as Channel)}
              >
                <MenuItem value="SMS">SMS</MenuItem>
                <MenuItem value="Email">Email</MenuItem>
                <MenuItem value="Web Chat">Web Chat</MenuItem>
                <MenuItem value="Phone">Phone</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Lead State</InputLabel>
              <Select
                value={leadState}
                label="Lead State"
                onChange={(e) => setLeadState(e.target.value as LeadState)}
              >
                <MenuItem value="ANONYMOUS">Anonymous</MenuItem>
                <MenuItem value="KNOWN">Known</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStartSimulation}>
            Start
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notifications */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={6000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

