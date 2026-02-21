import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  useTheme, 
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DataObjectIcon from '@mui/icons-material/DataObject';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useDroppable, DragEndEvent, useDndMonitor } from '@dnd-kit/core';
import { useFlow } from '../../context/FlowContext';
import { computeGridLayout } from '../../utils/gridLayout';
import { CompactNodeCard } from './CompactNodeCard';
import type { FlowNode, NodeKind } from '../../types';

const NODE_ICONS: Record<NodeKind, React.ReactElement> = {
  EXPLANATION: <InfoOutlinedIcon fontSize="small" />,
  REFLECTIVE_QUESTION: <QuestionAnswerIcon fontSize="small" />,
  GOAL_DEFINITION: <DataObjectIcon fontSize="small" />,
  BASELINE_CAPTURE: <DataObjectIcon fontSize="small" />,
  DEADLINE_CAPTURE: <CalendarMonthIcon fontSize="small" />,
  GOAL_GAP_TRACKER: <ShowChartIcon fontSize="small" />,
  ACTION_BOOKING: <CalendarMonthIcon fontSize="small" />,
  HANDOFF: <HandshakeIcon fontSize="small" />,
};

const NODE_COLORS: Record<NodeKind, string> = {
  EXPLANATION: '#39D0C9',
  REFLECTIVE_QUESTION: '#A78BFA',
  GOAL_DEFINITION: '#5A6B7D',
  BASELINE_CAPTURE: '#5A6B7D',
  DEADLINE_CAPTURE: '#A78BFA',
  GOAL_GAP_TRACKER: '#39D0C9',
  ACTION_BOOKING: '#FF0059',
  HANDOFF: '#FF6699',
};

const BOX_HEIGHT = 3; // em
const GAP = 0.75; // em
const BOX_WIDTH = 18; // em - actual box width
const LANE_WIDTH = 19; // em - lane container width (slight padding)
const LANE_GAP = 2.5; // em (space for arrows)

interface Connection {
  from: FlowNode;
  to: FlowNode;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

// Wrapper component to properly handle refs
interface NodeWrapperProps {
  node: FlowNode;
  isSelected: boolean;
  onClick: () => void;
  height: string;
  registerRef: (nodeId: string, el: HTMLElement | null) => void;
}

const NodeWrapper: React.FC<NodeWrapperProps> = ({ node, isSelected, onClick, height, registerRef }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wrapperRef.current) {
      registerRef(node.id, wrapperRef.current);
    }
    return () => registerRef(node.id, null);
  }, [node.id, registerRef]);

  return (
    <div ref={wrapperRef} style={{ width: `${BOX_WIDTH}em`, display: 'flex' }}>
      <CompactNodeCard
        node={node}
        isSelected={isSelected}
        onClick={onClick}
        height={height}
      />
    </div>
  );
};

