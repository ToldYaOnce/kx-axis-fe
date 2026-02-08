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
  Tooltip,
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
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PanToolIcon from '@mui/icons-material/PanTool';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
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

// Shared tooltip styling for all tooltips
const TOOLTIP_STYLES = {
  tooltip: {
    sx: {
      bgcolor: 'rgba(0, 0, 0, 0.85)',
      color: 'white',
      fontSize: '0.75rem',
    },
  },
};

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
        
        // Debug: Log when adding siblings of same type
        const siblingsOfSameType = parent.children.filter(c => 
          (c.userMessage !== undefined) === (treeNode.userMessage !== undefined)
        );
        if (siblingsOfSameType.length > 1) {
          console.log('👥 SIBLINGS DETECTED:', {
            parentId: node.parentNodeId,
            parentMessage: (parent.userMessage || parent.agentMessage || '').substring(0, 50),
            newChildId: node.nodeId,
            newChildMessage: (node.userMessage || node.agentMessage || '').substring(0, 50),
            type: node.userMessage ? 'USER' : 'AGENT',
            totalSiblingsOfType: siblingsOfSameType.length,
            allSiblingIds: siblingsOfSameType.map(s => s.nodeId),
          });
        }
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
 * Check if a node is a divergence point (has multiple children OF THE SAME TYPE)
 * 
 * A fork only occurs when multiple children of the SAME type exist:
 * - Multiple USER responses to same AGENT = fork
 * - Multiple AGENT responses to same USER = fork (rare)
 * - User → Agent → User → Agent = linear (no fork)
 */
