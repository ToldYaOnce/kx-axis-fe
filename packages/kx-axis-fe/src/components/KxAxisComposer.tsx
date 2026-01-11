import React, { useState, useRef } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme, Drawer } from '@mui/material';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent } from '@dnd-kit/core';
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
  const canvasRef = useRef<CanvasHandle>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

  // Drag end handler - delegates to Canvas
  const handleDragEnd = (event: DragEndEvent) => {
    console.log('🎯 KxAxisComposer handleDragEnd called');
    canvasRef.current?.handleDragEnd(event);
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
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
          </DndContext>

          {/* Simulate Panel (Right Drawer) */}
          <SimulatePanel open={simulateOpen} onClose={() => setSimulateOpen(false)} />
        </Box>
      </FlowProvider>
    </ThemeProvider>
  );
};


