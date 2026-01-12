import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography, Button, Snackbar, Alert } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { DragEndEvent, useDroppable } from '@dnd-kit/core';
import { NodeCard } from './NodeCard';
import { useFlow } from '../../context/FlowContext';
import type { FlowNode } from '../../types';
import { computeDerivedLanes, computeNodeLane } from '../../utils/derivedLanes';

export interface CanvasHandle {
  handleDragEnd: (event: DragEndEvent) => void;
}

// Droppable Lane Component
const DroppableLane: React.FC<{ 
  laneIndex: number;
  children: React.ReactNode;
  isLast: boolean;
  isElastic?: boolean;
  laneColor?: string;
}> = ({ laneIndex, children, isLast, isElastic, laneColor }) => {
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
        flex: 1,
        position: 'relative',
        px: 2,
        py: 2,
        minWidth: 280,
        maxWidth: 350, // Narrower lanes (60% of previous 420px ≈ 350px)
        minHeight: '100%', // Ensure lanes extend full height
        backgroundColor: isOver ? 'action.hover' : 'transparent',
        transition: 'background-color 0.2s',
        // Elastic lane always gets dashed border, regular lanes get solid unless last
        borderRight: isElastic ? '2px dashed' : (!isLast ? '1px solid' : 'none'),
        borderColor: 'divider',
        opacity: isElastic ? 0.6 : 1,
        display: 'flex',
        flexDirection: 'column',
        // Chevron arrow using ::after pseudo-element
        '&::after': !isLast && !isElastic ? {
          content: '""',
          position: 'absolute',
          right: -20,
          top: 40,
          width: 0,
          height: 0,
          borderTop: '28px solid transparent',
          borderBottom: '28px solid transparent',
          borderLeft: `20px solid ${laneColor || '#E8F5E9'}`,
          filter: 'drop-shadow(2px 0 3px rgba(0,0,0,0.15))',
          zIndex: 1000,
          pointerEvents: 'none',
        } : {},
      }}
    >
      {children}
    </Box>
  );
};

export const Canvas = forwardRef<CanvasHandle, {}>((props, ref) => {
  const { flow, selection, setSelection, addNode, updateNode } = useFlow();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'warning' | 'error' } | null>(null);

  // Compute derived lanes based on prerequisites
  const derivedLanes = computeDerivedLanes(flow.nodes);

  const handleNodeClick = (node: FlowNode) => {
    setSelection({ type: 'node', id: node.id });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelection({ type: 'overview' });
    }
  };

  const handleAddNode = () => {
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      kind: 'EXPLANATION',
      title: 'New Node',
      ui: {},
    };
    addNode(newNode);
    setSelection({ type: 'node', id: newNode.id });
  };

  // Handle drag end - add new nodes from palette or recompute lane for existing nodes
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // Check if this is a palette item being dropped
      const isPaletteItem = active.data.current?.type === 'palette-item';
      
      if (isPaletteItem) {
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

      // Handle existing node drag
      const nodeId = active.id as string;
      const node = flow.nodes.find((n) => n.id === nodeId);

      if (!node || !over) return;

      // Node auto-snaps to computed lane based on its requirements
      // Just trigger a re-render by updating the node (keeps same data)
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

  const lanes: EligibilityLane[] = ['BEFORE_CONTACT', 'CONTACT_GATE', 'AFTER_CONTACT', 'AFTER_BOOKING'];

  return (
      <Box
        ref={canvasRef}
        onClick={handleCanvasClick}
        sx={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#FAFAFA',
          overflow: 'auto',
          backgroundImage: `
            radial-gradient(circle, #E0E0E0 1px, transparent 1px)
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
            const isLast = index === derivedLanes.length;
            const laneColor = ['#E8F5E9', '#FFF9C4', '#E3F2FD', '#F3E5F5'][index % 4];

            return (
              <React.Fragment key={lane.index}>
                <DroppableLane laneIndex={lane.index} isLast={false} laneColor={laneColor}>
                {/* Lane Header */}
                <Box
                  sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 5,
                    p: 1.5,
                    pb: 1,
                    mb: 2,
                    mx: -2, // Flush with lane edges
                    backgroundColor: laneColor,
                    borderTop: '1px solid',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: 1,
                      color: 'text.primary',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    {lane.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.65rem',
                    }}
                  >
                    {lane.description}
                  </Typography>
                </Box>

                {/* Nodes in this lane */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
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
                mx: -2,
                backgroundColor: '#FAFAFA',
                borderTop: '2px dashed',
                borderBottom: '2px dashed',
                borderColor: 'divider',
                borderRadius: 0,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: 'text.disabled',
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
                color: 'text.disabled',
              }}
            >
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
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
        <Snackbar
          open={!!snackbar}
          autoHideDuration={3000}
          onClose={() => setSnackbar(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {snackbar && (
            <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>
              {snackbar.message}
            </Alert>
          )}
        </Snackbar>
      </Box>
  );
});
