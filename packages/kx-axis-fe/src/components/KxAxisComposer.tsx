import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, CssBaseline, ThemeProvider, Drawer, Paper, Typography } from '@mui/material';
import { FlowProvider } from '../context/FlowContext';
import { FlowDataProvider } from '../context/FlowDataContext';
import { TopBar } from './TopBar';
import { Canvas, type CanvasHandle } from './Canvas/Canvas';
import { Inspector } from './Inspector/Inspector';
import { SimulatePanel } from './Simulate/SimulatePanel';
import { ConversationItemsPalette } from './ConversationItems/ConversationItemsPalette';
import type { KxAxisComposerProps, ConversationFlow } from '../types';
import { defaultLightTheme } from '../theme';

export const KxAxisComposer: React.FC<KxAxisComposerProps> = ({
  initialConfig,
  goalLensRegistry,
  onChange,
  onValidate,
  onSimulate,
  onPublish,
  flowId = null,
  enableApiIntegration = false,
  autosaveEnabled = true,
  autosaveDelay = 1000,
  theme,
  disableThemeProvider = false,
}) => {
  // Use provided theme or default
  const activeTheme = theme || defaultLightTheme;
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<ConversationFlow | null>(() => {
    // Enhance initialConfig with industry from localStorage if available
    if (initialConfig && flowId) {
      try {
        const storedIndustry = localStorage.getItem(`flow_industry_${flowId}`);
        if (storedIndustry) {
          return { ...initialConfig, industry: storedIndustry };
        }
      } catch (error) {
        console.warn('Failed to read industry from localStorage:', error);
      }
    }
    return initialConfig || null;
  });
  const canvasRef = useRef<CanvasHandle>(null);

  const handleSimulate = () => {
    setSimulateOpen(true);
    onSimulate?.();
  };

  const handleFlowChange = useCallback((updatedFlow: ConversationFlow) => {
    setCurrentFlow(updatedFlow);
    onChange?.(updatedFlow);
  }, [onChange]);

  // If currentFlow is null and API integration is enabled, show loading state
  if (!currentFlow && enableApiIntegration) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Loading flow from backend...
        </Typography>
      </Box>
    );
  }

  // If currentFlow is still null (no initialConfig and no API), show error
  if (!currentFlow) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <Typography variant="h6" color="error">
          No flow configuration provided
        </Typography>
      </Box>
    );
  }

  // Render content - conditionally wrap with FlowDataProvider if API integration is enabled
  const flowContent = (
    <FlowProvider
      initialFlow={currentFlow}
      registry={goalLensRegistry}
      onChange={handleFlowChange}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
        }}
      >
        {/* Top Bar */}
        <TopBar onSimulate={handleSimulate} />

        {/* Main Content Area */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Conversation Items Palette (Left) */}
            <Drawer
              variant="permanent"
              anchor="left"
              sx={{
                width: 320,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                  width: 320,
                  boxSizing: 'border-box',
                  position: 'relative',
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  overflowY: 'auto',
                },
              }}
            >
              <ConversationItemsPalette />
            </Drawer>

            {/* Canvas Area (Center) */}
            <Canvas ref={canvasRef} />

            {/* Inspector Panel (Right) */}
            <Inspector />
          </Box>

        {/* Simulate Panel (Right Drawer) */}
        <SimulatePanel open={simulateOpen} onClose={() => setSimulateOpen(false)} />
      </Box>
    </FlowProvider>
  );

  // Wrap with FlowDataProvider if API integration is enabled
  const content = enableApiIntegration ? (
    <FlowDataProvider
      flowId={flowId}
      onFlowLoaded={setCurrentFlow}
      autosaveEnabled={autosaveEnabled}
      autosaveDelay={autosaveDelay}
    >
      {flowContent}
    </FlowDataProvider>
  ) : (
    flowContent
  );

  // Conditionally wrap with ThemeProvider
  if (disableThemeProvider) {
    return content;
  }

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      {content}
    </ThemeProvider>
  );
};


