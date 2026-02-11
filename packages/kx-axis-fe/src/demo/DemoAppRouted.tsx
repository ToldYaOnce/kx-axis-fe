import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  ToggleButtonGroup, 
  ToggleButton, 
  IconButton, 
  Tooltip, 
  ThemeProvider, 
  CssBaseline,
  Tab,
  Tabs,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ArticleIcon from '@mui/icons-material/Article';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { defaultLightTheme, kxgryndeTheme } from '../theme';
import { KxAxisRoutes, ConversationTemplatesListRoute, ConversationTemplateEditRoute, FlowSimulatorRoute } from '../routes';
import { AllSimulationsRoute } from '../routes/AllSimulationsRoute';

type ThemeMode = 'default' | 'kxgrynde';

/**
 * Unified Header with Navigation
 */
const AppHeader: React.FC<{ themeMode: ThemeMode; onThemeToggle: (mode: ThemeMode) => void }> = ({ 
  themeMode, 
  onThemeToggle 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentTab = () => {
    if (location.pathname.startsWith('/conversation-item-templates')) {
      return 'templates';
    }
    if (location.pathname.startsWith('/simulations')) {
      return 'simulations';
    }
    if (location.pathname.startsWith('/personas')) {
      return 'personas';
    }
    return 'flows';
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    switch (newValue) {
      case 'flows':
        navigate('/flows');
        break;
      case 'templates':
        navigate('/conversation-item-templates');
        break;
      case 'simulations':
        navigate('/simulations');
        break;
      case 'personas':
        // navigate('/personas'); // Disabled for now
        break;
    }
  };

  return (
    <Box
      sx={{
        height: 64,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* Left: Brand */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>KxAxis</h2>
        
        {/* Navigation Tabs */}
        <Tabs 
          value={getCurrentTab()} 
          onChange={handleTabChange}
          sx={{ minHeight: 48 }}
        >
          <Tab 
            icon={<AccountTreeIcon sx={{ fontSize: '1.2rem' }} />} 
            iconPosition="start" 
            label="Flows" 
            value="flows"
            sx={{ textTransform: 'none', minHeight: 48, px: 2 }}
          />
          <Tab 
            icon={<ArticleIcon sx={{ fontSize: '1.2rem' }} />} 
            iconPosition="start" 
            label="Templates" 
            value="templates"
            sx={{ textTransform: 'none', minHeight: 48, px: 2 }}
          />
          <Tab 
            icon={<PlayArrowIcon sx={{ fontSize: '1.2rem' }} />} 
            iconPosition="start" 
            label="Simulations" 
            value="simulations"
            sx={{ textTransform: 'none', minHeight: 48, px: 2 }}
          />
          <Tab 
            icon={<SmartToyIcon sx={{ fontSize: '1.2rem' }} />} 
            iconPosition="start" 
            label="Personas" 
            value="personas"
            disabled
            sx={{ textTransform: 'none', minHeight: 48, px: 2 }}
          />
        </Tabs>
      </Box>

      {/* Right: Theme Toggle */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Tooltip title="Toggle Theme">
          <IconButton onClick={() => onThemeToggle(themeMode === 'default' ? 'kxgrynde' : 'default')}>
            <PaletteIcon />
          </IconButton>
        </Tooltip>
        <ToggleButtonGroup
          value={themeMode}
          exclusive
          onChange={(_, newMode) => newMode && onThemeToggle(newMode)}
          size="small"
        >
          <ToggleButton value="default">Default</ToggleButton>
          <ToggleButton value="kxgrynde">KxGrynde</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
};

/**
 * Demo App with React Router
 * 
 * This demonstrates how to integrate KxAxis routes into an application
 */
export const DemoAppRouted: React.FC = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('kxgrynde');
  
  const activeTheme = themeMode === 'kxgrynde' ? kxgryndeTheme : defaultLightTheme;

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Unified Header with Navigation */}
          <AppHeader themeMode={themeMode} onThemeToggle={setThemeMode} />

          {/* Main Content Area */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'hidden', 
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <Routes>
              {/* KxAxis routes mounted at /flows */}
              <Route path="/flows/*" element={<KxAxisRoutes basePath="/flows" />} />
              
              {/* Conversation Item Templates */}
              <Route 
                path="/conversation-item-templates" 
                element={<ConversationTemplatesListRoute />} 
              />
              <Route 
                path="/conversation-item-templates/:templateId" 
                element={<ConversationTemplateEditRoute />} 
              />
              
              {/* All Simulations */}
              <Route 
                path="/simulations" 
                element={<AllSimulationsRoute />} 
              />
              
              {/* Individual Simulation (without flowId) */}
              <Route 
                path="/simulations/:simulationId" 
                element={<FlowSimulatorRoute basePath="/simulations" />} 
              />
              
              {/* Personas (placeholder) */}
              <Route path="/personas" element={
                <Box sx={{ p: 4 }}>
                  <h1>Personas (Coming Soon)</h1>
                  <p>AI Persona management will be available here.</p>
                </Box>
              } />
              
              {/* Default redirect to flows */}
              <Route path="/" element={<Navigate to="/flows" replace />} />
              <Route path="*" element={<Navigate to="/flows" replace />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
};

