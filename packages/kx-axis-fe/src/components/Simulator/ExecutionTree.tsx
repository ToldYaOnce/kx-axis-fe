/**
 * Execution Tree - Visual tree of branches and nodes
 * 
 * CORE INVARIANT:
 * Branches exist because the user said something different.
 * The agent merely responded.
 * 
 * Visual Rules:
 * - Branches originate at USER messages (marked with fork icon)
 * - Agent messages are deterministic outcomes (no fork affordance)
 * - Branch labels reflect USER causality: "Alternate Reply from Turn X"
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import SettingsIcon from '@mui/icons-material/Settings';
import { useSimulator } from '../../context/SimulatorContext';
import type { SimulationNode, SimulationBranch, SimulationRun } from '../../types/simulator';

// ========================================
// TREE MODEL (Parent-Child Hierarchy)
// ========================================

type TreeNode = SimulationNode & {
  children: TreeNode[];
};

// ========================================
// COLLAPSE CONFIGURATION
// ========================================

const LINEAR_FOLD_THRESHOLD = 6; // Fold linear runs longer than this
const AUTO_COLLAPSE_DEPTH = 2; // Auto-collapse divergences deeper than this
const LINEAR_FOLD_SHOW_EDGES = 2; // Show first N and last N nodes in fold

type CollapseKey = string; // 'diverge:nodeId' | 'branch:branchId' | 'linear:startNodeId'

// ========================================
// BUILD TREE FROM PARENT-CHILD RELATIONSHIPS
// ========================================

/**
 * Builds a true tree from parentNodeId relationships.
 * 
 * Algorithm:
 * 1. Index all nodes by nodeId
 * 2. Build children arrays for each node
 * 3. Attach children to parents via parentNodeId
 * 4. Return roots (nodes with parentNodeId === null)
 * 
 * Divergence detection: A node with children.length > 1 is a divergence point.
 */
function buildTree(nodes: SimulationNode[]): TreeNode[] {
  // Step 1: Index nodes by nodeId
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach(node => {
    nodeMap.set(node.nodeId, { ...node, children: [] });
  });

  // Step 2: Build parent-child relationships
  const roots: TreeNode[] = [];
  
  nodes.forEach(node => {
    const treeNode = nodeMap.get(node.nodeId)!;
    
    if (node.parentNodeId === null) {
      // Root node
      roots.push(treeNode);
    } else {
      // Attach to parent
      const parent = nodeMap.get(node.parentNodeId);
      if (parent) {
        parent.children.push(treeNode);
      } else {
        // Orphaned node (parent not found) - treat as root
        console.warn(`Node ${node.nodeId} has parentNodeId ${node.parentNodeId} but parent not found`);
        roots.push(treeNode);
      }
    }
  });

  // Step 3: Sort children by timestamp for consistent ordering
  const sortChildren = (node: TreeNode) => {
    node.children.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    node.children.forEach(sortChildren);
  };
  roots.forEach(sortChildren);

  return roots;
}

// ========================================
// COLLAPSE HELPERS
// ========================================

/**
 * Check if a node is a divergence point (has multiple children)
 */
const isDivergence = (node: TreeNode): boolean => {
  return node.children.length > 1;
};

/**
 * Compute linear run starting from a node.
 * Returns array of nodes in the straight-line segment.
 * Stops at first divergence or leaf.
 */
const computeLinearRun = (node: TreeNode): TreeNode[] => {
  const run: TreeNode[] = [node];
  let current = node;
  
  while (current.children.length === 1) {
    current = current.children[0];
    run.push(current);
  }
  
  return run;
};

/**
 * Get all ancestor node IDs from root to target node
 */
const getAncestryPath = (
  targetNodeId: string,
  nodeIndex: Map<string, TreeNode>
): Set<string> => {
  const path = new Set<string>();
  const target = nodeIndex.get(targetNodeId);
  if (!target) return path;
  
  let current: TreeNode | undefined = target;
  while (current) {
    path.add(current.nodeId);
    if (current.parentNodeId) {
      current = nodeIndex.get(current.parentNodeId);
    } else {
      break;
    }
  }
  
  return path;
};

/**
 * Count total turns in a subtree
 */
const countSubtreeTurns = (node: TreeNode): number => {
  let count = 1;
  for (const child of node.children) {
    count += countSubtreeTurns(child);
  }
  return count;
};

