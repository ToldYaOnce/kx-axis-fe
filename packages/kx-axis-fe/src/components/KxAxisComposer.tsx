import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, CssBaseline, ThemeProvider, Drawer, Paper, Typography } from '@mui/material';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin, rectIntersection } from '@dnd-kit/core';
import { FlowProvider, useFlow } from '../context/FlowContext';
import { FlowDataProvider } from '../context/FlowDataContext';
import { TopBar } from './TopBar';
import { Canvas, type CanvasHandle } from './Canvas/Canvas';
import { Inspector } from './Inspector/Inspector';
import { SimulatePanel } from './Simulate/SimulatePanel';
import { ConversationItemsPalette } from './ConversationItems/ConversationItemsPalette';
import type { KxAxisComposerProps, ConversationFlow } from '../types';
import { defaultLightTheme } from '../theme';

// Conditional Inspector - only shows when node is selected
const ConditionalInspector: React.FC = () => {
  const { selection } = useFlow();
  
  // Only render Inspector when a node is selected
  if (selection.type !== 'node' || !selection.id) {
    return null;
  }
  
  return <Inspector />;
};

export const KxAxisComposer: React.FC<KxAxisComposerProps> = ({
  initialConfig,
  goalLensRegistry,
  onChange,
  onValidate,
  onSimulations,
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);

  const handleSimulations = () => {
    setSimulateOpen(true);
    onSimulations?.();
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

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Store the dragged item data for the overlay
    if (event.active.data.current?.type === 'palette-item') {
      setDraggedItem(event.active.data.current.item);
    }
  }, []);

  // Handle drag end from DndContext
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    // Forward drag end event to Canvas
    if (canvasRef.current) {
      canvasRef.current.handleDragEnd(event);
    }
    
    // Clear drag state
    setActiveId(null);
    setDraggedItem(null);
  }, []);

  // Custom collision detection: prioritize pointer position over geometric center
  const customCollisionDetection = useCallback((args: any) => {
    // First try pointer-based detection (most accurate)
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions && pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    
    // Fallback to rectangle intersection
    return rectIntersection(args);
  }, []);

  // Render content - conditionally wrap with FlowDataProvider if API integration is enabled
  const flowContent = (
    <FlowProvider
      initialFlow={currentFlow}
      registry={goalLensRegistry}
      onChange={handleFlowChange}
    >
      <DndContext 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        collisionDetection={customCollisionDetection}
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
          <TopBar onSimulations={handleSimulations} />

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

              {/* Inspector Panel (Right) - only shows when node selected */}
              <ConditionalInspector />
            </Box>

          {/* Simulate Panel (Right Drawer) */}
          <SimulatePanel open={simulateOpen} onClose={() => setSimulateOpen(false)} />
        </Box>

        {/* Drag Overlay - shows what's being dragged on top of everything */}
        <DragOverlay
          dropAnimation={null}
          style={{
            cursor: 'grabbing',
          }}
        >
          {activeId && draggedItem && (
            <Box
              sx={{
                width: 280,
                p: 2,
                backgroundColor: 'background.paper',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 1,
                boxShadow: 8,
                opacity: 0.95,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'grabbing',
              }}
            >
              {/* Icon */}
              <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                {draggedItem.icon}
              </Box>
              
              {/* Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {draggedItem.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                  {draggedItem.description}
                </Typography>
              </Box>

              {/* Drag Handle */}
              <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                <Box
                  component="span"
                  sx={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                  }}
                >
                  ⋮⋮
                </Box>
              </Box>
            </Box>
          )}
        </DragOverlay>
      </DndContext>
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


