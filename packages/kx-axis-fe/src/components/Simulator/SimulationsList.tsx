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
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import UpdateIcon from '@mui/icons-material/Update';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
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
import SearchIcon from '@mui/icons-material/Search';
import LabelIcon from '@mui/icons-material/Label';
import TerrainIcon from '@mui/icons-material/Terrain';
import DiamondIcon from '@mui/icons-material/Diamond';
import ScienceIcon from '@mui/icons-material/Science';
import ExtensionIcon from '@mui/icons-material/Extension';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import FlagIcon from '@mui/icons-material/Flag';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import { simulatorAPI } from '../../api/simulatorClient';
import { personasAPI, type Persona } from '../../api/personasClient';
import type { SimulationSummary, Channel, LeadState } from '../../types/simulator';
import { useToast } from '../../context/ToastContext';

interface SimulationsListProps {
  flowId: string;
  flowName: string;
  basePath?: string;
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

  // Load simulations
  useEffect(() => {
    const loadSimulations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await simulatorAPI.listSimulations({ flowId });
        
        // Handle both formats: {success, data} or direct {simulations, count}
        let sims: SimulationSummary[] = [];
        if (response.success && response.data) {
          sims = response.data.simulations;
        } else if ((response as any).simulations) {
          // Direct format from backend
          sims = (response as any).simulations;
        } else {
          setError('Invalid response format');
          return;
        }
        
        // Sort by updatedAt descending (most recent first)
        sims.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setSimulations(sims);
      } catch (err) {
        console.error('Failed to load simulations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load simulations');
      } finally {
        setIsLoading(false);
      }
    };