// ========================================
// RENDER COMPONENTS
// ========================================

interface TreeNodeProps {
  node: SimulationNode;
  isSelected: boolean;
  onSelect: () => void;
  debugMode: boolean;
}

const TurnCard: React.FC<TreeNodeProps> = ({ node, isSelected, onSelect, debugMode }) => {
  const getStatusIcon = () => {
    switch (node.status) {
      case 'VALID':
        return <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />;
      case 'DRIFTED':
        return <WarningIcon fontSize="small" sx={{ color: 'warning.main' }} />;
      case 'INVALID':
        return <ErrorIcon fontSize="small" sx={{ color: 'error.main' }} />;
    }
  };

  const getOutcomeIcon = (decision: string) => {
    const icons: Record<string, string> = {
      STALL: '⏸️',
      EXPLAIN: '💡',
      FAST_TRACK: '🚀',
      HANDOFF: '👋',
      NO_OP: '⊘',
    };
    return icons[decision] || '';
  };

  const getOutcomeColor = (decision: string) => {
    const colors: Record<string, string> = {
      STALL: 'warning.main',
      EXPLAIN: 'info.main',
      FAST_TRACK: 'secondary.main',
      HANDOFF: 'error.main',
      NO_OP: 'text.disabled',
    };
    return colors[decision] || 'text.secondary';
  };

  // Visual indicator: User messages are branch points
  const hasUserMessage = node.userMessage !== undefined && node.userMessage !== null;
  const decision = node.executionResult.executionDecision;
  const showOutcome = decision !== 'ADVANCE' || debugMode;
  
  // Prepare message snippet
  let messageSnippet = '';
  if (hasUserMessage) {
    messageSnippet = node.userMessage!.length > 60 
      ? node.userMessage!.substring(0, 60) + '...'
      : node.userMessage!;
  } else if (node.agentMessage) {
    messageSnippet = node.agentMessage.length > 60
      ? node.agentMessage.substring(0, 60) + '...'
      : node.agentMessage;
  }

  return (
    <Paper
      onClick={onSelect}
      sx={{
        p: 1.25,
        mb: 0.75,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        backgroundColor: isSelected ? 'primary.lighter' : 'background.paper',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: isSelected ? 'primary.lighter' : 'action.hover',
        },
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        // Stronger visual for user messages (branch anchors)
        borderLeft: hasUserMessage ? '3px solid' : '1px solid',
        borderLeftColor: hasUserMessage ? 'primary.main' : 'divider',
      }}
    >
      {/* Icon: User or Agent */}
      <Typography sx={{ fontSize: '1.2rem', flexShrink: 0 }}>
        {hasUserMessage ? '👤' : '📧'}
      </Typography>
      
      {/* Message snippet */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography 
          variant="body2"
          sx={{ 
            fontWeight: hasUserMessage ? 600 : 400,
            color: hasUserMessage ? 'text.primary' : 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.85rem',
          }}
        >
          {messageSnippet}
        </Typography>
        
        {/* Debug mode: show turn number + confidence */}
        {debugMode && (
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
            T{node.turnNumber} • {(node.controllerOutput.intent.confidence * 100).toFixed(0)}% confidence
          </Typography>
        )}
      </Box>
      
      {/* Status + Outcome badges */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        {/* Status icon (always visible if not VALID) */}
        {node.status !== 'VALID' && getStatusIcon()}
        
        {/* Outcome badge (only if non-ADVANCE or debug mode) */}
        {showOutcome && decision !== 'ADVANCE' && (
          <Chip
            label={`${getOutcomeIcon(decision)} ${decision}`}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.65rem',
              fontWeight: 600,
              color: getOutcomeColor(decision),
              bgcolor: 'transparent',
              border: '1px solid',
              borderColor: getOutcomeColor(decision),
            }}
          />
        )}
        
        {/* Debug mode: show ADVANCE explicitly */}
        {debugMode && decision === 'ADVANCE' && (
          <Chip
            label="ADVANCE"
            size="small"
            sx={{
              height: 20,
              fontSize: '0.6rem',
              bgcolor: 'success.light',
              color: 'success.dark',
            }}
          />
        )}
      </Box>
    </Paper>
  );
};

interface ExecutionTreeProps {
  isCompact?: boolean;
}

