import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography, Snackbar, Alert, useTheme, alpha, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { DragEndEvent, useDroppable } from '@dnd-kit/core';
import GridOnIcon from '@mui/icons-material/GridOn';
import { NodeCard } from './NodeCard';
import { useFlow } from '../../context/FlowContext';
import { useOptionalFlowDataContext } from '../../context/FlowDataContext';
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
  const flowDataContext = useOptionalFlowDataContext();
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'warning' | 'error' } | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [canvasElement, setCanvasElement] = useState<HTMLDivElement | null>(null);
  const [showPanHint, setShowPanHint] = useState(false);

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

  // Find primary goal position (for contextual highlighting)
  const primaryGoalPosition = flow.primaryGoalNodeId 
    ? gridLayout.get(flow.primaryGoalNodeId)
    : null;

  const handleNodeClick = (node: FlowNode) => {
    setSelection({ type: 'node', id: node.id });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Check if click was on canvas background or non-interactive elements
    const target = e.target as HTMLElement;
    
    // Deselect if clicking on:
    // 1. Canvas itself (e.target === e.currentTarget)
    // 2. Grid content containers
    // 3. Lane headers or background elements
    // But NOT on:
    // - Node cards (they have their own onClick)
    // - Drop zones
    // - Interactive elements
    
    const isClickOnBackground = 
      e.target === e.currentTarget || 
      target.classList.contains('grid-content') ||
      target.classList.contains('lane-header') ||
      !target.closest('[role="button"], button, [data-node-card]');
    
    if (isClickOnBackground) {
      setSelection({ type: 'overview' });
    }
  };

  // Space + Drag panning
  const [spacePressed, setSpacePressed] = React.useState(false);

  // Check for overflow and show hint if needed
  React.useEffect(() => {
    if (!canvasElement) return;

    const checkOverflow = () => {
      const hasHorizontalOverflow = canvasElement.scrollWidth > canvasElement.clientWidth;

      // Show hint if:
      // 1. Canvas overflows
      // 2. User hasn't panned before
      const hasPanned = localStorage.getItem('kxaxis-has-panned') === 'true';
      if (hasHorizontalOverflow && !hasPanned) {
        setShowPanHint(true);
      }
    };

    checkOverflow();
    
    // Re-check on resize
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(canvasElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasElement]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't activate space-pan if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Don't activate if any editable element has focus
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA' ||
          (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.code === 'Space' && !e.repeat && !isPanning) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanning]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (spacePressed && canvasElement) {
      setIsPanning(true);
      setPanStart({ 
        x: e.clientX, 
        y: e.clientY,
        scrollLeft: canvasElement.scrollLeft,
        scrollTop: canvasElement.scrollTop,
      });
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && canvasElement && spacePressed) {
      e.preventDefault();
      e.stopPropagation();
      
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      
      // Pan opposite to mouse movement (drag right = see content on left)
      canvasElement.scrollLeft = panStart.scrollLeft - dx;
      canvasElement.scrollTop = panStart.scrollTop - dy;

      // Mark as panned and hide hint on first successful pan
      if ((Math.abs(dx) > 5 || Math.abs(dy) > 5) && showPanHint) {
        localStorage.setItem('kxaxis-has-panned', 'true');
        setShowPanHint(false);
      }
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  // Shift + Mouse Wheel for horizontal scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (e.shiftKey && canvasElement) {
      e.preventDefault();
      canvasElement.scrollLeft += e.deltaY;
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

  // Merge refs for droppable and panning
  const setRefs = React.useCallback((node: HTMLDivElement | null) => {
    setCanvasElement(node);
    setCanvasDropRef(node);
  }, [setCanvasDropRef]);

  return (
      <Box
        ref={setRefs}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onKeyDown={(e) => {
          // Prevent spacebar from scrolling the canvas
          if (e.code === 'Space') {
            e.preventDefault();
          }
        }}
        tabIndex={0} // Make focusable so it can receive keyboard events
        sx={{
          flex: 1,
          position: 'relative',
          backgroundColor: isCanvasOver ? alpha(theme.palette.primary.main, 0.05) : 'background.default',
          overflow: 'auto', // Enable native scrollbars
          backgroundImage: `
            radial-gradient(circle, ${alpha('#FFFFFF', 0.08)} 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          transition: 'background-color 0.2s, cursor 0.15s',
          cursor: isPanning ? 'grabbing' : (spacePressed ? 'grab' : 'default'),
          userSelect: isPanning ? 'none' : 'auto',
          '&:focus': {
            outline: 'none', // Remove focus outline
          },
        }}
      >
        {/* Loading Overlay - Show when API is fetching data */}
        {flowDataContext?.isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              backgroundColor: alpha(theme.palette.background.default, 0.95),
              backdropFilter: 'blur(8px)',
              zIndex: 9999, // Top of everything
              pointerEvents: 'all', // Block interactions
            }}
          >
            <CircularProgress
              size={48}
              thickness={3.5}
              sx={{
                color: theme.palette.primary.main,
              }}
            />
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                letterSpacing: 0.3,
              }}
            >
              Loading conversation flow...
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: alpha(theme.palette.text.secondary, 0.6),
                fontSize: '0.75rem',
              }}
            >
              Fetching from API
            </Typography>
          </Box>
        )}

        {/* Subtle Pan Hint (Discoverability) */}
        {showPanHint && (
          <Box
            sx={{
              position: 'fixed',
              top: 240, // Below the top bar
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000, // High z-index to stay above everything
              px: 2,
              py: 1,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(8px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              opacity: 0.7,
              pointerEvents: 'none', // Don't block clicks
              animation: 'fadeIn 0.3s ease-out',
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateX(-50%) translateY(-8px)' },
                to: { opacity: 0.7, transform: 'translateX(-50%) translateY(0)' },
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                color: 'text.secondary',
                fontWeight: 500,
                letterSpacing: 0.3,
              }}
            >
              Hold <Box component="kbd" sx={{ 
                px: 0.75, 
                py: 0.25, 
                borderRadius: 0.5, 
                backgroundColor: alpha('#000', 0.1),
                fontFamily: 'monospace',
                fontSize: '0.7rem',
              }}>Space</Box> to Pan
            </Typography>
          </Box>
        )}

        {/* Active Panning Indicator */}
        {isPanning && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              px: 2,
              py: 0.75,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.9),
              backdropFilter: 'blur(8px)',
              boxShadow: `0 4px 12px ${alpha('#000', 0.2)}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                color: '#fff',
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Panning
            </Typography>
          </Box>
        )}
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
          {columns.map(col => {
            const isPrimaryGoalLane = primaryGoalPosition?.gridCol === col;
            
            return (
              <Box
                key={`lane-divider-${col}`}
                sx={{
                  position: 'relative',
                  backgroundColor: 'transparent',
                  borderRight: col < columns.length - 1 
                    ? `2px dotted ${alpha(theme.palette.primary.main, 0.25)}`
                    : 'none',
                  '&::before': (col % 2 !== 0 || isPrimaryGoalLane) ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: -24, // Extend background to the left
                    right: 0, // Extend background to the right
                    backgroundColor: isPrimaryGoalLane 
                      ? alpha('#FFD700', 0.07) // Gold tint for primary goal lane
                      : alpha(theme.palette.info.main, 0.06), // Default alternating tint
                    zIndex: -1,
                  } : {},
                }}
              />
            );
          })}
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
            {/* Continuous Progression Rail - Primary Visual Anchor */}
            <Box
              sx={{
                position: 'absolute',
                top: 32,
                left: 32,
                right: 32,
                height: 4,
                background: `linear-gradient(to right, 
                  ${alpha(theme.palette.info.main, 0.5)}, 
                  ${alpha(theme.palette.info.main, 0.2)})`,
                borderRadius: 2,
                zIndex: 0,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: 0,
                  right: 0,
                  height: 8,
                  background: `linear-gradient(to right, 
                    ${alpha(theme.palette.info.main, 0.15)}, 
                    ${alpha(theme.palette.info.main, 0.05)})`,
                  filter: 'blur(4px)',
                  borderRadius: 4,
                },
                '&::after': {
                  content: '"→"',
                  position: 'absolute',
                  right: -20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: alpha(theme.palette.info.main, 0.3),
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
              // Simple ordinal number
              const ordinal = col + 1;
              
              // Check if this lane contains the primary goal
              const isPrimaryGoalLane = primaryGoalPosition?.gridCol === col;
              
              return (
                <Box
                  key={`header-${col}`}
                  sx={{
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      pb: 1,
                      pr: 2,
                      backgroundColor: isPrimaryGoalLane
                        ? alpha('#FFD700', 0.08)
                        : 'transparent',
                      borderRadius: '32px 8px 8px 8px', // Round left side to embrace circle
                      border: '1px solid',
                      borderColor: isPrimaryGoalLane
                        ? alpha('#FFD700', 0.25)
                        : alpha('#FFFFFF', 0.08),
                      position: 'relative',
                      mx: 1,
                      boxShadow: isPrimaryGoalLane
                        ? `0 1px 4px ${alpha('#FFD700', 0.15)}`
                        : 'none',
                    }}
                  >
                    {/* Dominant Lane Number - Progression Anchor */}
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        flexShrink: 0,
                        // Progression uses cool blue/gray, Primary Goal adds warm accent
                        backgroundColor: isPrimaryGoalLane 
                          ? `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.9)}, ${alpha('#FFD700', 0.4)})`
                          : alpha(theme.palette.info.main, 0.9),
                        border: isPrimaryGoalLane
                          ? `3px solid ${alpha('#FFD700', 0.9)}`
                          : `3px solid ${alpha('#FFFFFF', 0.4)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        boxShadow: isPrimaryGoalLane
                          ? `0 4px 16px ${alpha('#FFD700', 0.4)}, 0 2px 8px ${alpha('#000000', 0.3)}`
                          : `0 4px 12px ${alpha(theme.palette.info.main, 0.4)}, 0 2px 6px ${alpha('#000000', 0.25)}`,
                        background: isPrimaryGoalLane
                          ? `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.9)}, ${alpha('#FFD700', 0.4)})`
                          : alpha(theme.palette.info.main, 0.9),
                      }}
                    >
                      {ordinal}
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        letterSpacing: 0.8,
                        color: isPrimaryGoalLane ? alpha('#FFD700', 0.9) : alpha('#FFFFFF', 0.5),
                        fontSize: '0.65rem',
                        display: 'block',
                      }}
                    >
                      {col === 0 ? 'Initially Available' : 'Next'}
                    </Typography>
                  
                  <Typography
                    variant="caption"
                    sx={{
                      color: isPrimaryGoalLane ? alpha('#FFD700', 0.5) : alpha('#FFFFFF', 0.3),
                      fontSize: '0.6rem',
                      display: 'block',
                      mt: 0.5,
                      fontWeight: 400,
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
              
              // Check if this row contains the primary goal
              const isPrimaryGoalRow = primaryGoalPosition?.gridRow === rowIndex;
              
              return (
                <Box
                  key={`row-${rowIndex}`}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns.length}, ${GRID.COL_WIDTH}px)`,
                    gap: `${GRID.GUTTER_X}px`,
                    minHeight: GRID.ROW_HEIGHT,
                    position: 'relative',
                    // Subtle row highlight for primary goal (optional, weaker signal)
                    ...(isPrimaryGoalRow && {
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: alpha('#FFD700', 0.03),
                        borderTop: `1px solid ${alpha('#FFD700', 0.15)}`,
                        borderBottom: `1px solid ${alpha('#FFD700', 0.15)}`,
                        zIndex: -1,
                        pointerEvents: 'none',
                      },
                    }),
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
                          width: '100%', // Ensure cell fills column width
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