    loadSimulations();
  }, [flowId]);

  const handleNewSimulation = () => {
    setDialogOpen(true);
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

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, pb: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
              Simulations
            </Typography>
            <Chip 
              label={simulations.length}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(167, 139, 250, 0.2) 100%)',
                color: 'secondary.main',
                fontWeight: 700,
                fontSize: '0.875rem',
                height: 28,
                border: '1px solid rgba(0, 229, 255, 0.3)',
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FiberManualRecordIcon sx={{ fontSize: '0.5rem', color: 'secondary.main' }} />
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {flowName}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewSimulation}
          sx={{
            background: 'linear-gradient(135deg, rgb(0, 229, 255) 0%, rgb(0, 200, 230) 100%)',
            color: '#000000',
            fontWeight: 700,
            px: 4,
            py: 1.5,
            borderRadius: 2.5,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 8px 24px rgba(0, 229, 255, 0.35)',
            border: '1px solid rgba(0, 229, 255, 0.5)',
            '&:hover': {
              background: 'linear-gradient(135deg, rgb(0, 255, 255) 0%, rgb(0, 229, 255) 100%)',
              boxShadow: '0 12px 32px rgba(0, 229, 255, 0.5)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)',
              border: '3px solid rgba(0, 229, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 4,
              boxShadow: '0 8px 32px rgba(0, 229, 255, 0.2)',
            }}
          >
            <AddIcon sx={{ fontSize: 70, color: 'secondary.main' }} />
          </Box>
          
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, letterSpacing: '-0.02em' }}>
            Test Your Conversation Flow
          </Typography>
          
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 5, maxWidth: 520, fontSize: '1.1rem', lineHeight: 1.6 }}>
            Simulations let you test how your flow responds to different scenarios and personas. 
            Create your first simulation to see it in action.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleNewSimulation}
            sx={{
              background: 'linear-gradient(135deg, rgb(0, 229, 255) 0%, rgb(0, 200, 230) 100%)',
              color: '#000000',
              fontWeight: 700,
              fontSize: '1.1rem',
              py: 2,
              px: 5,
              borderRadius: 2.5,
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(0, 229, 255, 0.35)',
              border: '1px solid rgba(0, 229, 255, 0.5)',
              '&:hover': {
                background: 'linear-gradient(135deg, rgb(0, 255, 255) 0%, rgb(0, 229, 255) 100%)',
                boxShadow: '0 12px 32px rgba(0, 229, 255, 0.5)',
                transform: 'translateY(-3px)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Create First Simulation
          </Button>
        </Box>
      )}

      {/* Simulations Grid */}
      {!error && simulations.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {simulations.map((sim, index) => (
            <Paper
              key={sim.simulationId}
              onClick={() => handleOpenSimulation(sim.simulationId)}
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.8) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: sim.leadState === 'ANONYMOUS' 
                    ? 'linear-gradient(90deg, rgba(156, 163, 175, 0.5) 0%, rgba(156, 163, 175, 0.2) 100%)'
                    : 'linear-gradient(90deg, rgb(16, 185, 129) 0%, rgb(52, 211, 153) 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0, 229, 255, 0.15)',
                  borderColor: 'rgba(0, 229, 255, 0.3)',
                  '&::before': {
                    opacity: 1,
                  }
                },
              }}
            >
              {/* Main Content Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 3, alignItems: 'center' }}>
                
                {/* Name & Lead State */}
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1.5,
                      fontSize: '1.1rem',
                      color: 'text.primary',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    {sim.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Chip 
                      icon={sim.leadState === 'ANONYMOUS' ? <PersonOffIcon /> : <PersonIcon />}
                      label={sim.leadState === 'ANONYMOUS' ? 'Anonymous' : 'Known User'}
                      size="small"
                      sx={{
                        background: sim.leadState === 'ANONYMOUS' 
                          ? 'linear-gradient(135deg, rgba(100, 116, 139, 0.25) 0%, rgba(71, 85, 105, 0.25) 100%)'
                          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.25) 100%)',
                        color: sim.leadState === 'ANONYMOUS' 
                          ? 'rgb(203, 213, 225)' 
                          : 'rgb(110, 231, 183)',
                        border: sim.leadState === 'ANONYMOUS'
                          ? '1px solid rgba(148, 163, 184, 0.4)'
                          : '1px solid rgba(16, 185, 129, 0.4)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        height: 28,
                        '& .MuiChip-icon': {
                          color: 'inherit',
                          fontSize: '1rem',
                        },
                        '& .MuiChip-label': {
                          px: 1,
                        }
                      }}
                    />
                    {/* Persona Chip */}
                    {sim.personaId && (() => {
                      const persona = personas.find(p => p.personaId === sim.personaId);
                      if (!persona) return null;
                      
                      return (
                        <Chip 
                          icon={<SmartToyIcon />}
                          label={`${persona.name} - ${persona.role}`}
                          size="small"
                          sx={{
                            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
                            color: 'rgb(196, 181, 253)',
                            border: '1px solid rgba(167, 139, 250, 0.4)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            height: 28,
                            '& .MuiChip-icon': {
                              color: 'inherit',
                              fontSize: '1rem',
                            },
                            '& .MuiChip-label': {
                              px: 1,
                            }
                          }}
                        />
                      );
                    })()}
                  </Box>
                </Box>

                {/* Nodes Count - Big Visual Badge */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)',
                      border: '2px solid rgba(0, 229, 255, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 0.75,
                    }}
                  >
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        color: 'secondary.main',
                        lineHeight: 1,
                      }}
                    >
                      {sim.nodeCount}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccountTreeIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Nodes
                    </Typography>
                  </Box>
                </Box>

                {/* Created Date */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: '1rem', color: 'rgba(156, 163, 175, 0.6)' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                      Created
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, pl: 3 }}>
                    {formatDate(sim.createdAt)}
                  </Typography>
                </Box>

                {/* Updated Date */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <UpdateIcon sx={{ fontSize: '1rem', color: 'rgba(0, 229, 255, 0.6)' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                      Updated
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'secondary.main', fontWeight: 600, pl: 3 }}>
                    {formatDate(sim.updatedAt)}
                  </Typography>
                </Box>

                {/* Actions */}
                <Box sx={{ ml: 2 }}>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSimulation(sim.simulationId, sim.name);
                    }}
                    sx={{
                      width: 48,
                      height: 48,
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
                      color: 'rgb(248, 113, 113)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)',
                        transform: 'scale(1.05) rotate(5deg)',
                        borderColor: 'rgba(239, 68, 68, 0.5)',
                        boxShadow: '0 6px 20px rgba(239, 68, 68, 0.3)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: '1.25rem' }} />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
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
              const formattedTraits = formatTraits(personality?.traits);
              
              return (
                <Box sx={{ p: 2, bgcolor: 'rgba(167, 139, 250, 0.1)', borderRadius: 1, border: '1px solid', borderColor: 'primary.light' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', display: 'block', mb: 1 }}>
                    Personality:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {personality?.communicationStyle && (
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        <strong>Style:</strong> {personality.communicationStyle}
                      </Typography>
                    )}
                    {formattedTraits.length > 0 && (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                          Traits:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {formattedTraits.map((trait, idx) => (
                            <Chip
                              key={idx}
                              icon={trait.icon}
                              label={trait.label}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(167, 139, 250, 0.2)',
                                color: 'text.primary',
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                height: '28px',
                                borderRadius: '14px', // Perfect pill shape
                                border: '1px solid',
                                borderColor: 'rgba(167, 139, 250, 0.3)',
                                '&:hover': {
                                  bgcolor: 'rgba(167, 139, 250, 0.3)',
                                },
                                '& .MuiChip-label': {
                                  px: 1.5,
                                  py: 0,
                                },
                                '& .MuiChip-icon': {
                                  ml: 1,
                                  mr: -0.5,
                                  color: 'secondary.main',
                                }
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
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

