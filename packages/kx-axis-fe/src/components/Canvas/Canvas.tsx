import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography, Snackbar, Alert, useTheme, alpha, IconButton, Tooltip } from '@mui/material';
import { DragEndEvent, useDroppable } from '@dnd-kit/core';
import GridOnIcon from '@mui/icons-material/GridOn';
import { NodeCard } from './NodeCard';
import { useFlow } from '../../context/FlowContext';
import type { FlowNode } from '../../types';
import { computeGridLayout } from '../../utils/gridLayout';
import { GRID } from '../../utils/gridSystem';

export interface CanvasHandle {
  handleDragEnd: (event: DragEndEvent) => void;
}

interface CanvasProps {}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>((_, ref) => {
  const { flow, selection, setSelection, addNode, updateNode } = useFlow();
  const theme = useTheme();
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'warning' | 'error' } | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Make entire canvas a drop zone
  const { setNodeRef: setCanvasDropRef, isOver: isCanvasOver } = useDroppable({
    id: 'canvas-drop-zone',
    data: {
      type: 'canvas',
    },
  });

  // Compute grid layout for all nodes
  const gridLayout = computeGridLayout(flow.nodes);
  
  // Determine how many columns we need
  const maxCol = Math.max(...Array.from(gridLayout.values()).map(p => p.gridCol), -1);
  const columns = maxCol >= 0 ? Array.from({ length: maxCol + 1 }, (_, i) => i) : [];
  
  // Group nodes by row
  const maxRow = Math.max(...Array.from(gridLayout.values()).map(p => p.gridRow), 0);
  const rows = Array.from({ length: maxRow + 1 }, (_, i) => i);
  
  const nodesByRow = new Map<number, Array<{ node: FlowNode; col: number }>>();
  rows.forEach(row => nodesByRow.set(row, []));
  
  flow.nodes.forEach(node => {
    const pos = gridLayout.get(node.id);
    if (pos) {
      nodesByRow.get(pos.gridRow)!.push({ node, col: pos.gridCol });
    }
  });

  const handleNodeClick = (node: FlowNode) => {
    setSelection({ type: 'node', id: node.id });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelection({ type: 'overview' });
    }
  };

  // Handle drag end - add new nodes from palette or add dependencies
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // Check if dropped on a node's right-side drop zone (dependency extension)
      if (over && over.data.current?.type === 'dependency-extension') {
        const targetNode = over.data.current?.targetNode as FlowNode;
        
        // CASE 1: Palette item dropped on a node's drop zone
        if (active.data.current?.type === 'palette-item') {
          const item = active.data.current?.item;
          
          // Get the createNodeFromItem function from window (set by palette)
          const createNodeFromItem = (window as any).__createNodeFromItem;
          
          if (createNodeFromItem && item && targetNode) {
            const newNode = createNodeFromItem(item);
            
            // Get facts produced by target node
            const targetProduces = targetNode.produces || [];
            
            // Add target's produced facts as requirements (only if target produces facts)
            const additionalRequires = targetProduces.length > 0 ? targetProduces : [];
            
            // Merge with any default requires
            const currentRequires = newNode.requires || [];
            const updatedRequires = [...currentRequires];
            
            additionalRequires.forEach(req => {
              if (!updatedRequires.includes(req)) {
                updatedRequires.push(req);
              }
            });
            
            newNode.requires = updatedRequires;
            
            // Node will auto-position based on grid layout
            addNode(newNode);
            setSelection({ type: 'node', id: newNode.id });
            
            setSnackbar({
              message: `Added "${newNode.title}" with dependency on "${targetNode.title}"`,
              severity: 'success',
            });
          }
          return;
        }
        
        // CASE 2: Existing node dropped on another node's drop zone
        const draggedNode = active.data.current?.node as FlowNode;
        
        if (draggedNode && targetNode && draggedNode.id !== targetNode.id) {
          // Add target node's produced facts as prerequisites
          const currentRequires = draggedNode.requires || [];
          
          // Get facts produced by target node
          const targetProduces = targetNode.produces || [];
          
          // Add all produced facts as requirements (only if target produces facts)
          const newRequirements = targetProduces.length > 0 ? targetProduces : [];
          
          const updatedRequires = [...currentRequires];
          let added = false;
          
          newRequirements.forEach(req => {
            if (!updatedRequires.includes(req)) {
              updatedRequires.push(req);
              added = true;
            }
          });
          
          if (added) {
            // Update the node with new requirements - this will trigger re-computation
            updateNode(draggedNode.id, {
              requires: updatedRequires,
            });
            
            setSnackbar({
              message: `"${draggedNode.title}" now requires "${targetNode.title}"`,
              severity: 'success',
            });
          }
        }
        return;
      }

      // Check if dropped on a node's bottom drop zone (parallel placement)
      if (over && over.data.current?.type === 'parallel-placement') {
        const targetNode = over.data.current?.targetNode as FlowNode;
        
        // CASE 1: Palette item dropped on bottom zone
        if (active.data.current?.type === 'palette-item') {
          const item = active.data.current?.item;
          
          // Get the createNodeFromItem function from window (set by palette)
          const createNodeFromItem = (window as any).__createNodeFromItem;
          
          if (createNodeFromItem && item && targetNode) {
            const newNode = createNodeFromItem(item);
            
            // Inherit the SAME prerequisites as target node (no new dependencies)
            const targetRequires = targetNode.requires || [];
            
            // Merge with any default requires
            const currentRequires = newNode.requires || [];
            const updatedRequires = [...currentRequires];
            
            targetRequires.forEach(req => {
              if (!updatedRequires.includes(req)) {
                updatedRequires.push(req);
              }
            });
            
            newNode.requires = updatedRequires;
            
            // Node will auto-position at the same depth as target (parallel)
            addNode(newNode);
            setSelection({ type: 'node', id: newNode.id });
            
            setSnackbar({
              message: `Added "${newNode.title}" as parallel item (same eligibility as "${targetNode.title}")`,
              severity: 'success',
            });
          }
          return;
        }
        
        // CASE 2: Existing node dropped on bottom zone
        const draggedNode = active.data.current?.node as FlowNode;
        
        if (draggedNode && targetNode && draggedNode.id !== targetNode.id) {
          // Make dragged node have SAME prerequisites as target (parallel placement)
          const targetRequires = targetNode.requires || [];
          
          // Replace dragged node's requirements with target's requirements
          updateNode(draggedNode.id, {
            requires: [...targetRequires],
          });
          
          setSnackbar({
            message: `"${draggedNode.title}" is now parallel with "${targetNode.title}" (same eligibility)`,
            severity: 'success',
          });
        }
        return;
      }

      // Check if this is a palette item being dropped on canvas
      const isPaletteItem = active.data.current?.type === 'palette-item';
      
      if (isPaletteItem && active.data.current) {
        // Handle palette item drop on canvas background
        const item = active.data.current.item;
        
        // Get the createNodeFromItem function from window (set by palette)
        const createNodeFromItem = (window as any).__createNodeFromItem;
        
        if (createNodeFromItem) {
          const newNode = createNodeFromItem(item);
          
          // Node will auto-snap to computed grid position
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
        message: 'Dependency tree updated',
        severity: 'success',
      });
    },
    [flow, addNode, updateNode, setSelection]
  );

  // Expose handleDragEnd to parent via ref
  useImperativeHandle(ref, () => ({
    handleDragEnd,
  }), [handleDragEnd]);

  return (
      <Box
        ref={setCanvasDropRef}
        onClick={handleCanvasClick}
        sx={{
          flex: 1,
          position: 'relative',
          backgroundColor: isCanvasOver ? alpha(theme.palette.primary.main, 0.05) : 'background.default',
          overflow: 'auto',
          backgroundImage: `
            radial-gradient(circle, ${alpha('#FFFFFF', 0.08)} 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          transition: 'background-color 0.2s',
        }}
      >
         {/* Lane Dividers - Clear Vertical Boundaries */}
         <Box
           sx={{
             position: 'absolute',
             top: 0,
             left: 36, // Correct offset for dividers
             minHeight: 'calc(100vh + 1000px)',
             display: 'grid',
             gridTemplateColumns: `repeat(${columns.length}, ${GRID.COL_WIDTH}px)`,
             gap: `${GRID.GUTTER_X}px`,
             pointerEvents: 'none',
             zIndex: 6, // Above headers (headers are zIndex: 5)
           }}
         >
          {columns.map(col => (
            <Box
              key={`lane-divider-${col}`}
              sx={{
                position: 'relative',
                backgroundColor: 'transparent', // Subtle blue tint for alternating lanes
                borderRight: col < columns.length - 1 
                  ? `2px dotted ${alpha(theme.palette.primary.main, 0.25)}`
                  : 'none',
                '&::before': col % 2 !== 0 ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: -24, // Extend background to the left
                  right: 0, // Extend background to the right
                  backgroundColor: alpha(theme.palette.info.main, 0.06),
                  zIndex: -1,
                } : {},
              }}
            />
          ))}
        </Box>

        {/* Canvas Framing - Mental Model Anchor */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            py: 1.5,
            px: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'text.primary',
                letterSpacing: 0.3,
                mb: 0.5,
              }}
            >
              As the conversation progresses, more becomes available →
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, mt: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  color: alpha(theme.palette.text.secondary, 0.6),
                }}
              >
                <Box component="span" sx={{ fontWeight: 600 }}>→</Box> Right-drop creates dependencies
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  color: alpha(theme.palette.text.secondary, 0.6),
                }}
              >
                <Box component="span" sx={{ fontWeight: 600 }}>↓</Box> Bottom-drop creates parallel items
              </Typography>
            </Box>
          </Box>
          
          <Tooltip title="Toggle grid debug overlay">
            <IconButton
              size="small"
              onClick={() => setDebugMode(!debugMode)}
              sx={{
                color: debugMode ? 'primary.main' : 'text.secondary',
              }}
            >
              <GridOnIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Grid Canvas - Physical Row Containers */}
        <Box
          sx={{
            position: 'relative',
            minHeight: 'calc(100vh - 140px)',
            p: 3,
            pb: 60, // Extra bottom padding to ensure bottom drop zones are scrollable
          }}
        >
          {/* Column Headers (Sticky) */}
          <Box
            sx={{
              position: 'relative',
              mb: 2,
            }}
          >
            {/* Continuous Directional Spine */}
            <Box
              sx={{
                position: 'absolute',
                top: 40,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(to right, 
                  ${alpha(theme.palette.primary.main, 0.3)}, 
                  ${alpha(theme.palette.primary.main, 0.15)})`,
                zIndex: 1,
                '&::after': {
                  content: '"→"',
                  position: 'absolute',
                  right: -8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: alpha(theme.palette.primary.main, 0.4),
                },
              }}
            />
            
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns.length}, ${GRID.COL_WIDTH}px)`,
                gap: `${GRID.GUTTER_X}px`,
                position: 'sticky',
                top: 60,
                zIndex: 5,
                backgroundColor: alpha(theme.palette.background.default, 0.95),
                backdropFilter: 'blur(8px)',
                pb: 2,
              }}
            >
            {columns.map(col => {
              // Progressive intensity for visual progression (0.08 → 0.04)
              const intensity = 0.08 - (col * 0.01);
              
              // Simple ordinal number
              const ordinal = col + 1;
              
              return (
                <Box
                  key={`header-${col}`}
                  sx={{
                    position: 'relative',
                  }}
                >
                  {/* Prominent Lane Ordinal (Column Anchor) */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 15,
                      left: 16,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: alpha('#FFFFFF', 0.75),
                      zIndex: 2,
                      boxShadow: `0 2px 8px ${alpha('#000000', 0.3)}`,
                    }}
                  >
                    {ordinal}
                  </Box>
                  
                  <Box
                    sx={{
                      p: 1.5,
                      pb: 1,
                      pl: 6, // Extra left padding to accommodate the ordinal badge
                      pr: 2, // Extra right padding for spacing from lane divider
                      backgroundColor: alpha(theme.palette.info.main, Math.max(intensity + 0.05, 0.08)),
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: alpha('#FFFFFF', 0.12),
                      position: 'relative',
                      mx: 1, // Horizontal margin for breathing room from lane dividers
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: 1,
                        color: alpha('#FFFFFF', 0.9),
                        fontSize: '0.7rem',
                        display: 'block',
                      }}
                    >
                      {col === 0 ? 'Initially Available' : 'Next'}
                    </Typography>
                  
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha('#FFFFFF', 0.4),
                      fontSize: '0.65rem',
                      display: 'block',
                      mt: 0.5,
                    }}
                  >
                    {col === 0 ? 'No prerequisites' : 'Unlocked by previous'}
                  </Typography>
                  {debugMode && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        fontSize: '0.6rem',
                        color: 'primary.main',
                        fontWeight: 600,
                      }}
                    >
                      Col {col}
                    </Typography>
                  )}
                  </Box>
                </Box>
              );
            })}
            </Box>
          </Box>

          {/* Physical Row Containers */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: `${GRID.GUTTER_Y}px`,
            }}
          >
            {rows.map(rowIndex => {
              const nodesInRow = nodesByRow.get(rowIndex) || [];
              if (nodesInRow.length === 0) return null;
              
              // Sort nodes by column for proper grid placement
              const sortedNodes = [...nodesInRow].sort((a, b) => a.col - b.col);
              
              return (
                <Box
                  key={`row-${rowIndex}`}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns.length}, ${GRID.COL_WIDTH}px)`,
                    gap: `${GRID.GUTTER_X}px`,
                    minHeight: GRID.ROW_HEIGHT,
                    position: 'relative',
                    // Row debug overlay
                    ...(debugMode && {
                      outline: `2px dashed ${alpha(theme.palette.secondary.main, 0.3)}`,
                      outlineOffset: '-2px',
                    }),
                  }}
                >
                  {/* Debug row label */}
                  {debugMode && (
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        top: -20,
                        left: 0,
                        fontSize: '0.65rem',
                        color: 'secondary.main',
                        fontWeight: 600,
                      }}
                    >
                      Row {rowIndex}
                    </Typography>
                  )}
                  
                  {/* Create cells for all columns */}
                  {columns.map(colIndex => {
                    // Find all nodes in this cell (col, row)
                    const nodesInCell = sortedNodes.filter(n => n.col === colIndex);
                    
                    if (nodesInCell.length === 0) {
                      // Empty cell
                      return (
                        <Box
                          key={`cell-${rowIndex}-${colIndex}`}
                          sx={{
                            gridColumn: colIndex + 1,
                            minHeight: GRID.ROW_HEIGHT,
                            // Debug empty cell
                            ...(debugMode && {
                              border: `1px dotted ${alpha(theme.palette.primary.main, 0.2)}`,
                            }),
                          }}
                        />
                      );
                    }
                    
                    // Cell with nodes (stack vertically if multiple)
                    return (
                      <Box
                        key={`cell-${rowIndex}-${colIndex}`}
                        sx={{
                          gridColumn: colIndex + 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                          minHeight: GRID.ROW_HEIGHT,
                          // Add extra padding for last row to ensure drop zones are visible
                          pb: rowIndex === maxRow ? 8 : 0,
                        }}
                      >
                        {nodesInCell.map(({ node }, nodeIndex) => {
                          // Check if this is the last node in this cell (for expanding bottom drop zone)
                          const isLastInCell = nodeIndex === nodesInCell.length - 1;
                          
                          return (
                            <NodeCard
                              key={node.id}
                              node={node}
                              isSelected={selection.type === 'node' && selection.id === node.id}
                              onClick={() => handleNodeClick(node)}
                              isDraggable={true}
                              isLastInLane={isLastInCell}
                            />
                          );
                        })}
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
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
              No capabilities defined
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3 }}>
              Add conversation capabilities from the palette to define what becomes possible
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
