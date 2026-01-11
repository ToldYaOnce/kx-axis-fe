import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography, Button, Paper, Snackbar, Alert } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { DragEndEvent, useDroppable } from '@dnd-kit/core';
import { NodeCard } from './NodeCard';
import { useFlow } from '../../context/FlowContext';
import type { FlowNode, EligibilityLane } from '../../types';
import {
  calculateNodeLane,
  LANE_CONFIG,
  updateNodeForLane,
  validateNodeInLane,
  getLaneAtPosition,
} from '../../utils/laneLogic';

export interface CanvasHandle {
  handleDragEnd: (event: DragEndEvent) => void;
}

// Droppable Lane Component
const DroppableLane: React.FC<{ 
  lane: EligibilityLane; 
  children: React.ReactNode;
  isLast: boolean;
}> = ({ lane, children, isLast }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `lane-${lane}`,
    data: {
      lane,
    },
  });

  React.useEffect(() => {
    if (isOver) {
      console.log('🎨 HOVERING OVER LANE:', lane);
    }
  }, [isOver, lane]);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        position: 'relative',
        px: 2,
        py: 2,
        minWidth: 280,
        backgroundColor: isOver ? 'action.hover' : 'transparent',
        transition: 'background-color 0.2s',
        borderRight: !isLast ? '2px dashed' : 'none',
        borderColor: 'divider',
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

  // Group nodes by calculated lane
  const nodesByLane: Record<EligibilityLane, FlowNode[]> = {
    BEFORE_CONTACT: [],
    CONTACT_GATE: [],
    AFTER_CONTACT: [],
    AFTER_BOOKING: [],
  };

  flow.nodes.forEach((node) => {
    const lane = calculateNodeLane(node);
    nodesByLane[lane].push(node);
  });

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
      ui: {
        x: 100,
        y: 100,
        group: 'freeform',
        lane: 'BEFORE_CONTACT',
      },
    };
    addNode(newNode);
    setSelection({ type: 'node', id: newNode.id });
  };

  // Handle drag end - update node lane based on drop position OR add new node from palette
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta, over } = event;

      console.log('🎯 DRAG END:', {
        activeId: active.id,
        activeData: active.data.current,
        overId: over?.id,
        overData: over?.data.current,
        delta,
      });

      // Check if this is a palette item being dropped
      const isPaletteItem = active.data.current?.type === 'palette-item';
      
      console.log('📦 Is Palette Item?', isPaletteItem);
      
      if (isPaletteItem) {
        console.log('✅ PALETTE ITEM DETECTED!');
        // Handle palette item drop
        if (!canvasRef.current) return;

        const item = active.data.current.item;
        
        // Get the target lane from the droppable zone (same as existing node drag)
        const targetLane = over?.data.current?.lane as EligibilityLane | undefined;
        
        if (!targetLane) {
          console.log('❌ Dropped outside a valid lane');
          setSnackbar({
            message: 'Drop into a lane to add this node',
            severity: 'warning',
          });
          return;
        }

        console.log('🎯 Target lane:', targetLane);

        // Get the createNodeFromItem function from window (set by palette)
        const createNodeFromItem = (window as any).__createNodeFromItem;
        
        if (createNodeFromItem) {
          const newNode = createNodeFromItem(item, targetLane);
          
          // Set the target lane (flex layout handles spacing automatically)
          newNode.ui = {
            ...newNode.ui!,
            lane: targetLane,
          };

          addNode(newNode);
          setSelection({ type: 'node', id: newNode.id });
          
          setSnackbar({
            message: `Added "${newNode.title}" to ${LANE_CONFIG[targetLane].label}`,
            severity: 'success',
          });
        }
        return;
      }

      // Handle existing node drag (original logic)
      const nodeId = active.id as string;
      const node = flow.nodes.find((n) => n.id === nodeId);

      if (!node) return;

      // Get the target lane from the droppable zone
      const targetLane = over?.data.current?.lane as EligibilityLane | undefined;
      
      if (!targetLane) {
        // Dropped outside a valid lane - do nothing
        return;
      }
      
      const currentLane = calculateNodeLane(node);

      // If lane changed, update node semantically
      if (targetLane !== currentLane) {
        // Validate the move
        const error = validateNodeInLane(node, targetLane);
        
        if (error) {
          // Show warning but allow the move (it will update requires/satisfies)
          setSnackbar({
            message: `Moving to ${LANE_CONFIG[targetLane].label}: ${error}. Requirements will be updated.`,
            severity: 'warning',
          });
        }

        // Update node for new lane (this updates requires/satisfies)
        const updatedNode = updateNodeForLane(node, targetLane);

        updateNode(nodeId, updatedNode);

        setSnackbar({
          message: `Moved to ${LANE_CONFIG[targetLane].label}`,
          severity: 'success',
        });
      }
    },
    [flow.nodes, updateNode, addNode, setSelection]
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
        {/* Canvas Controls */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            display: 'flex',
            gap: 1,
          }}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAddNode}
            sx={{
              textTransform: 'none',
              backgroundColor: 'background.paper',
              color: 'text.primary',
              boxShadow: 1,
              '&:hover': {
                backgroundColor: 'background.default',
              },
            }}
          >
            Add Node
          </Button>
        </Box>

        {/* Eligibility Lanes */}
        <Box
          sx={{
            display: 'flex',
            height: '100%',
            minHeight: 600,
            pt: 8,
          }}
        >
          {lanes.map((lane, index) => {
            const config = LANE_CONFIG[lane];
            const nodesInLane = nodesByLane[lane];
            const isLast = index === lanes.length - 1;

            return (
                <DroppableLane key={lane} lane={lane} isLast={isLast}>
                {/* Lane Header */}
                <Box
                  sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 5,
                    p: 1.5,
                    mb: 2,
                    mx: -2, // Flush with lane edges
                    backgroundColor: config.color,
                    borderTop: '1px solid',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 0, // Square, no rounded corners
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
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
                      {config.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.65rem',
                      }}
                    >
                      {config.description}
                    </Typography>
                  </Box>
                  
                  {/* Double chevron pointing right (or spacer for last column) */}
                  <Box
                    sx={{
                      fontSize: '3.9rem',
                      fontWeight: 700,
                      color: isLast ? 'transparent' : 'rgba(0, 0, 0, 0.15)',
                      lineHeight: 1,
                      userSelect: 'none',
                      visibility: isLast ? 'hidden' : 'visible',
                    }}
                  >
                    »
                  </Box>
                </Box>

                {/* Nodes in this lane */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {nodesInLane.map((node) => (
                    <NodeCard
                      key={node.id}
                      node={node}
                      isSelected={selection.type === 'node' && selection.id === node.id}
                      onClick={() => handleNodeClick(node)}
                      isDraggable={true}
                    />
                  ))}

                  {nodesInLane.length === 0 && (
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
            );
          })}
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
              No nodes yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3 }}>
              Click "Add Node" to start building your conversation flow
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