export const CompactCanvas: React.FC = () => {
  const { flow, selection, setSelection, updateNode } = useFlow();
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [prereqPickerOpen, setPrereqPickerOpen] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{ nodeId: string; targetCol: number } | null>(null);
  const [nodeRefs, setNodeRefs] = useState<Map<string, HTMLElement>>(new Map());
  const [connections, setConnections] = useState<Connection[]>([]);

  // Compute grid layout
  const gridLayout = computeGridLayout(flow.nodes);
  
  // Determine columns
  const maxCol = Math.max(...Array.from(gridLayout.values()).map(p => p.gridCol), -1);
  const columns = maxCol >= 0 ? Array.from({ length: maxCol + 2 }, (_, i) => i) : [0];
  
  // Calculate total width needed for all lanes
  const totalWidthEm = columns.length * LANE_WIDTH + (columns.length - 1) * LANE_GAP;
  
  // Group nodes by column
  const nodesByColumn = new Map<number, FlowNode[]>();
  columns.forEach(col => nodesByColumn.set(col, []));
  
  flow.nodes.forEach(node => {
    const pos = gridLayout.get(node.id);
    if (pos) {
      nodesByColumn.get(pos.gridCol)!.push(node);
    }
  });

  // Calculate how many dependents each node has (for height)
  const getDependentCount = (node: FlowNode): number => {
    return flow.nodes.filter(otherNode => {
      if (otherNode.id === node.id) return false;
      if (!otherNode.requires) return false;
      const nodeProduces = node.produces || [];
      return otherNode.requires.some(req => 
        nodeProduces.includes(req) || req === node.id
      );
    }).length;
  };

  const getNodeHeight = (node: FlowNode): string => {
    const count = getDependentCount(node);
    if (count === 0) return `${BOX_HEIGHT}em`;
    return `${(count * BOX_HEIGHT) + ((count - 1) * GAP)}em`;
  };

  const handleNodeClick = (node: FlowNode) => {
    setSelection({ type: 'node', id: node.id });
  };

  // Track node refs for arrow calculations
  const registerNodeRef = useCallback((nodeId: string, el: HTMLElement | null) => {
    setNodeRefs(prev => {
      const next = new Map(prev);
      if (el) {
        next.set(nodeId, el);
      } else {
        next.delete(nodeId);
      }
      return next;
    });
  }, []);

  // Calculate arrow connections
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!containerRef.current || nodeRefs.size === 0) return;

      const newConnections: Connection[] = [];
      const containerRect = containerRef.current.getBoundingClientRect();

      flow.nodes.forEach(node => {
        const requires = node.requires || [];
        
        requires.forEach(req => {
          const prereqNode = flow.nodes.find(n => 
            (n.produces && n.produces.includes(req)) || n.id === req
          );

          if (!prereqNode) return;

          const fromEl = nodeRefs.get(prereqNode.id);
          const toEl = nodeRefs.get(node.id);

          if (!fromEl || !toEl) return;

          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();

          // Calculate positions relative to container
          const fromX = fromRect.right - containerRect.left;
          const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
          // End curve 9px before box (arrowhead length), so arrow extends to box edge
          const toX = toRect.left - containerRect.left - 9;
          const toY = toRect.top + toRect.height / 2 - containerRect.top;

          newConnections.push({
            from: prereqNode,
            to: node,
            fromX,
            fromY,
            toX,
            toY,
          });
        });
      });

      setConnections(newConnections);
    }, 150);

    return () => clearTimeout(timer);
  }, [flow.nodes, nodeRefs]);

  // Get eligible prerequisites
  const getEligiblePrereqs = (targetCol: number): FlowNode[] => {
    const eligible: FlowNode[] = [];
    for (let col = 0; col < targetCol; col++) {
      const nodesInCol = nodesByColumn.get(col) || [];
      eligible.push(...nodesInCol);
    }
    return eligible;
  };

  const handleSelectPrerequisite = (prereqId: string) => {
    if (!pendingDrop) return;
    const droppedNode = flow.nodes.find(n => n.id === pendingDrop.nodeId);
    if (!droppedNode) return;

    updateNode(droppedNode.id, {
      requires: [prereqId],
    });

    setPrereqPickerOpen(false);
    setPendingDrop(null);
  };

  // Handle drops
  useDndMonitor({
    onDragEnd: (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || over.data.current?.type !== 'compact-lane') return;

      const targetCol = over.data.current.colIndex as number;
      const draggedNode = active.data.current?.node as FlowNode | undefined;
      if (!draggedNode) return;

      const currentCol = gridLayout.get(draggedNode.id)?.gridCol ?? 0;
      
      if (targetCol > currentCol) {
        setPendingDrop({ nodeId: draggedNode.id, targetCol });
        setPrereqPickerOpen(true);
      }
    },
  });

  return (
    <>
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          backgroundColor: 'background.default',
          backgroundImage: `radial-gradient(circle, ${alpha('#FFFFFF', 0.08)} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          p: 3,
        }}
      >
        {/* SVG Arrow Overlay */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'visible',
          }}
        >
          <defs>
            {/* Arrow markers - bigger arrows, path ends at back */}
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <marker
                key={`arrow-${type}`}
                id={`arrowhead-${type}`}
                markerWidth="10"
                markerHeight="10"
                refX="0"
                refY="4"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M0,0 L0,8 L9,4 z" fill={color} opacity="0.8" />
              </marker>
            ))}
          </defs>

          {connections.map((conn, idx) => {
            const dx = conn.toX - conn.fromX;
            const cp1X = conn.fromX + dx * 0.6;
            const cp2X = conn.toX - dx * 0.4;
            
            return (
              <g key={`${conn.from.id}-${conn.to.id}-${idx}`}>
                {/* Glow effect */}
                <path
                  d={`M ${conn.fromX} ${conn.fromY} C ${cp1X} ${conn.fromY}, ${cp2X} ${conn.toY}, ${conn.toX} ${conn.toY}`}
                  stroke={NODE_COLORS[conn.from.type]}
                  strokeWidth="5"
                  fill="none"
                  opacity="0.15"
                />
                {/* Main arrow */}
                <path
                  d={`M ${conn.fromX} ${conn.fromY} C ${cp1X} ${conn.fromY}, ${cp2X} ${conn.toY}, ${conn.toX} ${conn.toY}`}
                  stroke={NODE_COLORS[conn.from.type]}
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.75"
                  markerEnd={`url(#arrowhead-${conn.from.type})`}
                  strokeLinecap="round"
                />
              </g>
            );
          })}
        </svg>

        {/* Lanes */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'inline-flex', // inline-flex to respect content width
            gap: `${LANE_GAP}em`,
            alignItems: 'flex-start',
            flexWrap: 'nowrap', // Don't wrap lanes
          }}
        >
          {columns.map(colIndex => {
            const nodesInColumn = nodesByColumn.get(colIndex) || [];
            
            const { setNodeRef, isOver } = useDroppable({
              id: `compact-lane-${colIndex}`,
              data: { type: 'compact-lane', colIndex },
            });

            return (
              <Box
                key={`lane-${colIndex}`}
                ref={setNodeRef}
                sx={{
                  width: `${LANE_WIDTH}em`,
                  minWidth: `${LANE_WIDTH}em`,
                  maxWidth: `${LANE_WIDTH}em`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center', // Center boxes within lane
                  gap: `${GAP}em`,
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  ...(nodesInColumn.length === 0 && {
                    border: `1px dashed ${alpha('#FFFFFF', 0.1)}`,
                    borderRadius: 1,
                    backgroundColor: alpha('#FFFFFF', 0.02),
                  }),
                  ...(isOver && {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  }),
                }}
              >
                {nodesInColumn.map(node => (
                  <NodeWrapper 
                    key={node.id} 
                    node={node}
                    isSelected={selection.type === 'node' && selection.id === node.id}
                    onClick={() => handleNodeClick(node)}
                    height={getNodeHeight(node)}
                    registerRef={registerNodeRef}
                  />
                ))}
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
              No capabilities defined
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              Switch to detailed view to add conversation capabilities
            </Typography>
          </Box>
        )}
      </Box>

      {/* Prerequisite Picker Modal */}
      <Dialog
        open={prereqPickerOpen}
        onClose={() => {
          setPrereqPickerOpen(false);
          setPendingDrop(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Prerequisite</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose which conversation item must happen before this one:
          </Typography>
          <List>
            {pendingDrop && getEligiblePrereqs(pendingDrop.targetCol).map(prereqNode => (
              <ListItem key={prereqNode.id} disablePadding>
                <ListItemButton onClick={() => handleSelectPrerequisite(prereqNode.id)}>
                  <ListItemIcon sx={{ color: NODE_COLORS[prereqNode.type] }}>
                    {NODE_ICONS[prereqNode.type]}
                  </ListItemIcon>
                  <ListItemText 
                    primary={prereqNode.title}
                    secondary={prereqNode.purpose}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
};
