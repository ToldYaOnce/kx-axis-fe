/**
 * Simulations List - Shows all simulations for a flow
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { simulatorAPI } from '../../api/simulatorClient';
import { personasAPI, type Persona } from '../../api/personasClient';
import type { SimulationSummary, Channel, LeadState } from '../../types/simulator';
import { useToast } from '../../context/ToastContext';

interface SimulationsListProps {
  flowId: string;
  flowName: string;
  basePath?: string;
}

export const SimulationsList: React.FC<SimulationsListProps> = ({ 
  flowId, 
  flowName,
  basePath = '/flows' 
}) => {
  const navigate = useNavigate();
  const { showToast, showConfirm } = useToast();
  const [simulations, setSimulations] = useState<SimulationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>('SMS');
  const [leadState, setLeadState] = useState<LeadState>('ANONYMOUS');
  
  // Persona state
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false);

  // Load simulations
  useEffect(() => {
    const loadSimulations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await simulatorAPI.listSimulations({ flowId });
        
        // Handle both formats: {success, data} or direct {simulations, count}
        if (response.success && response.data) {
          setSimulations(response.data.simulations);
        } else if ((response as any).simulations) {
          // Direct format from backend
          setSimulations((response as any).simulations);
        } else {
          setError('Invalid response format');
        }
      } catch (err) {
        console.error('Failed to load simulations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load simulations');
      } finally {
        setIsLoading(false);
      }
    };

    loadSimulations();
  }, [flowId]);

  const handleNewSimulation = async () => {
    setDialogOpen(true);
    
    // Fetch personas when dialog opens
    if (personas.length === 0) {
      try {
        setIsLoadingPersonas(true);
        const fetchedPersonas = await personasAPI.listPersonas();
        setPersonas(fetchedPersonas);
        
        // Auto-select first persona
        if (fetchedPersonas.length > 0) {
          setSelectedPersonaId(fetchedPersonas[0].personaId);
        }
      } catch (err) {
        console.error('Failed to load personas:', err);
        showToast('Failed to load personas. Please try again.', 'error');
      } finally {
        setIsLoadingPersonas(false);
      }
    }
  };

  const handleStartNewSimulation = async () => {
    if (!selectedPersonaId) {
      showToast('Please select a persona', 'error');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Step 1: POST /agent/simulations to create empty simulation
      console.log('🚀 Creating new simulation via POST...');
      const response = await simulatorAPI.startSimulation({
        name: `${flowName} - ${leadState} User`,
        flowId,
        leadState: leadState as any,
        personaId: selectedPersonaId,
      });
      
      console.log('✅ Simulation created:', response);
      
      // Step 2: Navigate to execution mode with the simulationId
      // Pass the simulation data via state to avoid unnecessary GET request
      const redirectUrl = `${basePath}/${flowId}/simulations/${response.simulationId}`;
      console.log('🔀 Redirecting to:', redirectUrl);
      
      setDialogOpen(false);
      navigate(redirectUrl, {
        state: {
          simulationData: response,
          channel,
          leadState,
        },
      });
    } catch (err) {
      console.error('❌ Failed to create simulation:', err);
      showToast('Failed to create simulation. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSimulation = (simulationId: string) => {
    // For existing simulations, explicitly clear state and force API load
    navigate(`${basePath}/${flowId}/simulations/${simulationId}`, {
      replace: true, // Replace history entry to clear cached state
      state: null,    // Explicitly clear any cached state
    });
  };

  const handleDeleteSimulation = async (simulationId: string, name: string) => {
    const confirmed = await showConfirm(
      `Delete simulation "${name}"? This cannot be undone.`,
      'Confirm Delete'
    );

    if (confirmed) {
      try {
        await simulatorAPI.deleteSimulation(simulationId);
        // Reload list
        setSimulations(prev => prev.filter(s => s.simulationId !== simulationId));
      } catch (err) {
        showError('Failed to delete simulation');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'COMPLETED': return 'default';
      case 'ABANDONED': return 'warning';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            Simulations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {flowName}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewSimulation}
          sx={{
            backgroundColor: 'secondary.main',
            color: '#000000',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'secondary.dark',
            }
          }}
        >
          New Simulation
        </Button>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Empty State - First Class CTA */}
      {!error && simulations.length === 0 && (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
          </Box>
          
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
            Test Your Conversation Flow
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
            Simulations let you test how your flow responds to different scenarios and channels. 
            Create your first simulation to see it in action.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleNewSimulation}
            sx={{
              backgroundColor: 'secondary.main',
              color: '#000000',
              fontWeight: 600,
              fontSize: '1.1rem',
              py: 1.5,
              px: 4,
              '&:hover': {
                backgroundColor: 'secondary.dark',
              }
            }}
          >
            Create First Simulation
          </Button>
        </Box>
      )}

      {/* Table */}
      {!error && simulations.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Channel</TableCell>
                <TableCell>Lead State</TableCell>
                <TableCell>Turns</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {simulations.map((sim) => (
                <TableRow
                  key={sim.simulationId}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleOpenSimulation(sim.simulationId)}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {sim.name}
                    </Typography>
                    {sim.metadata?.hasGapDetection && (
                      <Chip label="Gap Detected" size="small" color="warning" sx={{ mt: 0.5 }} />
                    )}
                    {sim.metadata?.hasLowConfidence && (
                      <Chip label="Low Confidence" size="small" color="error" sx={{ mt: 0.5, ml: 0.5 }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={sim.metadata?.channel || 'Unknown'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={sim.metadata?.leadState || 'Unknown'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{sim.metadata?.turnCount || 0}</TableCell>
                  <TableCell>
                    <Chip 
                      label={sim.status} 
                      size="small" 
                      color={getStatusColor(sim.status) as any}
                    />
                  </TableCell>
                  <TableCell>{formatDate(sim.createdAt)}</TableCell>
                  <TableCell>{formatDate(sim.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSimulation(sim.simulationId);
                      }}
                      title="Open"
                    >
                      <PlayArrowIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSimulation(sim.simulationId, sim.name);
                      }}
                      title="Delete"
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* New Simulation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Simulation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {/* Flow Info */}
            <Box sx={{ p: 2, bgcolor: 'primary.dark', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'white' }}>
                Flow: {flowName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Test how this flow responds to different scenarios
              </Typography>
            </Box>

            {/* Persona Selection */}
            <FormControl fullWidth required>
              <InputLabel>Persona</InputLabel>
              <Select
                value={selectedPersonaId}
                label="Persona"
                onChange={(e) => setSelectedPersonaId(e.target.value)}
                disabled={isLoadingPersonas}
              >
                {isLoadingPersonas ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} /> Loading personas...
                  </MenuItem>
                ) : personas.length === 0 ? (
                  <MenuItem disabled>No personas available</MenuItem>
                ) : (
                  personas.map((persona) => (
                    <MenuItem key={persona.personaId} value={persona.personaId}>
                      {persona.name} - {persona.role}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* Persona Details */}
            {selectedPersonaId && !isLoadingPersonas && (() => {
              const selectedPersona = personas.find(p => p.personaId === selectedPersonaId);
              const personality = selectedPersona?.personality;
              
              return (
                <Box sx={{ p: 2, bgcolor: 'rgba(167, 139, 250, 0.1)', borderRadius: 1, border: '1px solid', borderColor: 'primary.light' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', display: 'block', mb: 1 }}>
                    Personality:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {personality?.communicationStyle && (
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        <strong>Style:</strong> {personality.communicationStyle}
                      </Typography>
                    )}
                    {personality?.traits && (
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        <strong>Traits:</strong> {personality.traits}
                      </Typography>
                    )}
                    {personality?.nickname && (
                      <Typography variant="body2" sx={{ color: 'text.primary', fontStyle: 'italic' }}>
                        <strong>Goes by:</strong> {personality.nickname}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })()}

            {/* Channel */}
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

            {/* Lead State */}
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
          <Button 
            variant="contained" 
            onClick={handleStartNewSimulation}
            disabled={!selectedPersonaId || isLoadingPersonas}
            sx={{
              backgroundColor: 'secondary.main',
              color: '#000000',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'secondary.dark',
              }
            }}
          >
            Start
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

