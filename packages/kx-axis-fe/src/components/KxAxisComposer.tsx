import React, { useState, useRef } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme, Drawer, Paper, Typography } from '@mui/material';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { FlowProvider } from '../context/FlowContext';
import { TopBar } from './TopBar';
import { Canvas, type CanvasHandle } from './Canvas/Canvas';
import { Inspector } from './Inspector/Inspector';
import { SimulatePanel } from './Simulate/SimulatePanel';
import { ConversationItemsPalette } from './ConversationItems/ConversationItemsPalette';
import type { KxAxisComposerProps } from '../types';

// Minimal, flat theme
const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#BDBDBD',
    },
    divider: '#E0E0E0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export const KxAxisComposer: React.FC<KxAxisComposerProps> = ({
  initialConfig,
  industryCaptureRegistry,
  onChange,
  onValidate,
  onSimulate,
  onPublish,
}) => {
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [capturesOpen, setCapturesOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<any>(null);
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
    if (isPaletteItem) {
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

  const handleValidate = () => {
    alert('Validation passed! (Mock implementation)');
    onValidate?.();
  };

  const handlePublish = () => {
    if (onPublish) {
      onPublish(initialConfig);
    } else {
      alert('Published! (Mock implementation - use onPublish callback for real integration)');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FlowProvider
        initialFlow={initialConfig}
        registry={industryCaptureRegistry}
        onChange={onChange}
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
          <TopBar
            onSimulate={handleSimulate}
            onValidate={handleValidate}
            onPublish={handlePublish}
          />

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
    </ThemeProvider>
  );
};


