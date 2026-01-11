import React, { useState, useRef, useCallback } from 'react';
import { Box, Typography, Button, Paper, Snackbar, Alert } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
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

export const Canvas: React.FC = () => {
  const { flow, selection, setSelection, addNode, updateNode } = useFlow();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'warning' | 'error' } | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

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

      // Check if this is a palette item being dropped
      const isPaletteItem = active.data.current?.type === 'palette-item';
      
      if (isPaletteItem) {
        // Handle palette item drop
        if (!canvasRef.current) return;

        const item = active.data.current.item;
        const canvasWidth = canvasRef.current.offsetWidth;
        
        // Determine which lane based on drop position
        // We need to estimate the drop position - use the canvas center + delta as approximation
        const dropX = canvasWidth / 2 + delta.x;
        const targetLane = getLaneAtPosition(dropX, canvasWidth);

        // Get the createNodeFromItem function from window (set by palette)
        const createNodeFromItem = (window as any).__createNodeFromItem;
        
        if (createNodeFromItem) {
          const newNode = createNodeFromItem(item, targetLane);
          
          // Position the node based on drop location
          newNode.ui = {
            ...newNode.ui!,
            x: dropX,
            y: 100, // Default y position in lane
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

      if (!node || !canvasRef.current) return;

      // Calculate new position
      const currentX = node.ui?.x || 0;
      const newX = currentX + delta.x;

      // Determine which lane the node is now in
      const canvasWidth = canvasRef.current.offsetWidth;
      const targetLane = getLaneAtPosition(newX, canvasWidth);
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
        
        // Update position
        const finalNode = {
          ...updatedNode,
          ui: {
            ...updatedNode.ui!,
            x: newX,
            y: (node.ui?.y || 0) + delta.y,
          },
        };

        updateNode(nodeId, finalNode);

        setSnackbar({
          message: `Moved to ${LANE_CONFIG[targetLane].label}`,
          severity: 'success',
        });
      } else {
        // Just update position within same lane
        updateNode(nodeId, {
          ui: {
            ...node.ui!,
            x: newX,
            y: (node.ui?.y || 0) + delta.y,
          },
        });
      }
    },
    [flow.nodes, updateNode]
  );

  const lanes: EligibilityLane[] = ['BEFORE_CONTACT', 'CONTACT_GATE', 'AFTER_CONTACT', 'AFTER_BOOKING'];

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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

            return (
              <Box
                key={lane}
                sx={{
                  flex: 1,
                  borderRight: index < lanes.length - 1 ? '2px dashed' : 'none',
                  borderColor: 'divider',
                  position: 'relative',
                  px: 2,
                  py: 2,
                  minWidth: 280,
                }}
              >
                {/* Lane Header */}
                <Paper
                  elevation={0}
                  sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 5,
                    p: 1.5,
                    mb: 2,
                    backgroundColor: config.color,
                    border: '1px solid',
                    borderColor: 'divider',
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
                </Paper>

                {/* Nodes in this lane */}
                <Box sx={{ position: 'relative', minHeight: 400 }}>
                  {nodesInLane.map((node, nodeIndex) => (
                    <Box
                      key={node.id}
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: nodeIndex * 160, // Stack vertically with spacing
                      }}
                    >
                      <NodeCard
                        node={node}
                        isSelected={selection.type === 'node' && selection.id === node.id}
                        onClick={() => handleNodeClick(node)}
                        isDraggable={true}
                      />
                    </Box>
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
              </Box>
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
    </DndContext>
  );
};
