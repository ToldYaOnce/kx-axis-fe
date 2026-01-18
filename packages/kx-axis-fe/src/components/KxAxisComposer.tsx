import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, CssBaseline, ThemeProvider, Drawer, Paper, Typography } from '@mui/material';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
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
  const [activeItem, setActiveItem] = useState<any>(null);
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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

  // Drag start handler - track what's being dragged
  const handleDragStart = (event: DragStartEvent) => {
    console.log('🚀 KxAxisComposer handleDragStart called');
    const isPaletteItem = event.active.data.current?.type === 'palette-item';
    if (isPaletteItem && event.active.data.current) {
      setActiveItem(event.active.data.current.item);
    }
  };

  // Drag end handler - delegates to Canvas
  const handleDragEnd = (event: DragEndEvent) => {
    console.log('🎯 KxAxisComposer handleDragEnd called');
    canvasRef.current?.handleDragEnd(event);
    setActiveItem(null);
  };

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
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                  overflowY: activeItem ? 'hidden' : 'auto', // Disable scroll during drag
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
          
          {/* Drag Overlay - renders dragged item on top of everything */}
          <DragOverlay dropAnimation={null}>
            {activeItem ? (
              <Paper
                elevation={8}
                sx={{
                  p: 2,
                  cursor: 'grabbing',
                  opacity: 0.9,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  backgroundColor: 'background.paper',
                  minWidth: 280,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                    {activeItem.icon}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {activeItem.title}
                  </Typography>
                </Box>
              </Paper>
            ) : null}
          </DragOverlay>
        </DndContext>

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


