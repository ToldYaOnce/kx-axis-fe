/**
 * Execution Mode - Full-page simulator UI
 * 
 * DESIGN LAW:
 * The tree is structural. The chat is illustrative.
 * Chat shows what happened. Tree shows why reality diverged.
 * 
 * PROGRESSIVE FOCUS:
 * - Playback Focus (default): Single branch → Tree narrow, Chat wide
 * - Branching Focus (auto): Multiple branches → Tree wide, Chat medium, Readiness collapsed
 * 
 * When there is one path, show the conversation.
 * When there are many paths, show the structure.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useSimulator } from '../../context/SimulatorContext';
import { ScenarioBar } from './ScenarioBar';
import { ExecutionTree } from './ExecutionTree';
import { Playback } from './Playback';
import { ReadinessPanel } from './ReadinessPanel';

const TREE_MIN_WIDTH = 260;
const TREE_MAX_WIDTH_PERCENT = 0.4;
const TREE_DEFAULT_NARROW = 280;
const TREE_DEFAULT_WIDE = 450;
const BRANCHING_DEPTH_THRESHOLD = 3;

// ExecutionMode now expects SimulatorProvider to be provided by parent (e.g., FlowSimulatorRoute)
export const ExecutionMode: React.FC = () => {
  const { currentRun } = useSimulator();
  const [treeWidth, setTreeWidth] = useState(TREE_DEFAULT_NARROW);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFocusModeRef = useRef<boolean>(false);

  // Detect branching complexity (auto-trigger branching focus)
  const branchCount = currentRun?.branches.length || 0;
  const maxDepth = currentRun?.nodes.reduce((max, node) => Math.max(max, node.turnNumber), 0) || 0;
  const isBranchingFocus = branchCount > 1 || maxDepth > BRANCHING_DEPTH_THRESHOLD;

  // Auto-adjust tree width based on focus mode (only when mode actually changes)
  useEffect(() => {
    if (!isResizing && lastFocusModeRef.current !== isBranchingFocus) {
      lastFocusModeRef.current = isBranchingFocus;
      setTreeWidth(isBranchingFocus ? TREE_DEFAULT_WIDE : TREE_DEFAULT_NARROW);
    }
  }, [isBranchingFocus, isResizing]);

  // Resize handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const maxWidth = containerRect.width * TREE_MAX_WIDTH_PERCENT;
      const newWidth = Math.min(Math.max(e.clientX - containerRect.left, TREE_MIN_WIDTH), maxWidth);
      
      setTreeWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <Box sx={{ 
      flex: 1,
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      minHeight: 0,
      maxHeight: '100%',
    }}>
      {/* Top Bar */}
      <Box sx={{ flexShrink: 0 }}>
        <ScenarioBar />
      </Box>

      {/* Main Content */}
      <Box ref={containerRef} sx={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden', 
        minHeight: 0, 
        minWidth: 0,
      }}>
        {/* Left: Execution Tree (resizable) */}
        <Box sx={{ 
          width: treeWidth, 
          height: '100%',  // ✅ Fill parent height
          flexShrink: 0, 
          minHeight: 0,
          position: 'relative',
        }}>
          <ExecutionTree isCompact={!isBranchingFocus} />
          
          {/* Drag Handle - Absolutely positioned on right edge */}
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 8,
              cursor: 'ew-resize',
              backgroundColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              '&:hover': {
                backgroundColor: 'primary.light',
              },
              transition: 'background-color 0.2s',
            }}
          >
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                backgroundColor: 'background.paper',
                boxShadow: 1,
                padding: 0.5,
                '&:hover': {
                  backgroundColor: 'background.paper',
                },
              }}
            >
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Center: Playback */}
        <Playback />

        {/* Right: Readiness Panel (collapsible in branching focus) */}
        <ReadinessPanel isCollapsed={isBranchingFocus} />
      </Box>
    </Box>
  );
};