export const ExecutionTree: React.FC<ExecutionTreeProps> = ({ isCompact = false }) => {
  const { currentRun, activeBranchId, selectedNodeId, selectNode, selectBranch } = useSimulator();
  
  // Debug mode toggle (MUST be before early return)
  const [debugMode, setDebugMode] = useState(false);
  
  // Collapsed items tracked by key (MUST be before early return)
  const [collapsed, setCollapsed] = useState<Set<CollapseKey>>(new Set());
  
  // Track previous selected node to detect actual selection changes (MUST be before early return)
  const prevSelectedNodeIdRef = useRef<string | null>(null);

  // Build tree from parent-child relationships (safe to be conditional as it's not a hook)
  const treeRoots = currentRun ? buildTree(currentRun.nodes) : [];

  // Build node index for ancestry lookup (MUST be before early return)
  const nodeIndex = useMemo(() => {
    if (!currentRun) return new Map<string, TreeNode>();
    const index = new Map<string, TreeNode>();
    const indexNode = (node: TreeNode) => {
      index.set(node.nodeId, node);
      node.children.forEach(indexNode);
    };
    treeRoots.forEach(indexNode);
    return index;
  }, [currentRun, treeRoots]);

  // Compute ancestry path for selected node (MUST be before early return)
  const ancestryPath = useMemo(() => {
    if (!selectedNodeId || !currentRun) return new Set<string>();
    return getAncestryPath(selectedNodeId, nodeIndex);
  }, [selectedNodeId, nodeIndex, currentRun]);

  // Initialize auto-collapse on mount or when tree changes
  useEffect(() => {
    const initialCollapsed = new Set<CollapseKey>();
    
    const autoCollapseDeep = (node: TreeNode, currentDepth: number) => {
      // Auto-collapse divergences deeper than AUTO_COLLAPSE_DEPTH
      if (isDivergence(node) && currentDepth > AUTO_COLLAPSE_DEPTH) {
        // Don't collapse if node is in ancestry path
        if (!ancestryPath.has(node.nodeId)) {
          initialCollapsed.add(`diverge:${node.nodeId}`);
        }
      }
      
      node.children.forEach(child => autoCollapseDeep(child, currentDepth + 1));
    };
    
    treeRoots.forEach(root => autoCollapseDeep(root, 0));
    setCollapsed(initialCollapsed);
  }, [treeRoots.length]); // Only re-run when tree structure changes (avoid ancestryPath dependency)

  // Auto-expand to selection (only when selection actually changes)
  useEffect(() => {
    if (!selectedNodeId) return;
    
    // Only auto-expand if selection actually changed
    if (prevSelectedNodeIdRef.current === selectedNodeId) return;
    
    prevSelectedNodeIdRef.current = selectedNodeId;
    
    setCollapsed(prev => {
      const next = new Set(prev);
      let changed = false;
      
      // Expand all divergences in ancestry path
      ancestryPath.forEach(nodeId => {
        const key: CollapseKey = `diverge:${nodeId}`;
        if (next.has(key)) {
          next.delete(key);
          changed = true;
        }
      });
      
      return changed ? next : prev;
    });
  }, [selectedNodeId, ancestryPath]);

  // Toggle handlers
  const toggleCollapse = (key: CollapseKey) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => {
    setCollapsed(new Set());
  };

  const collapseAll = () => {
    const allDivergences = new Set<CollapseKey>();
    
    const findDivergences = (node: TreeNode, depth: number) => {
      if (isDivergence(node)) {
        // Keep ancestry path visible
        if (!ancestryPath.has(node.nodeId)) {
          allDivergences.add(`diverge:${node.nodeId}`);
        }
      }
      node.children.forEach(child => findDivergences(child, depth + 1));
    };
    
    treeRoots.forEach(root => findDivergences(root, 0));
    setCollapsed(allDivergences);
  };

  // Early return after all hooks (React hooks rules)
  if (!currentRun) {
    return (
      <Box sx={{ width: '100%', borderRight: '1px solid', borderColor: 'divider', p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          No execution tree
        </Typography>
      </Box>
    );
  }

  // ========================================
  // RECURSIVE RENDERER
  // ========================================
  
  /**
   * Renders a node recursively.
   * 
   * Divergence detection: If node.children.length > 1, it's a divergence point.
   * Show the node once, then render children beneath with visual connectors.
   * 
   * CRITICAL: Divergence can happen on ANY node (agent or user) if it has multiple children.
   */
  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    const isDiv = isDivergence(node);
    const hasChildren = node.children.length > 0;
    const isUserMessage = node.userMessage !== undefined && node.userMessage !== null;

    if (isDiv) {
      // DIVERGENCE NODE - ANY node with multiple paths
      // This happens when alternate replies branch from this point
      const divergeKey: CollapseKey = `diverge:${node.nodeId}`;
      const isCollapsed = collapsed.has(divergeKey);
      
      return (
        <Box key={node.nodeId} sx={{ ml: depth * 3 }}>
          {/* Node (shown once) */}
          <TurnCard
            node={node}
            isSelected={node.nodeId === selectedNodeId}
            onSelect={() => {
              selectBranch(node.branchId);
              selectNode(node.nodeId);
            }}
            debugMode={debugMode}
          />
          
          {/* Path count badge (clickable to toggle collapse) */}
          <Box sx={{ ml: 2, mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => toggleCollapse(divergeKey)}
              sx={{ p: 0.25, color: 'text.secondary' }}
            >
              {isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
            <Chip
              label={`${node.children.length} paths`}
              size="small"
              onClick={() => toggleCollapse(divergeKey)}
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 600,
                backgroundColor: 'warning.light',
                color: 'warning.dark',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'warning.main',
                },
              }}
            />
          </Box>
          
          {/* Show collapsed state or render children */}
          {isCollapsed ? (
            <Box
              sx={{
                ml: 4,
                py: 0.75,
                px: 1.5,
                backgroundColor: 'action.hover',
                borderRadius: 1,
                cursor: 'pointer',
              }}
              onClick={() => toggleCollapse(divergeKey)}
            >
              <Typography variant="caption" color="text.secondary">
                Collapsed: {node.children.length} paths • {countSubtreeTurns(node) - 1} turns hidden • 
                <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'primary.main', fontWeight: 600 }}>
                  Expand
                </Typography>
              </Typography>
            </Box>
          ) : null}
          
          {/* Render each child path (only if not collapsed) */}
          {!isCollapsed && node.children.map((child, idx) => {
            const isLast = idx === node.children.length - 1;
            
            // Get label for this path - prefer user message for clarity
            let pathLabel = '';
            if (child.userMessage) {
              const snippet = child.userMessage.length > 25 
                ? child.userMessage.substring(0, 25) + '...'
                : child.userMessage;
              pathLabel = idx === 0 ? `"${snippet}"` : `Alt: "${snippet}"`;
            } else if (child.agentMessage) {
              const snippet = child.agentMessage.length > 25
                ? child.agentMessage.substring(0, 25) + '...'
                : child.agentMessage;
              pathLabel = idx === 0 ? `"${snippet}"` : `Alt: "${snippet}"`;
            } else {
              pathLabel = idx === 0 ? 'Main path' : `Path ${idx + 1}`;
            }
            
            return (
              <Box
                key={child.nodeId}
                sx={{
                  ml: 2,
                  borderLeft: isLast ? 'none' : '2px solid',
                  borderColor: 'divider',
                  pl: 1.5,
                }}
              >
                {/* Path label */}
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    color: idx === 0 ? 'text.secondary' : 'primary.main',
                    fontWeight: 600,
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  {isLast ? '└─' : '├─'} {pathLabel}
                </Typography>
                
                {/* Render child subtree (recursive) */}
                {renderNode(child, depth + 1)}
              </Box>
            );
          })}
        </Box>
      );
    } else {
      // REGULAR NODE - check for linear run folding
      
      // Detect linear run starting from this node
      const linearRun = computeLinearRun(node);
      const isLongLinearRun = linearRun.length > LINEAR_FOLD_THRESHOLD;
      
      if (isLongLinearRun) {
        // LINEAR RUN FOLDING
        const linearKey: CollapseKey = `linear:${node.nodeId}`;
        const isLinearCollapsed = collapsed.has(linearKey);
        
        if (isLinearCollapsed) {
          // Render folded: first 2, fold indicator, last 2, then continue after run
          const firstNodes = linearRun.slice(0, LINEAR_FOLD_SHOW_EDGES);
          const lastNodes = linearRun.slice(-LINEAR_FOLD_SHOW_EDGES);
          const hiddenCount = linearRun.length - (LINEAR_FOLD_SHOW_EDGES * 2);
          const lastNode = linearRun[linearRun.length - 1];
          
          return (
            <Box key={node.nodeId}>
              {/* Render first N nodes */}
              {firstNodes.map(n => (
                <Box key={n.nodeId} sx={{ ml: depth * 3 }}>
                  <TurnCard
                    node={n}
                    isSelected={n.nodeId === selectedNodeId}
                    onSelect={() => {
                      selectBranch(n.branchId);
                      selectNode(n.nodeId);
                    }}
                    debugMode={debugMode}
                  />
                </Box>
              ))}
              
              {/* Fold indicator */}
              <Box
                sx={{
                  ml: depth * 3 + 3,
                  py: 0.5,
                  px: 1.5,
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  cursor: 'pointer',
                  my: 0.5,
                }}
                onClick={() => toggleCollapse(linearKey)}
              >
                <Typography variant="caption" color="text.secondary">
                  ⋯ Show {hiddenCount} more…
                </Typography>
              </Box>
              
              {/* Render last N nodes */}
              {lastNodes.map(n => (
                <Box key={n.nodeId} sx={{ ml: depth * 3 }}>
                  <TurnCard
                    node={n}
                    isSelected={n.nodeId === selectedNodeId}
                    onSelect={() => {
                      selectBranch(n.branchId);
                      selectNode(n.nodeId);
                    }}
                    debugMode={debugMode}
                  />
                </Box>
              ))}
              
              {/* Continue after linear run (if last node has children that aren't part of the run) */}
              {lastNode.children.length > 1 && lastNode.children.map(child => renderNode(child, depth))}
            </Box>
          );
        } else {
          // Render unfolded with collapse control
          return (
            <Box key={node.nodeId}>
              {/* All nodes in linear run */}
              {linearRun.map((n, idx) => (
                <Box key={n.nodeId} sx={{ ml: depth * 3 }}>
                  <TurnCard
                    node={n}
                    isSelected={n.nodeId === selectedNodeId}
                    onSelect={() => {
                      selectBranch(n.branchId);
                      selectNode(n.nodeId);
                    }}
                    debugMode={debugMode}
                  />
                  
                  {/* Add collapse button on first node */}
                  {idx === 0 && (
                    <Box sx={{ ml: 2, mb: 0.5 }}>
                      <Typography
                        variant="caption"
                        onClick={() => toggleCollapse(linearKey)}
                        sx={{
                          color: 'text.secondary',
                          cursor: 'pointer',
                          fontSize: '0.65rem',
                          '&:hover': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        ⋯ Fold {linearRun.length} turns
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
              
              {/* Continue after linear run */}
              {linearRun[linearRun.length - 1].children.length > 1 && 
                linearRun[linearRun.length - 1].children.map(child => renderNode(child, depth))}
            </Box>
          );
        }
      } else {
        // REGULAR NODE - render node + children normally
        return (
          <Box key={node.nodeId}>
            <Box sx={{ ml: depth * 3 }}>
              <TurnCard
                node={node}
                isSelected={node.nodeId === selectedNodeId}
                onSelect={() => {
                  selectBranch(node.branchId);
                  selectNode(node.nodeId);
                }}
                debugMode={debugMode}
              />
            </Box>
            
            {/* Render children (if any) */}
            {hasChildren && node.children.map(child => renderNode(child, depth))}
          </Box>
        );
      }
    }
  };

  return (
    <Box sx={{ width: '100%', borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Execution Tree
          </Typography>
          
          {/* Collapse/Expand controls */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => setDebugMode(!debugMode)}
              title="Toggle debug metadata"
              sx={{ 
                p: 0.5,
                color: debugMode ? 'primary.main' : 'text.secondary'
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={expandAll}
              title="Expand all"
              sx={{ p: 0.5 }}
            >
              <UnfoldMoreIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={collapseAll}
              title="Collapse all"
              sx={{ p: 0.5 }}
            >
              <UnfoldLessIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          {currentRun.branches.length} branch{currentRun.branches.length !== 1 ? 'es' : ''} • {currentRun.nodes.length} turn{currentRun.nodes.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Tree */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {/* Main branch label */}
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 700, 
            mb: 1.5,
            color: 'text.primary'
          }}
        >
          Main
        </Typography>
        
        {/* Render tree recursively from roots */}
        {treeRoots.map(root => renderNode(root, 0))}
      </Box>
    </Box>
  );
};

