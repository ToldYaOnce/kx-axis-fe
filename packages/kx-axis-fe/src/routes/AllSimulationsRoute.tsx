import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  IconButton,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SmartToyIcon from '@mui/icons-material/SmartToy';
// Trait icons
import WhatshotIcon from '@mui/icons-material/Whatshot';
import PsychologyIcon from '@mui/icons-material/Psychology';
import HandshakeIcon from '@mui/icons-material/Handshake';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import BarChartIcon from '@mui/icons-material/BarChart';
import BrushIcon from '@mui/icons-material/Brush';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import SchoolIcon from '@mui/icons-material/School';
import LightModeIcon from '@mui/icons-material/LightMode';
import BalanceIcon from '@mui/icons-material/Balance';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BoltIcon from '@mui/icons-material/Bolt';
import ShieldIcon from '@mui/icons-material/Shield';
import FlightIcon from '@mui/icons-material/Flight';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalculateIcon from '@mui/icons-material/Calculate';
import LabelIcon from '@mui/icons-material/Label';
import TerrainIcon from '@mui/icons-material/Terrain';
import DiamondIcon from '@mui/icons-material/Diamond';
import ScienceIcon from '@mui/icons-material/Science';
import ExtensionIcon from '@mui/icons-material/Extension';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import FlagIcon from '@mui/icons-material/Flag';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import { ToastProvider, useToast } from '../context/ToastContext';
import { flowAPI } from '../api/flowClient';
import { simulatorAPI } from '../api/simulatorClient';
import { personasAPI, type Persona } from '../api/personasClient';
import type { SimulationSummary, Channel, LeadState } from '../types/simulator';

/**
 * Extended simulation summary with flow name for display
 */
interface SimulationWithFlowName extends SimulationSummary {
  flowName?: string;
}

// Trait descriptor mapping for better UX
const TRAIT_DESCRIPTORS: Record<string, { icon: React.ReactElement; label: string }> = {
  'enthusiastic': { icon: <WhatshotIcon fontSize="small" />, label: 'High energy & motivating' },
  'knowledgeable': { icon: <PsychologyIcon fontSize="small" />, label: 'Expert & well-informed' },
  'supportive': { icon: <HandshakeIcon fontSize="small" />, label: 'Empathetic & encouraging' },
  'professional': { icon: <BusinessCenterIcon fontSize="small" />, label: 'Polished & business-like' },
  'friendly': { icon: <SentimentSatisfiedAltIcon fontSize="small" />, label: 'Warm & approachable' },
  'empathetic': { icon: <FavoriteIcon fontSize="small" />, label: 'Understanding & caring' },
  'assertive': { icon: <FitnessCenterIcon fontSize="small" />, label: 'Confident & direct' },
  'patient': { icon: <SelfImprovementIcon fontSize="small" />, label: 'Calm & understanding' },
  'analytical': { icon: <BarChartIcon fontSize="small" />, label: 'Data-driven & logical' },
  'creative': { icon: <BrushIcon fontSize="small" />, label: 'Innovative & imaginative' },
  'humorous': { icon: <EmojiEmotionsIcon fontSize="small" />, label: 'Lighthearted & fun' },
  'serious': { icon: <GpsFixedIcon fontSize="small" />, label: 'Focused & no-nonsense' },
  'casual': { icon: <CheckroomIcon fontSize="small" />, label: 'Relaxed & informal' },
  'formal': { icon: <SchoolIcon fontSize="small" />, label: 'Proper & structured' },
  'optimistic': { icon: <LightModeIcon fontSize="small" />, label: 'Positive & hopeful' },
  'realistic': { icon: <BalanceIcon fontSize="small" />, label: 'Practical & grounded' },
  'visionary': { icon: <VisibilityIcon fontSize="small" />, label: 'Forward-thinking & strategic' },
  'decisive': { icon: <BoltIcon fontSize="small" />, label: 'Quick to act & confident' },
  'resilient': { icon: <ShieldIcon fontSize="small" />, label: 'Adaptable & persistent' },
  'independent': { icon: <FlightIcon fontSize="small" />, label: 'Self-reliant & autonomous' },
  'independent thinker': { icon: <FlightIcon fontSize="small" />, label: 'Self-reliant & autonomous' },
  'data-driven': { icon: <TrendingUpIcon fontSize="small" />, label: 'Evidence-based & analytical' },
  'data-driven & logical': { icon: <TrendingUpIcon fontSize="small" />, label: 'Evidence-based & analytical' },
  'logical': { icon: <CalculateIcon fontSize="small" />, label: 'Rational & systematic' },
  'intensely self-aware': { icon: <SearchIcon fontSize="small" />, label: 'Highly introspective' },
  'self-aware': { icon: <SearchIcon fontSize="small" />, label: 'Introspective & mindful' },
  'brand-driven': { icon: <LabelIcon fontSize="small" />, label: 'Brand-conscious & strategic' },
  'gritty': { icon: <TerrainIcon fontSize="small" />, label: 'Determined & perseverant' },
  'gritty but refined': { icon: <DiamondIcon fontSize="small" />, label: 'Determined yet polished' },
  'refined': { icon: <DiamondIcon fontSize="small" />, label: 'Polished & sophisticated' },
  'curious': { icon: <ScienceIcon fontSize="small" />, label: 'Inquisitive & exploratory' },
  'curious about human dynamics': { icon: <ExtensionIcon fontSize="small" />, label: 'People-focused & analytical' },
  'human dynamics': { icon: <ExtensionIcon fontSize="small" />, label: 'People-focused' },
  'high-performance': { icon: <RocketLaunchIcon fontSize="small" />, label: 'Results-oriented & ambitious' },
  'high-performance oriented': { icon: <RocketLaunchIcon fontSize="small" />, label: 'Results-oriented & ambitious' },
  'performance-oriented': { icon: <FlagIcon fontSize="small" />, label: 'Goal-driven & efficient' },
};