const isDivergence = (node: TreeNode): boolean => {
  // Group children by type
  const userChildren = node.children.filter(c => c.userMessage !== undefined);
  const agentChildren = node.children.filter(c => c.agentMessage !== undefined);
  
  // Debug logging for fork detection
  if (userChildren.length > 1 || agentChildren.length > 1) {
    console.log('🔀 FORK DETECTED at node:', {
      nodeId: node.nodeId,
      message: node.userMessage || node.agentMessage,
      userChildren: userChildren.length,
      agentChildren: agentChildren.length,
      userChildrenIds: userChildren.map(c => c.nodeId),
      agentChildrenIds: agentChildren.map(c => c.nodeId),
    });
  }
  
  // Divergence exists if multiple children of SAME type exist
  return userChildren.length > 1 || agentChildren.length > 1;
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
    const status = node.status || 'VALID';
    switch (status) {
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
      BRIDGE: '🔀',
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
      BRIDGE: '#8b5cf6',             // Purple (distinct from STALL)
      STALL: 'warning.main',         // Orange/warning
      EXPLAIN: 'info.main',          // Info blue
      FAST_TRACK: 'secondary.main',  // Cyan
      HANDOFF: '#ec4899',            // Magenta
      NO_OP: 'text.disabled',
    };
    return colors[decision] || 'text.secondary';
  };
  
  const getOutcomeBgColor = (decision: string) => {
    const colors: Record<string, string> = {
      BRIDGE: 'rgba(139, 92, 246, 0.15)',      // Purple glow
      STALL: 'rgba(167, 139, 250, 0.15)',      // Light purple glow
      EXPLAIN: 'rgba(59, 130, 246, 0.15)',     // Blue glow
      FAST_TRACK: 'rgba(34, 211, 238, 0.15)',  // Cyan glow
      HANDOFF: 'rgba(236, 72, 153, 0.15)',     // Magenta glow
      NO_OP: 'transparent',
    };
    return colors[decision] || 'transparent';
  };

  // Visual indicator: User messages are branch points
  const hasUserMessage = node.userMessage !== undefined && node.userMessage !== null;
  const hasAgentMessage = node.agentMessage !== undefined && node.agentMessage !== null;
  
  // Get decision from metadata (new API structure) or executionResult (old structure)
  // For new API: check decision.action (BRIDGE) first, then decision.move (ADVANCE)
  const decision = node.metadata?.decision?.action ||
                   node.metadata?.controllerOutput?.decision || 
                   node.executionResult?.executionDecision || 
                   'ADVANCE';
  
  // Show outcome for agent messages (always) or non-ADVANCE for any node in debug mode
  const showOutcome = hasAgentMessage || (decision !== 'ADVANCE' && debugMode);
  
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
      elevation={0}
      sx={{
        p: 1.25,
        mb: 0.75,
        cursor: 'pointer',
        border: isSelected ? '2px solid' : '1px solid',
        borderColor: isSelected 
          ? 'secondary.main' 
          : 'rgba(255, 255, 255, 0.05)',  // Very subtle border
        backgroundColor: isSelected
          ? (hasUserMessage 
              ? 'rgba(37, 99, 235, 0.2)'  // 20% blue tint when selected (user)
              : 'rgba(51, 65, 85, 0.4)')  // 40% slate tint when selected (agent)
          : (hasUserMessage 
              ? 'rgba(37, 99, 235, 0.1)'  // 10% blue tint (user)
              : 'rgba(51, 65, 85, 0.15)'),  // 15% slate tint (agent)
        borderRadius: 1,
        borderLeft: '3px solid',
        borderLeftColor: hasUserMessage ? 'primary.main' : 'secondary.main',  // Color-coded left accent
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: isSelected ? 'secondary.main' : 'rgba(34, 211, 238, 0.3)',
          backgroundColor: hasUserMessage 
            ? 'rgba(37, 99, 235, 0.15)'  // Slightly darker blue on hover
            : 'rgba(51, 65, 85, 0.25)',  // Slightly darker slate on hover
        },
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {/* Icon: User or Agent - Color-coded for quick scanning */}
      <Box sx={{ 
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: '50%',  // Circle for both user and agent
        backgroundColor: hasUserMessage 
          ? 'rgba(37, 99, 235, 0.15)'  // Subtle blue glow for user
          : 'rgba(34, 211, 238, 0.15)',  // Subtle cyan glow for agent
        border: '1px solid',
        borderColor: hasUserMessage 
          ? 'rgba(37, 99, 235, 0.3)'  // Subtle blue border for user
          : 'rgba(34, 211, 238, 0.3)',  // Subtle cyan border for agent
        color: hasUserMessage ? 'primary.main' : 'secondary.main',
      }}>
        {hasUserMessage ? (
          <PersonIcon fontSize="small" />
        ) : (
          <SmartToyIcon fontSize="small" sx={{ fontSize: '1.1rem' }} />  // Slightly larger robot icon
        )}
      </Box>
      
      {/* Message snippet */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography 
          variant="body2"
          sx={{ 
            fontWeight: hasUserMessage ? 600 : 400,
            color: 'text.primary',  // Standard text color for readability
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
            {node.turnNumber && `T${node.turnNumber}`}
            {node.metadata?.controllerOutput?.stepRecommendation?.decision?.confidence && 
              ` • ${(node.metadata.controllerOutput.stepRecommendation.decision.confidence * 100).toFixed(0)}% confidence`}
            {!node.turnNumber && !node.metadata?.controllerOutput?.stepRecommendation?.decision?.confidence && 'Debug info'}
          </Typography>
        )}
      </Box>
      
      {/* Status + Outcome badges */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        {/* Status icon (always visible if not VALID) */}
        {node.status && node.status !== 'VALID' && getStatusIcon()}
        
        {/* Outcome badge for agent messages */}
        {showOutcome && hasAgentMessage && (() => {
          // Build rich tooltip content
          const confidence = node.metadata?.controllerOutput?.stepRecommendation?.decision?.confidence;
          const reasons = node.metadata?.controllerOutput?.stepRecommendation?.rankedCandidates?.[0]?.reasons || [];
          
          // Format decision as title case
          const formatDecision = (dec: string) => {
            return dec.charAt(0) + dec.slice(1).toLowerCase();
          };
          
          // Get decision color
          const getDecisionColor = () => {
            if (decision === 'ADVANCE') return '#22d3ee';
            if (decision === 'BRIDGE') return '#8b5cf6';
            if (decision === 'STAY') return '#f59e0b';
            if (decision?.toUpperCase().includes('CLARIFY')) return '#ec4899';
            return '#94a3b8';
          };
          
          const tooltipContent = (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>
                  Decision:
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 700, 
                    color: getDecisionColor(),
                    textShadow: `0 0 8px ${getDecisionColor()}`,
                  }}
                >
                  {formatDecision(decision)}
                </Typography>
                {confidence && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                    ({(confidence * 100).toFixed(0)}% confident)
                  </Typography>
                )}
              </Box>
              {reasons.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Reasons:
                  </Typography>
                  {reasons.map((reason, idx) => (
                    <Typography 
                      key={idx} 
                      variant="caption" 
                      sx={{ 
                        color: 'rgba(255,255,255,0.9)', 
                        display: 'block',
                        fontSize: '0.75rem',
                        lineHeight: 1.4,
                        mb: 0.25,
                      }}
                    >
                      • {reason}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          );
          
          return (
            <Tooltip 
              title={tooltipContent} 
              placement="right"
              slotProps={{
                tooltip: {
                  sx: {
                    ...TOOLTIP_STYLES.tooltip.sx,
                    maxWidth: 300,
                    bgcolor: 'rgba(0, 0, 0, 0.92)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    '& .MuiTooltip-arrow': {
                      color: 'rgba(0, 0, 0, 0.92)',
                    },
                  },
                },
              }}
              arrow
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: decision === 'ADVANCE' 
                    ? 'rgba(34, 211, 238, 0.15)' 
                    : decision === 'STAY'
                    ? 'rgba(167, 139, 250, 0.15)'
                    : decision === 'BRIDGE'
                    ? 'rgba(139, 92, 246, 0.15)'
                    : decision?.toUpperCase().includes('CLARIFY')
                    ? 'rgba(236, 72, 153, 0.15)'
                    : getOutcomeBgColor(decision),
                  border: '1px solid',
                  borderColor: decision === 'ADVANCE' 
                    ? 'secondary.main' 
                    : decision === 'STAY'
                    ? 'warning.main'
                    : decision === 'BRIDGE'
                    ? '#8b5cf6'
                    : decision?.toUpperCase().includes('CLARIFY')
                    ? '#ec4899'
                    : getOutcomeColor(decision),
                  color: decision === 'ADVANCE' 
                    ? 'secondary.main' 
                    : decision === 'STAY'
                    ? 'warning.main'
                    : decision === 'BRIDGE'
                    ? '#8b5cf6'
                    : decision?.toUpperCase().includes('CLARIFY')
                    ? '#ec4899'
                    : getOutcomeColor(decision),
                }}
              >
                {decision === 'ADVANCE' ? (
                  <ArrowForwardIcon sx={{ fontSize: '1rem' }} />
                ) : decision === 'STAY' ? (
                  <PanToolIcon sx={{ fontSize: '0.9rem' }} />
                ) : decision === 'BRIDGE' ? (
                  <CompareArrowsIcon sx={{ fontSize: '0.9rem' }} />
                ) : decision?.toUpperCase().includes('CLARIFY') ? (
                  <LiveHelpIcon sx={{ fontSize: '0.9rem' }} />
                ) : (
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                    {getOutcomeIcon(decision)}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })()}
        
        {/* Debug mode: show any decision for non-agent messages */}
        {debugMode && !hasAgentMessage && showOutcome && (
          <Chip
            label={`${getOutcomeIcon(decision)} ${decision}`}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.6rem',
              bgcolor: getOutcomeBgColor(decision),
              color: getOutcomeColor(decision),
              fontWeight: 600,
              border: '1px solid',
              borderColor: getOutcomeColor(decision),
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
  const treeRoots = useMemo(() => {
    if (!currentRun) return [];
    
    // Debug: Log ALL nodes with their parent relationships
    console.log('📋 All nodes before tree building:', currentRun.nodes.length, 'total');
    currentRun.nodes.forEach((node, idx) => {
      console.log(`  [${idx}] ${node.nodeId}:`, {
        type: node.userMessage ? 'USER' : 'AGENT',
        parentNodeId: node.parentNodeId,
        message: (node.userMessage || node.agentMessage || '').substring(0, 30) + '...',
      });
    });
    
    const roots = buildTree(currentRun.nodes);
    
    // Debug: Log tree structure with full hierarchy
    console.log('🌳 ExecutionTree: Tree structure built:', {
      rootCount: roots.length,
      totalNodes: currentRun.nodes.length,
    });
    
    // Log divergence points WITH DETAILS
    const logDivergences = (node: TreeNode, depth: number, path: string = '') => {
      const currentPath = path + '/' + node.nodeId.substring(node.nodeId.length - 6);
      
      // Check for divergence using the SAME logic as isDivergence()
      const userChildren = node.children.filter(c => c.userMessage !== undefined);
      const agentChildren = node.children.filter(c => c.agentMessage !== undefined);
      const isDiv = userChildren.length > 1 || agentChildren.length > 1;
      
      if (node.children.length > 1) {
        console.log(`  ${'  '.repeat(depth)}🔀 DIVERGENCE at ${node.nodeId}:`, {
          path: currentPath,
          nodeType: node.userMessage ? 'USER' : 'AGENT',
          totalChildren: node.children.length,
          userChildren: userChildren.length,
          agentChildren: agentChildren.length,
          isDivergence: isDiv,
          parentNodeId: node.parentNodeId,
          children: node.children.map(c => ({
            nodeId: c.nodeId,
            type: c.userMessage ? 'USER' : 'AGENT',
            message: (c.userMessage || c.agentMessage || '').substring(0, 40) + '...',
          })),
        });
      }
      
      node.children.forEach(child => logDivergences(child, depth + 1, currentPath));
    };
    roots.forEach(root => logDivergences(root, 0));
    
    return roots;
  }, [currentRun]);

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
  const renderNode = (node: TreeNode, depth: number, parent: TreeNode | null = null): React.ReactNode => {
    const isDiv = isDivergence(node);
    const hasChildren = node.children.length > 0;
    const isUserMessage = node.userMessage !== undefined && node.userMessage !== null;

    // Debug: Log render decision for ALL nodes with detailed info
    if (node.children.length > 0) {
      const userChildren = node.children.filter(c => c.userMessage !== undefined);
      const agentChildren = node.children.filter(c => c.agentMessage !== undefined);
      
      console.log(`🎨 renderNode for ${node.nodeId.substring(node.nodeId.length - 8)}:`, {
        nodeType: node.userMessage ? 'USER' : 'AGENT',
        message: (node.userMessage || node.agentMessage || '').substring(0, 30) + '...',
        totalChildren: node.children.length,
        userChildren: userChildren.length,
        agentChildren: agentChildren.length,
        isDivergence: isDiv,
        willRenderAs: isDiv ? 'DIVERGENCE' : 'REGULAR',
        childrenDetails: node.children.map(c => ({
          id: c.nodeId.substring(c.nodeId.length - 8),
          type: c.userMessage ? 'USER' : 'AGENT',
          msg: (c.userMessage || c.agentMessage || '').substring(0, 25),
        })),
      });
    }

    if (isDiv) {
      // DIVERGENCE NODE - ANY node with multiple paths
      // This happens when alternate replies branch from this point
      const divergeKey: CollapseKey = `diverge:${node.nodeId}`;
      const isCollapsed = collapsed.has(divergeKey);
      
      console.log(`✨ RENDERING AS DIVERGENCE: ${node.nodeId}`, {
        collapsed: isCollapsed,
        childCount: node.children.length,
      });
      
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
                backgroundColor: 'rgba(167, 139, 250, 0.2)',
                color: 'warning.main',
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
                ml: 2,
                pl: 2,
                pr: 1.5,
                py: 0.75,
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
          {!isCollapsed && (
            <Box
              sx={{
                ml: 2,
                position: 'relative',
              }}
            >
              {/* Vertical line container for ALL children */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  bgcolor: 'divider',
                }}
              />
              
              {node.children.map((child, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === node.children.length - 1;
                const branchKey: CollapseKey = `branch:${child.nodeId}`;
                const isBranchCollapsed = collapsed.has(branchKey);
                
                // Get label for this path - prefer user message for clarity
                let pathLabel = '';
                if (child.userMessage) {
                  const snippet = child.userMessage.length > 30 
                    ? child.userMessage.substring(0, 30) + '...'
                    : child.userMessage;
                  pathLabel = `"${snippet}"`;
                } else if (child.agentMessage) {
                  const snippet = child.agentMessage.length > 30
                    ? child.agentMessage.substring(0, 30) + '...'
                    : child.agentMessage;
                  pathLabel = `"${snippet}"`;
                } else {
                  pathLabel = `Path ${idx + 1}`;
                }
                
                return (
                  <Box
                    key={child.nodeId}
                    sx={{
                      pl: 2,
                      position: 'relative',
                      mb: isLast ? 0 : 2,
                    }}
                  >
                    {/* Horizontal connector */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: '20px',
                        width: '16px',
                        height: '2px',
                        bgcolor: 'divider',
                      }}
                    />
                    
                    {/* Path label - all paths get same purple/bold styling with collapse toggle */}
                    <Box
                      onClick={() => toggleCollapse(branchKey)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mb: 0.5,
                        cursor: 'pointer',
                        width: 'fit-content',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    >
                      <IconButton
                        size="small"
                        sx={{ 
                          p: 0.25, 
                          color: 'warning.main',
                        }}
                      >
                        {isBranchCollapsed ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                      
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.7rem',
                          color: 'warning.main',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          backgroundColor: 'rgba(167, 139, 250, 0.1)',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                        }}
                      >
                        <CallSplitIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                        <span>{pathLabel}</span>
                      </Typography>
                    </Box>
                    
                    {/* Render child subtree (recursive) - render at depth 0 since wrapper provides offset */}
                    {!isBranchCollapsed && (
                      <Box>
                        {renderNode(child, 0, node)}
                      </Box>
                    )}
                    
                    {/* Collapsed indicator */}
                    {isBranchCollapsed && (
                      <Box
                        sx={{
                          py: 0.5,
                          px: 1.5,
                          backgroundColor: 'action.hover',
                          borderRadius: 1,
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleCollapse(branchKey)}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {countSubtreeTurns(child)} turn{countSubtreeTurns(child) !== 1 ? 's' : ''} hidden • 
                          <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'primary.main', fontWeight: 600 }}>
                            Expand
                          </Typography>
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      );
    } else {
      // REGULAR NODE - check for linear run folding
      
      // Debug: Log non-divergence render
      if (node.children.length > 0) {
        console.log(`📄 RENDERING AS REGULAR NODE: ${node.nodeId}`, {
          message: (node.userMessage || node.agentMessage || '').substring(0, 40),
          childrenCount: node.children.length,
        });
      }
      
      // Detect linear run starting from this node
      const linearRun = computeLinearRun(node);
      const isLongLinearRun = linearRun.length > LINEAR_FOLD_THRESHOLD;
      
      if (isLongLinearRun) {
        // LINEAR RUN FOLDING
        const linearKey: CollapseKey = `linear:${node.nodeId}`;
        const isLinearCollapsed = collapsed.has(linearKey);
        
        if (isLinearCollapsed) {
          // Render folded: first 2, fold indicator, last nodes (excluding divergence), then divergence if any
          const lastNode = linearRun[linearRun.length - 1];
          const lastNodeIsDivergence = lastNode.children.length > 1;
          
          // If last node is divergence, don't include it in the display - render it separately
          const nodesToDisplay = lastNodeIsDivergence ? linearRun.slice(0, -1) : linearRun;
          const firstNodes = nodesToDisplay.slice(0, LINEAR_FOLD_SHOW_EDGES);
          const lastNodes = nodesToDisplay.slice(-LINEAR_FOLD_SHOW_EDGES);
          const hiddenCount = nodesToDisplay.length - (LINEAR_FOLD_SHOW_EDGES * 2);
          
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
              {hiddenCount > 0 && (
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
              )}
              
              {/* Render last N nodes (excluding divergence if any) */}
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
              
              {/* Render divergence node separately - this will trigger proper divergence rendering */}
              {lastNodeIsDivergence && renderNode(lastNode, depth, parent)}
            </Box>
          );
        } else {
          // Render unfolded with collapse control
          const lastNode = linearRun[linearRun.length - 1];
          const lastNodeIsDivergence = lastNode.children.length > 1;
          
          // If last node is divergence, don't include it in the display - render it separately
          const nodesToDisplay = lastNodeIsDivergence ? linearRun.slice(0, -1) : linearRun;
          
          return (
            <Box key={node.nodeId}>
              {/* All nodes in linear run (excluding divergence if any) */}
              {nodesToDisplay.map((n, idx) => (
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
                        ⋯ Fold {nodesToDisplay.length} turns
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
              
              {/* Render divergence node separately - this will trigger proper divergence rendering */}
              {lastNodeIsDivergence && renderNode(lastNode, depth, parent)}
            </Box>
          );
        }
      } else {
        // REGULAR NODE - simple line item
        // No tree connectors needed here since we're either at root or inside a divergence branch
        
        return (
          <Box key={node.nodeId}>
            <TurnCard
              node={node}
              isSelected={node.nodeId === selectedNodeId}
              onSelect={() => {
                selectBranch(node.branchId);
                selectNode(node.nodeId);
              }}
              debugMode={debugMode}
            />
            
            {/* Render children */}
            {hasChildren && node.children.map(child => renderNode(child, depth, node))}
          </Box>
        );
      }
    }
  };

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',  // ✅ Fill parent height
      borderRight: '1px solid', 
      borderColor: 'divider', 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: 0,
      backgroundColor: 'background.paper' 
    }}>
      {/* Header */}
      <Box sx={{ flexShrink: 0, p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Execution Tree
          </Typography>
          
          {/* Collapse/Expand controls */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Toggle debug metadata" slotProps={TOOLTIP_STYLES}>
              <IconButton
                size="small"
                onClick={() => setDebugMode(!debugMode)}
                sx={{ 
                  p: 0.5,
                  color: debugMode ? 'primary.main' : 'text.secondary'
                }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Expand all" slotProps={TOOLTIP_STYLES}>
              <IconButton
                size="small"
                onClick={expandAll}
                sx={{ p: 0.5 }}
              >
                <UnfoldMoreIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Collapse all" slotProps={TOOLTIP_STYLES}>
              <IconButton
                size="small"
                onClick={collapseAll}
                sx={{ p: 0.5 }}
              >
                <UnfoldLessIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          {currentRun.branches.length} branch{currentRun.branches.length !== 1 ? 'es' : ''} • {currentRun.nodes.length} turn{currentRun.nodes.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Tree */}
      <Box sx={{ 
        flex: 1, 
        minHeight: 0, 
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        <Box sx={{ p: 2, pb: 4 }}>
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
          {treeRoots.map(root => renderNode(root, 0, null))}
        </Box>
      </Box>
    </Box>
  );
};

