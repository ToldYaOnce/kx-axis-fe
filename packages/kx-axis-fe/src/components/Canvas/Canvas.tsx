import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography, Snackbar, Alert, useTheme, alpha } from '@mui/material';
import { DragEndEvent, useDroppable } from '@dnd-kit/core';
import { NodeCard } from './NodeCard';
import { useFlow } from '../../context/FlowContext';
import type { FlowNode } from '../../types';
import { computeDerivedLanes } from '../../utils/derivedLanes';

export interface CanvasHandle {
  handleDragEnd: (event: DragEndEvent) => void;
}

// Droppable Lane Component
const DroppableLane: React.FC<{ 
  laneIndex: number;
  children: React.ReactNode;
  isLast: boolean;
  isElastic?: boolean;
}> = ({ laneIndex, children, isLast, isElastic }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `lane-${laneIndex}`,
    data: {
      laneIndex,
    },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minWidth: 308, // 10% wider than previous 280px
        maxWidth: 350,
        flex: 1,
        position: 'relative',
        px: 0, // No padding - cards will have their own margins
        py: 2,
        minHeight: '100%', // Ensure lanes extend full height
        backgroundColor: isOver ? 'action.hover' : 'transparent',
        transition: 'background-color 0.2s',
        // Elastic lane always gets dashed border, regular lanes get solid unless last
        borderRight: isElastic ? '2px dashed' : (!isLast ? '1px solid' : 'none'),
        borderColor: 'divider',
        opacity: isElastic ? 0.6 : 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </Box>
  );
};

export const Canvas = forwardRef<CanvasHandle, {}>((_, ref) => {
  const { flow, selection, setSelection, addNode } = useFlow();
  const theme = useTheme();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'warning' | 'error' } | null>(null);

  // Compute derived lanes based on prerequisites
  const derivedLanes = computeDerivedLanes(flow.nodes);
  
  // Lane colors - elegant, muted, professional
  // For dark theme: subtle color tints on dark background
  const laneColors = [
    alpha(theme.palette.info.main, 0.06),      // Blue-slate tint
    alpha(theme.palette.secondary.main, 0.06), // Cyan tint
    alpha(theme.palette.warning.main, 0.06),   // Purple tint
    alpha(theme.palette.primary.dark, 0.04),   // Dark slate tint
  ];

  const handleNodeClick = (node: FlowNode) => {
    setSelection({ type: 'node', id: node.id });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelection({ type: 'overview' });
    }
  };

  // Handle drag end - add new nodes from palette or recompute lane for existing nodes
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // Check if this is a palette item being dropped
      const isPaletteItem = active.data.current?.type === 'palette-item';
      
      if (isPaletteItem && active.data.current) {
        // Handle palette item drop
        const item = active.data.current.item;
        
        // Get the createNodeFromItem function from window (set by palette)
        const createNodeFromItem = (window as any).__createNodeFromItem;
        
        if (createNodeFromItem) {
          const newNode = createNodeFromItem(item);
          
          // Node will auto-snap to computed lane on next render
          addNode(newNode);
          setSelection({ type: 'node', id: newNode.id });
          
          setSnackbar({
            message: `Added "${newNode.title}"`,
            severity: 'success',
          });
        }
        return;
      }

      // Handle existing node drag (auto-snaps based on requirements)
      if (!over) return;
      
      setSnackbar({
        message: 'Node position updated',
        severity: 'success',
      });
    },
    [flow.nodes, addNode, setSelection]
  );

  // Expose handleDragEnd to parent via ref
  useImperativeHandle(ref, () => ({
    handleDragEnd,
  }), [handleDragEnd]);

  return (
      <Box
        ref={canvasRef}
        onClick={handleCanvasClick}
        sx={{
          flex: 1,
          position: 'relative',
          backgroundColor: 'background.default',
          overflow: 'auto',
          backgroundImage: `
            radial-gradient(circle, ${alpha('#FFFFFF', 0.08)} 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      >

        {/* Derived Lanes */}
        <Box
          sx={{
            display: 'flex',
            minHeight: 'calc(100vh - 80px)', // Ensure lanes extend full viewport height
            height: 'auto',
            pt: 2,
          }}
        >
          {derivedLanes.map((lane, index) => {
            const laneColor = laneColors[index % laneColors.length];
            const stepNumber = ['①', '②', '③', '④', '⑤'][index] || `${index + 1}`;

            return (
              <React.Fragment key={lane.index}>
                <DroppableLane laneIndex={lane.index} isLast={false}>
                {/* Lane Header */}
                <Box
                  sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 5,
                    p: 1.5,
                    pb: 1,
                    mb: 2,
                    mx: 0, // Flush with lane edges (lane has no padding now)
                    backgroundColor: laneColor,
                    borderBottom: '1px solid',
                    borderColor: alpha('#FFFFFF', 0.06),
                    borderRadius: 0,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: alpha('#FFFFFF', 0.5),
                        lineHeight: 1,
                      }}
                    >
                      {stepNumber}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: 1,
                        color: alpha('#FFFFFF', 0.9),
                        flex: 1,
                      }}
                    >
                      {lane.label}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha('#FFFFFF', 0.4),
                      fontSize: '0.65rem',
                    }}
                  >
                    {lane.description}
                  </Typography>
                </Box>

                {/* Nodes in this lane */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, px: 2 }}>
                  {lane.nodes.map((node) => (
                    <NodeCard
                      key={node.id}
                      node={node}
                      isSelected={selection.type === 'node' && selection.id === node.id}
                      onClick={() => handleNodeClick(node)}
                      isDraggable={true}
                    />
                  ))}

                  {lane.nodes.length === 0 && (
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 4,
                        color: 'text.disabled',
                      }}
                    >
                      <Typography variant="caption">No nodes in this lane</Typography>
                    </Box>
                  )}
                </Box>
                </DroppableLane>
              </React.Fragment>
            );
          })}
          
          {/* Elastic "Drop to place" lane */}
          <DroppableLane 
            key="elastic" 
            laneIndex={derivedLanes.length} 
            isLast={true} 
            isElastic={true}
          >
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 5,
                p: 1.5,
                mb: 2,
                mx: 0, // Flush (lane has no padding now)
                backgroundColor: alpha('#FFFFFF', 0.02),
                borderTop: '2px dashed',
                borderBottom: '2px dashed',
                borderColor: alpha('#FFFFFF', 0.1),
                borderRadius: 0,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: alpha('#FFFFFF', 0.3),
                  display: 'block',
                }}
              >
                Drop to place
              </Typography>
            </Box>
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 200,
                flex: 1,
                px: 2, // Match padding with nodes container
              }}
            >
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: alpha('#FFFFFF', 0.3) }}>
                Drop a node here
              </Typography>
            </Box>
          </DroppableLane>
        </Box>

        {/* Empty state */}
        {flow.nodes.length === 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
              No items yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3 }}>
              Drag items from the left panel to start building your flow
            </Typography>
          </Box>
        )}

        {/* Snackbar for feedback */}
        {snackbar && (
          <Snackbar
            open={true}
            autoHideDuration={3000}
            onClose={() => setSnackbar(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        )}
      </Box>
  );
});