/**
 * Inner component with toast access
 */
const AllSimulationsContent: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, showConfirm } = useToast();
  const [flows, setFlows] = useState<Array<{ id: string; name: string }>>([]);
  const [simulations, setSimulations] = useState<SimulationWithFlowName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [flowFilter, setFlowFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'flow'>('recent');

  // Create simulation dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<string>('');
  const [channel, setChannel] = useState<Channel>('SMS');
  const [leadState, setLeadState] = useState<LeadState>('ANONYMOUS');
  
  // Persona state
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Helper to parse and format traits
  const formatTraits = (traitsInput: string | string[] | undefined): Array<{ icon: React.ReactElement; label: string; original: string }> => {
    if (!traitsInput) return [];
    
    // Handle both string and array inputs
    let traits: string[];
    if (Array.isArray(traitsInput)) {
      traits = traitsInput.map(t => String(t).toLowerCase().trim()).filter(Boolean);
    } else if (typeof traitsInput === 'string') {
      // Split by common delimiters (comma, semicolon, slash, pipe)
      traits = traitsInput.toLowerCase().split(/[,;\/|]/).map(t => t.trim()).filter(Boolean);
    } else {
      console.warn('Unexpected traits type:', typeof traitsInput, traitsInput);
      return [];
    }
    
    return traits.map(trait => {
      const descriptor = TRAIT_DESCRIPTORS[trait];
      return descriptor 
        ? { ...descriptor, original: trait }
        : { icon: <TheaterComedyIcon fontSize="small" />, label: trait.charAt(0).toUpperCase() + trait.slice(1), original: trait };
    });
  };

  // Preload personas on mount
  useEffect(() => {
    const loadPersonas = async () => {
      try {
        setIsLoadingPersonas(true);
        const fetchedPersonas = await personasAPI.listPersonas();
        setPersonas(fetchedPersonas);
        
        // Auto-select first persona
        if (fetchedPersonas.length > 0) {
          setSelectedPersonaId(fetchedPersonas[0].personaId);
        }
      } catch (err) {
        console.error('Failed to preload personas:', err);
        // Don't show error toast on preload, just log it
      } finally {
        setIsLoadingPersonas(false);
      }
    };

    loadPersonas();
  }, []);

  // Load flows and simulations
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load flows for the filter dropdown
        const flowsResponse = await flowAPI.listFlows();
        const flowsList = flowsResponse.flows.map(f => ({ id: f.flowId, name: f.name }));
        setFlows(flowsList);
        
        // Auto-select first flow if available for the create dialog
        if (flowsList.length > 0 && !selectedFlowId) {
          setSelectedFlowId(flowsList[0].id);
        }
        
        // Create a map for quick flow name lookup
        const flowMap = new Map(flowsList.map(f => [f.id, f.name]));
        
        // Load ALL simulations in one API call (no flowId filter)
        const simsResponse = await simulatorAPI.listSimulations({});
        const allSimulations: SimulationWithFlowName[] = simsResponse.data.simulations.map(sim => ({
          ...sim,
          flowName: flowMap.get(sim.flowId) || `Flow ${sim.flowId.slice(-8)}`, // Add flow name for display
        }));
        
        setSimulations(allSimulations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Format relative dates
  const formatRelativeTime = (dateString: string) => {
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
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter and sort simulations
  const filteredSimulations = simulations
    .filter(sim => {
      // Flow filter
      if (flowFilter !== 'all' && sim.flowId !== flowFilter) return false;
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          sim.flowName,
          sim.persona?.name,
          sim.leadState,
          sim.channel,
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else {
        // Sort by flow name
        return (a.flowName || '').localeCompare(b.flowName || '');
      }
    });

  const handleOpenSimulation = (simulationId: string) => {
    navigate(`/simulations/${simulationId}`);
  };

  const handleDeleteSimulation = async (e: React.MouseEvent, simulationId: string, flowName: string) => {
    e.stopPropagation(); // Prevent card click
    
    const confirmed = await showConfirm(
      `Delete simulation for "${flowName}"? This cannot be undone.`,
      'Confirm Delete'
    );

    if (confirmed) {
      try {
        await simulatorAPI.deleteSimulation(simulationId);
        setSimulations(simulations.filter(sim => sim.simulationId !== simulationId));
        showToast('Simulation deleted successfully', 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to delete simulation', 'error');
      }
    }
  };

  const handleNewSimulation = () => {
    setDialogOpen(true);
  };

  const handleStartNewSimulation = async () => {
    if (!selectedFlowId) {
      showToast('Please select a flow', 'error');
      return;
    }
    if (!selectedPersonaId) {
      showToast('Please select a persona', 'error');
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Get flow name for simulation name
      const selectedFlow = flows.find(f => f.id === selectedFlowId);
      const flowName = selectedFlow?.name || 'Unknown Flow';
      
      // Create simulation
      const response = await simulatorAPI.startSimulation({
        name: `${flowName} - ${leadState} User`,
        flowId: selectedFlowId,
        leadState: leadState as any,
        personaId: selectedPersonaId,
      });
      
      // Navigate to execution mode
      navigate(`/simulations/${response.simulationId}`, { 
        state: { 
          flowId: selectedFlowId,
          flowName,
          simulation: response,
        } 
      });
      
      setDialogOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to start simulation', 'error');
    } finally {
      setIsCreating(false);
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
        <Alert severity="error">Failed to load data: {error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header with integrated controls */}
      <Box sx={{
        px: 4,
        pt: 4,
        pb: 3,
        borderBottom: '1px solid',
        borderColor: 'rgba(255, 255, 255, 0.06)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.02em' }}>
              Simulations
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              {filteredSimulations.length} {filteredSimulations.length === 1 ? 'result' : 'results'} 
              {simulations.length !== filteredSimulations.length && ` of ${simulations.length} total`}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewSimulation}
            sx={{
              background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.8) 0%, rgba(34, 211, 238, 1) 100%)',
              color: '#000',
              fontWeight: 700,
              px: 3,
              py: 1.25,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: '0 4px 16px rgba(34, 211, 238, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 1) 0%, rgba(56, 189, 248, 1) 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(34, 211, 238, 0.4)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            New Simulation
          </Button>
        </Box>

        {/* Integrated Filter Bar */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={sortBy}
            exclusive
            onChange={(_e, newValue) => newValue && setSortBy(newValue)}
            size="small"
            sx={{
              bgcolor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 1.5,
              '& .MuiToggleButton-root': {
                color: 'rgba(255, 255, 255, 0.6)',
                border: 'none',
                px: 2,
                py: 0.75,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                '&.Mui-selected': {
                  bgcolor: 'rgba(34, 211, 238, 0.2)',
                  color: 'secondary.main',
                  '&:hover': {
                    bgcolor: 'rgba(34, 211, 238, 0.3)',
                  }
                },
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                }
              }
            }}
          >
            <ToggleButton value="recent">Most Recent</ToggleButton>
            <ToggleButton value="flow">By Flow</ToggleButton>
          </ToggleButtonGroup>

          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 180,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 1.5,
                '& fieldset': {
                  borderColor: 'rgba(100, 116, 139, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(34, 211, 238, 0.3)',
                },
              }
            }}
          >
            <InputLabel>Filter by Flow</InputLabel>
            <Select 
              value={flowFilter} 
              onChange={(e) => setFlowFilter(e.target.value)}
              label="Filter by Flow"
            >
              <MenuItem value="all">All Flows</MenuItem>
              {flows.map(flow => (
                <MenuItem key={flow.id} value={flow.id}>{flow.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Search simulations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flex: 1,
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 1.5,
                '& fieldset': {
                  borderColor: 'rgba(100, 116, 139, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(34, 211, 238, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(34, 211, 238, 0.5)',
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
        
      {/* Simulations Grid */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, pb: 3 }}>
        {filteredSimulations.length === 0 ? (
          <Alert severity="info">
            {simulations.length === 0 
              ? 'No simulations found. Click "New Simulation" to get started.'
              : 'No simulations match your filters.'}
          </Alert>
        ) : (
          <Grid container spacing={2.5}>
            {filteredSimulations.map(sim => {
              const persona = personas.find(p => p.personaId === sim.personaId);

              return (
                <Grid item xs={12} sm={6} md={4} key={sim.simulationId}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      border: '1px solid',
                      borderColor: 'rgba(100, 116, 139, 0.2)',
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: 'rgba(15, 23, 42, 0.4)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: persona 
                          ? 'linear-gradient(90deg, rgba(34, 211, 238, 0.8) 0%, rgba(167, 139, 250, 0.8) 100%)'
                          : 'linear-gradient(90deg, rgba(100, 116, 139, 0.4) 0%, rgba(100, 116, 139, 0.2) 100%)',
                      },
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                        borderColor: 'rgba(34, 211, 238, 0.4)',
                        bgcolor: 'rgba(15, 23, 42, 0.6)',
                      },
                    }}
                    onClick={() => handleOpenSimulation(sim.simulationId)}
                  >
                    <CardContent sx={{ flex: 1, p: 2.5, pb: 2 }}>
                      {/* Flow Name */}
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: '1.05rem',
                          mb: 2,
                          color: 'text.primary',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          pr: 4,
                        }}
                      >
                        <AccountTreeIcon sx={{ fontSize: '1.1rem', color: 'secondary.main' }} />
                        {sim.flowName || 'Unknown Flow'}
                      </Typography>

                      {/* Persona Section */}
                      {persona ? (
                        <Box sx={{
                          mb: 2,
                          p: 1.5,
                          bgcolor: 'rgba(167, 139, 250, 0.1)',
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'rgba(167, 139, 250, 0.2)',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                            <SmartToyIcon sx={{ fontSize: '1rem', color: 'rgba(167, 139, 250, 0.9)' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              {persona.name}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
                            {persona.role}
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{
                          mb: 2,
                          p: 1.5,
                          bgcolor: 'rgba(100, 116, 139, 0.08)',
                          borderRadius: 1.5,
                          border: '1px dashed',
                          borderColor: 'rgba(100, 116, 139, 0.2)',
                        }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                            Generic user simulation
                          </Typography>
                        </Box>
                      )}

                      {/* Metrics Row */}
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={{ 
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          p: 1.25,
                          bgcolor: 'rgba(34, 211, 238, 0.08)',
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'rgba(34, 211, 238, 0.15)',
                        }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'secondary.main', lineHeight: 1 }}>
                            {sim.turnsCount || sim.nodeCount || 0}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem', mt: 0.5 }}>
                            turns
                          </Typography>
                        </Box>
                      </Box>

                      {/* Metadata Chips */}
                      <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
                        <Chip 
                          icon={sim.leadState === 'ANONYMOUS' ? <PersonOffIcon /> : <PersonIcon />}
                          label={sim.leadState === 'ANONYMOUS' ? 'Anonymous' : 'Known'}
                          size="small" 
                          sx={{ 
                            bgcolor: sim.leadState === 'ANONYMOUS' 
                              ? 'rgba(100, 116, 139, 0.15)' 
                              : 'rgba(34, 197, 94, 0.15)',
                            color: sim.leadState === 'ANONYMOUS' 
                              ? 'rgba(203, 213, 225, 0.9)' 
                              : 'rgba(74, 222, 128, 1)',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 24,
                            border: '1px solid',
                            borderColor: sim.leadState === 'ANONYMOUS'
                              ? 'rgba(100, 116, 139, 0.25)'
                              : 'rgba(34, 197, 94, 0.25)',
                            '& .MuiChip-icon': {
                              fontSize: '0.9rem',
                            }
                          }}
                        />
                      </Box>

                      {/* Timestamp */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.75,
                        pt: 1.5,
                        borderTop: '1px solid',
                        borderColor: 'rgba(100, 116, 139, 0.1)',
                      }}>
                        <AccessTimeIcon sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.4)' }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                          {formatRelativeTime(sim.updatedAt)}
                        </Typography>
                      </Box>
                    </CardContent>

                    {/* Delete Button - Floating */}
                    <IconButton
                      size="small"
                      onClick={(e) => handleDeleteSimulation(e, sim.simulationId, sim.flowName || 'Unknown Flow')}
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 32,
                        height: 32,
                        bgcolor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        color: 'rgba(248, 113, 113, 0.8)',
                        '&:hover': {
                          bgcolor: 'rgba(239, 68, 68, 0.2)',
                          borderColor: 'rgba(239, 68, 68, 0.6)',
                          color: 'rgba(248, 113, 113, 1)',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Create Simulation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Simulation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {/* Flow Selection */}
            <FormControl fullWidth required>
              <InputLabel>Flow</InputLabel>
              <Select
                value={selectedFlowId}
                label="Flow"
                onChange={(e) => setSelectedFlowId(e.target.value)}
              >
                {flows.length === 0 ? (
                  <MenuItem disabled key="no-flows">No flows available</MenuItem>
                ) : (
                  flows.map((flow) => (
                    <MenuItem key={flow.id} value={flow.id}>
                      {flow.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* Flow Info Display */}
            {selectedFlowId && (() => {
              const selectedFlow = flows.find(f => f.id === selectedFlowId);
              return (
                <Box sx={{ p: 2, bgcolor: 'primary.dark', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'white' }}>
                    Flow: {selectedFlow?.name || 'Loading...'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Test how this flow responds to different scenarios
                  </Typography>
                </Box>
              );
            })()}

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
              const formattedTraits = formatTraits(personality?.traits);
              
              return (
                <Box sx={{ p: 2, bgcolor: 'rgba(167, 139, 250, 0.1)', borderRadius: 1, border: '1px solid', borderColor: 'primary.light' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', display: 'block', mb: 1 }}>
                    Personality:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {personality?.communicationStyle && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          Communication Style:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {personality.communicationStyle}
                        </Typography>
                      </Box>
                    )}
                    {formattedTraits.length > 0 && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          Traits:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {formattedTraits.map((trait, idx) => (
                            <Tooltip key={idx} title={trait.label} arrow placement="top">
                              <Chip
                                icon={trait.icon}
                                label={trait.label}
                                size="small"
                                sx={{
                                  bgcolor: 'primary.dark',
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  height: 24,
                                  '& .MuiChip-icon': {
                                    color: 'white',
                                  },
                                }}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })()}

            {/* Channel & Lead State */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Channel</InputLabel>
                <Select
                  value={channel}
                  label="Channel"
                  onChange={(e) => setChannel(e.target.value as Channel)}
                >
                  <MenuItem value="SMS">SMS</MenuItem>
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="CHAT">Chat</MenuItem>
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleStartNewSimulation} 
            variant="contained"
            disabled={isCreating || !selectedFlowId || !selectedPersonaId}
          >
            {isCreating ? <CircularProgress size={24} /> : 'Start Simulation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/**
 * Route component for All Simulations
 * Wraps content with ToastProvider for notifications
 */
export const AllSimulationsRoute: React.FC = () => {
  return (
    <ToastProvider>
      <AllSimulationsContent />
    </ToastProvider>
  );
};
