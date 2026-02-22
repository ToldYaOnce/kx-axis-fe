import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
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
import { DragEndEvent, useDndMonitor, useDroppable, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
const LANE_GAP = 2.5; // em (space for arrows)

interface Connection {
  from: FlowNode;
  to: FlowNode;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

// Single green insertion zone for adding parallel items to a column
interface ColumnInsertionZoneProps {
  colIndex: number;
  activeId: string | null;
}

const ColumnInsertionZone: React.FC<ColumnInsertionZoneProps> = ({
  colIndex,
  activeId,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-insertion-${colIndex}`,
    data: {
      type: 'column-insertion',
      targetCol: colIndex,
    },
  });

  // Only show when dragging
  if (!activeId) return null;

  return (
    <Box
      ref={setNodeRef}
      sx={{
        height: isOver ? '3em' : '1.5em',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        cursor: 'copy',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '3px',
          backgroundColor: isOver ? '#00FF00' : alpha('#00FF00', 0.35),
          transition: 'all 0.2s',
          borderRadius: '2px',
          boxShadow: isOver ? `0 0 8px ${alpha('#00FF00', 0.6)}` : 'none',
        }}
      />
    </Box>
  );
};

// Lane component to properly handle hooks
interface LaneProps {
  colIndex: number;
  nodes: FlowNode[];
  activeId: string | null;
  selection: any;
  handleNodeClick: (node: FlowNode) => void;
  getNodeHeight: (node: FlowNode) => string;
  registerNodeRef: (nodeId: string, el: HTMLElement | null) => void;
  showGreenZone: boolean;
  allNodes: FlowNode[];
  nodeVerticalPositions: Map<string, number>;
}

const Lane: React.FC<LaneProps> = ({
  colIndex,
  nodes,
  activeId,
  selection,
  handleNodeClick,
  getNodeHeight,
  registerNodeRef,
  showGreenZone,
  allNodes,
  nodeVerticalPositions,
}) => {
  const nodeIds = nodes.map(n => n.id);
  const isEmpty = nodes.length === 0;
  
  // Check if a node has any dependents (other nodes that require it)
  const nodeHasDependents = (nodeId: string): boolean => {
    return allNodes.some(n => (n.requires || []).includes(nodeId));
  };

  // Empty lanes don't need droppable - the right zones from left items will handle it
  useDroppable({
    id: `empty-lane-${colIndex}`,
    data: {
      type: 'empty-lane',
      colIndex,
    },
    disabled: true, // Disabled because we use right-zones instead
  });
  
  // Calculate total height needed for this lane
  const totalHeight = isEmpty ? 20 : Math.max(...nodes.map(node => {
    const offset = nodeVerticalPositions.get(node.id) || 0;
    const height = parseFloat(getNodeHeight(node));
    return offset + height;
  }), 0);

  return (
    <Box
      sx={{
        width: `${BOX_WIDTH}em`,
        minWidth: `${BOX_WIDTH}em`,
        position: 'relative',
        flexShrink: 0,
        minHeight: `${totalHeight}em`,
      }}
    >
      {isEmpty ? (
        // Empty column: blue zones from left items will show to the right
        null
      ) : (
        <>
          <SortableContext items={nodeIds} strategy={verticalListSortingStrategy}>
            {nodes.map((node) => {
              const offset = nodeVerticalPositions.get(node.id) || 0;
              return (
                <Box
                  key={node.id}
                  sx={{
                    position: 'absolute',
                    top: `${offset}em`,
                    width: '100%',
                    zIndex: 10,
                  }}
                >
                  <SortableNodeWrapper
                    node={node}
                    isSelected={selection.type === 'node' && selection.id === node.id}
                    onClick={() => handleNodeClick(node)}
                    height={getNodeHeight(node)}
                    registerRef={registerNodeRef}
                    showRightZone={!!activeId && activeId !== node.id}
                    nodeHasNoDependents={!nodeHasDependents(node.id)}
                  />
                </Box>
              );
            })}
          </SortableContext>
          
          {/* ONE green insertion zone below all items */}
          {showGreenZone && (
            <Box sx={{ position: 'absolute', top: `${totalHeight}em`, width: '100%', zIndex: 5 }}>
              <ColumnInsertionZone
                colIndex={colIndex}
                activeId={activeId}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

// Sortable node with drop zones
interface SortableNodeWrapperProps {
  node: FlowNode;
  isSelected: boolean;
  onClick: () => void;
  height: string;
  registerRef: (nodeId: string, el: HTMLElement | null) => void;
  showRightZone: boolean;
  nodeHasNoDependents: boolean;
}

const SortableNodeWrapper: React.FC<SortableNodeWrapperProps> = ({
  node,
  isSelected,
  onClick,
  height,
  registerRef,
  showRightZone,
  nodeHasNoDependents,
}) => {
  const {
    attributes,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: node.id,
    data: { type: 'sortable-node', node },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wrapperRef.current && !isSortableDragging) {
      registerRef(node.id, wrapperRef.current);
    }
    return () => registerRef(node.id, null);
  }, [node.id, registerRef, isSortableDragging]);

  // Right-side drop zone for dependencies (must match Canvas.tsx expected type)
  const dropZoneId = `right-${node.id}`;
  const { setNodeRef: setRightDropRef, isOver: isOverRight } = useDroppable({
    id: dropZoneId,
    data: {
      type: 'dependency-extension',
      targetNode: node,
    },
  });

  // Debug: Log when drop zone is rendered
  useEffect(() => {
    if (showRightZone && nodeHasNoDependents) {
      console.log('🔵 Drop zone rendered:', dropZoneId, 'for node:', node.title);
    }
  }, [showRightZone, nodeHasNoDependents, dropZoneId, node.title]);

  return (
    <Box sx={{ position: 'relative', width: '100%' }} style={style}>
      <div ref={wrapperRef} style={{ width: '100%' }}>
        <Box
          ref={setNodeRef}
          {...attributes}
          sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <CompactNodeCard
            node={node}
            isSelected={isSelected}
            onClick={onClick}
            height={height}
          />
        </Box>
      </div>

      {/* Right-side dependency drop zone - only visible when dragging AND node has no dependents */}
      {showRightZone && nodeHasNoDependents && (
        <Box
          ref={setRightDropRef}
          sx={{
            position: 'absolute',
            top: 0,
            height: height,
            left: `calc(100% + ${LANE_GAP}em)`,
            width: `${BOX_WIDTH}em`,
            zIndex: 1000,
            backgroundColor: isOverRight ? alpha('#0080FF', 0.25) : alpha('#0080FF', 0.08),
            border: isOverRight ? `2px solid #0080FF` : `1px dashed ${alpha('#0080FF', 0.3)}`,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'all',
            transition: 'all 0.2s',
            cursor: 'copy',
          }}
        >
          {isOverRight && (
            <Typography variant="caption" sx={{ color: '#0080FF', fontWeight: 600, fontSize: '0.65rem', textAlign: 'center', px: 0.5 }}>
              →
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export const CompactCanvas: React.FC = () => {
  const { flow, selection, setSelection, updateNode, addNode } = useFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const [prereqPickerOpen, setPrereqPickerOpen] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{ nodeId: string; targetCol: number } | null>(null);
  const [nodeRefs, setNodeRefs] = useState<Map<string, HTMLElement>>(new Map());
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // FIX: Convert node IDs to fact names in requires arrays (run once on mount)
  useEffect(() => {
    let needsUpdate = false;
    const updates: { nodeId: string; requires: string[] }[] = [];

    flow.nodes.forEach(node => {
      if (!node.requires || node.requires.length === 0) return;

      // Check if any requires are node IDs (contain hyphens and numbers, like "welcome-intro-1771782764962")
      const hasNodeIds = node.requires.some(req => 
        req.includes('-') && /\d{10,}/.test(req) // Looks like a node ID
      );

      if (hasNodeIds) {
        console.log('🔧 Fixing node:', node.id, 'requires:', node.requires);
        
        // Convert node IDs to fact names
        const newRequires: string[] = [];
        node.requires.forEach(req => {
          // Check if this is a node ID
          const prereqNode = flow.nodes.find(n => n.id === req);
          if (prereqNode) {
            // It's a node ID - replace with the facts it produces
            console.log('  → Converting node ID:', req, '→ facts:', prereqNode.produces);
            newRequires.push(...(prereqNode.produces || []));
          } else {
            // It's already a fact name - keep it
            newRequires.push(req);
          }
        });

        if (newRequires.length > 0 || node.requires.length > 0) {
          updates.push({ nodeId: node.id, requires: newRequires });
          needsUpdate = true;
        }
      }
    });

    // Apply all updates
    if (needsUpdate) {
      console.log('🔧 Applying requires fixes to', updates.length, 'nodes');
      updates.forEach(({ nodeId, requires }) => {
        updateNode(nodeId, { requires });
      });
    }
  }, []); // Run only once on mount

  // Compute grid layout
  const gridLayout = computeGridLayout(flow.nodes);
  
  // Determine columns
  const maxCol = Math.max(...Array.from(gridLayout.values()).map(p => p.gridCol), -1);
  const columns = maxCol >= 0 ? Array.from({ length: maxCol + 2 }, (_, i) => i) : [0];
  
  // Group nodes by column
  const nodesByColumn = new Map<number, FlowNode[]>();
  columns.forEach(col => nodesByColumn.set(col, []));
  
  flow.nodes.forEach(node => {
    const pos = gridLayout.get(node.id);
    if (pos) {
      nodesByColumn.get(pos.gridCol)!.push(node);
    }
  });

  // Calculate node heights recursively from right to left
  const nodeHeights = new Map<string, number>(); // Store heights in em units

  const calculateNodeHeight = (node: FlowNode): number => {
    // Return cached height if already calculated
    if (nodeHeights.has(node.id)) {
      return nodeHeights.get(node.id)!;
    }

    // Find all direct dependents (nodes in the next column that require this node)
    const directDependents = flow.nodes.filter(otherNode => {
      if (otherNode.id === node.id) return false;
      if (!otherNode.requires) return false;
      const nodeProduces = node.produces || [];
      return otherNode.requires.some(req => 
        nodeProduces.includes(req) || req === node.id
      );
    });

    if (directDependents.length === 0) {
      // Leaf node - use base height
      nodeHeights.set(node.id, BOX_HEIGHT);
      return BOX_HEIGHT;
    }

    // Calculate the sum of all dependent heights (including their cascading heights)
    let totalDependentsHeight = 0;
    directDependents.forEach((dependent, index) => {
      const dependentHeight = calculateNodeHeight(dependent);
      totalDependentsHeight += dependentHeight;
      if (index < directDependents.length - 1) {
        totalDependentsHeight += GAP; // Add gap between dependents
      }
    });

    // This node's height is the max of: base height OR sum of dependents' heights
    const height = Math.max(BOX_HEIGHT, totalDependentsHeight);
    nodeHeights.set(node.id, height);
    
    if (directDependents.length > 0) {
      console.log(`📏 ${node.title}: height=${height}em (${directDependents.length} dependents: ${directDependents.map(d => d.title).join(', ')})`);
    }
    
    return height;
  };

  // Calculate all heights (process from right to left automatically through recursion)
  flow.nodes.forEach(node => calculateNodeHeight(node));
  
  console.log('📏 All node heights:', Array.from(nodeHeights.entries()).map(([id, h]) => {
    const node = flow.nodes.find(n => n.id === id);
    return `${node?.title}: ${h}em`;
  }));

  const getNodeHeight = (node: FlowNode): string => {
    const height = nodeHeights.get(node.id) || BOX_HEIGHT;
    return `${height}em`;
  };
  
  // Calculate vertical positions for ALL nodes based on prerequisites (left to right)
  const nodeVerticalPositions = new Map<string, number>();
  
  columns.forEach(colIndex => {
    const nodesInColumn = nodesByColumn.get(colIndex) || [];
    if (nodesInColumn.length === 0) return;
    
    // Sort nodes by their grid row (to preserve vertical order)
    const sortedNodes = [...nodesInColumn].sort((a, b) => {
      const aPos = gridLayout.get(a.id);
      const bPos = gridLayout.get(b.id);
      return (aPos?.gridRow || 0) - (bPos?.gridRow || 0);
    });
    
    // Position each node - either aligned with prerequisite or stacked
    sortedNodes.forEach(node => {
      const allRequires = node.requires || [];
      console.log(`🔍 ${node.title} requires:`, allRequires);
      
      // Find prerequisite NODES in two ways:
      // 1. Direct node ID references
      const directNodePrereqs = allRequires.filter(req => 
        flow.nodes.some(n => n.id === req)
      );
      
      // 2. Nodes that PRODUCE the required facts (same logic as height calculation)
      const factProducingNodes = flow.nodes.filter(otherNode => {
        if (otherNode.id === node.id) return false;
        const produces = otherNode.produces || [];
        return allRequires.some(req => produces.includes(req));
      });
      
      const allPrereqNodes = [...directNodePrereqs.map(id => flow.nodes.find(n => n.id === id)!), ...factProducingNodes];
      const uniquePrereqNodes = Array.from(new Set(allPrereqNodes.map(n => n.id))).map(id => flow.nodes.find(n => n.id === id)!);
      
      console.log(`🔍 ${node.title} prerequisite NODES:`, uniquePrereqNodes.map(n => n.title));
      
      if (uniquePrereqNodes.length > 0) {
        // Has a prerequisite NODE - align vertically with it (or stack below siblings)
        const prereqNode = uniquePrereqNodes[0];
        const prereqPosition = nodeVerticalPositions.get(prereqNode.id);
        
        if (prereqPosition !== undefined) {
          // Find ALL siblings that share the same prerequisite AND have been positioned
          const siblingsWithSamePrereq = sortedNodes.filter(n => {
            if (n.id === node.id || !nodeVerticalPositions.has(n.id)) return false;
            
            // Check if this node shares the same prerequisite using same logic
            const nAllRequires = n.requires || [];
            const nDirectNodePrereqs = nAllRequires.filter(req => 
              flow.nodes.some(nd => nd.id === req)
            );
            const nFactProducingNodes = flow.nodes.filter(otherNode => {
              if (otherNode.id === n.id) return false;
              const produces = otherNode.produces || [];
              return nAllRequires.some(req => produces.includes(req));
            });
            const nAllPrereqNodes = [...nDirectNodePrereqs.map(id => flow.nodes.find(nd => nd.id === id)!), ...nFactProducingNodes];
            const nUniquePrereqNodes = Array.from(new Set(nAllPrereqNodes.map(nd => nd.id))).map(id => flow.nodes.find(nd => nd.id === id)!);
            
            return nUniquePrereqNodes.length === 1 && nUniquePrereqNodes[0].id === prereqNode.id;
          });
          
          let targetPosition = prereqPosition;
          if (siblingsWithSamePrereq.length > 0) {
            // Find the bottom-most positioned sibling
            let bottomMostPosition = prereqPosition;
            let bottomMostSibling = prereqNode;
            
            for (const sibling of siblingsWithSamePrereq) {
              const siblingPos = nodeVerticalPositions.get(sibling.id) || 0;
              const siblingHeight = nodeHeights.get(sibling.id) || BOX_HEIGHT;
              const siblingBottom = siblingPos + siblingHeight;
              
              if (siblingBottom > bottomMostPosition) {
                bottomMostPosition = siblingBottom;
                bottomMostSibling = sibling;
              }
            }
            
            targetPosition = bottomMostPosition + GAP;
            console.log(`📍 ${node.title} → stacked below ${bottomMostSibling.title} @ ${targetPosition}em (${siblingsWithSamePrereq.length} siblings above)`);
          } else {
            console.log(`📍 ${node.title} → aligned with ${prereqNode.title} @ ${targetPosition}em`);
          }
          
          nodeVerticalPositions.set(node.id, targetPosition);
        } else {
          // Prerequisite hasn't been positioned yet (shouldn't happen with left-to-right)
          nodeVerticalPositions.set(node.id, 0);
          console.log(`❌ ${node.title} → prereq ${prereqNode.title} not positioned yet, fallback to 0em`);
        }
      } else {
        // No prerequisite NODE - stack in order (like items in column 1)
        const prevNodesInColumn = sortedNodes.slice(0, sortedNodes.indexOf(node));
        
        if (prevNodesInColumn.length === 0) {
          // First node in column
          nodeVerticalPositions.set(node.id, 0);
          console.log(`📍 ${node.title} → first in column @ 0em`);
        } else {
          // Stack after previous node
          const prevNode = prevNodesInColumn[prevNodesInColumn.length - 1];
          const prevPos = nodeVerticalPositions.get(prevNode.id) || 0;
          const prevHeight = nodeHeights.get(prevNode.id) || BOX_HEIGHT;
          const newPos = prevPos + prevHeight + GAP;
          nodeVerticalPositions.set(node.id, newPos);
          console.log(`📍 ${node.title} → stacked after ${prevNode.title} @ ${newPos}em`);
        }
      }
    });
  });

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
    const prereqNode = flow.nodes.find(n => n.id === prereqId);
    if (!droppedNode || !prereqNode) return;

    // Set requires to the facts produced by the prerequisite node
    updateNode(droppedNode.id, {
      requires: prereqNode.produces || [],
    });

    setPrereqPickerOpen(false);
    setPendingDrop(null);
  };

  // Handle drag events
  useDndMonitor({
    onDragStart: (event: DragStartEvent) => {
      setActiveId(event.active.id as string);
    },
    onDragEnd: (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const overData = over.data.current;
      const activeData = active.data.current;
      const activeNode = flow.nodes.find(n => n.id === active.id);

      console.log('🎯 Drop detected:', { 
        activeId: active.id, 
        overId: over.id, 
        overType: overData?.type,
        activeType: activeData?.type 
      });

      // Case 1: Dropped on column insertion zone (green line at bottom)
      if (overData?.type === 'column-insertion') {
        const targetCol = overData.targetCol as number;
        
        console.log('🟢 Column insertion detected:', { targetCol, activeNode: activeNode?.id, activeType: activeData?.type });
        
        // Case 1a: Palette item (create new node with prerequisites from column)
        if (activeData?.type === 'palette-item') {
          const item = activeData?.item;
          const createNodeFromItem = (window as any).__createNodeFromItem;
          
          if (createNodeFromItem && item) {
            const newNode = createNodeFromItem(item);
            
            // Find items already in this column and copy their prerequisites
            const itemsInColumn = nodesByColumn.get(targetCol) || [];
            console.log('🟢 Items in target column:', itemsInColumn.map(n => ({ id: n.id, title: n.title, requires: n.requires })));
            
            if (itemsInColumn.length > 0) {
              // Use the first item's prerequisites
              const templateNode = itemsInColumn[0];
              newNode.requires = templateNode.requires || [];
              
              console.log('🟢 Setting prereqs for new node to match:', templateNode.title, '→', newNode.requires);
            } else {
              console.log('🟢 No items in column, new node will have no prereqs');
            }
            
            addNode(newNode);
            setSelection({ type: 'node', id: newNode.id });
          }
          return;
        }
        
        // Case 1b: Existing node (reposition to match column's prerequisites)
        if (activeNode) {
          const itemsInColumn = nodesByColumn.get(targetCol) || [];
          console.log('🟢 Items in target column:', itemsInColumn.map(n => ({ id: n.id, title: n.title, requires: n.requires })));
          
          if (itemsInColumn.length > 0) {
            // Use the first item's prerequisites as the template
            const templateNode = itemsInColumn[0];
            const prereqs = templateNode.requires || [];
            
            console.log('🟢 Copying prereqs from:', templateNode.title, '→', prereqs);
            updateNode(activeNode.id, {
              requires: prereqs,
            });
          }
        }
        return;
      }

      // Case 2: Dropped on right-side zone (dependency creation) - PRIORITY
      if (overData?.type === 'dependency-extension') {
        const targetNode = overData.targetNode as FlowNode;
        
        // Case 2a: Palette item (create new node with target as prerequisite)
        if (activeData?.type === 'palette-item') {
          const item = activeData?.item;
          const createNodeFromItem = (window as any).__createNodeFromItem;
          
          if (createNodeFromItem && item && targetNode) {
            const newNode = createNodeFromItem(item);
            
            // Set the facts produced by the target node as requirements
            newNode.requires = targetNode.produces || [];
            
            console.log('✅ Creating new node with dependency:', targetNode.id, '(produces:', targetNode.produces, ') ->', newNode.id);
            addNode(newNode);
            setSelection({ type: 'node', id: newNode.id });
          }
          return;
        }
        
        // Case 2b: Existing node (update its prerequisites)
        if (activeNode && targetNode.id !== activeNode.id) {
          console.log('✅ Creating dependency:', targetNode.id, '(produces:', targetNode.produces, ') ->', activeNode.id);
          updateNode(activeNode.id, {
            requires: targetNode.produces || [],
          });
        }
        return;
      }

      // Case 3: Dropped on empty lane (show picker)
      if (overData?.type === 'empty-lane') {
        const targetCol = overData.colIndex as number;
        if (activeNode) {
          setPendingDrop({ nodeId: activeNode.id, targetCol });
          setPrereqPickerOpen(true);
        }
        return;
      }

      // Case 4: Dropped on empty canvas (first item)
      if (overData?.type === 'canvas' && activeData?.type === 'palette-item') {
        const item = activeData?.item;
        const createNodeFromItem = (window as any).__createNodeFromItem;
        
        if (createNodeFromItem && item) {
          const newNode = createNodeFromItem(item);
          // First item on canvas has no prerequisites
          newNode.requires = [];
          
          console.log('✅ Creating first node on canvas:', newNode.id);
          addNode(newNode);
          setSelection({ type: 'node', id: newNode.id });
        }
        return;
      }

      // Case 5: Sortable reorder within same lane
      // Only process if both active and over are sortable nodes
      if (activeData?.type === 'sortable-node' && overData?.type === 'sortable-node') {
        if (active.id !== over.id) {
          console.log('📋 Sortable reorder:', active.id, '<->', over.id);
          // Allow sortable to handle reordering
          // The SortableContext will manage the position change
        }
        return;
      }
    },
    onDragCancel: () => {
      setActiveId(null);
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
            {/* Single consistent arrow marker - blue-slate */}
            <marker
              id="arrowhead-blue-slate"
              markerWidth="10"
              markerHeight="10"
              refX="0"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L0,8 L9,4 z" fill="#5A6B7D" opacity="0.7" />
            </marker>
          </defs>

          {connections.map((conn, idx) => {
            const dx = conn.toX - conn.fromX;
            const cp1X = conn.fromX + dx * 0.6;
            const cp2X = conn.toX - dx * 0.4;
            const arrowColor = '#5A6B7D'; // Consistent blue-slate color
            
            return (
              <g key={`${conn.from.id}-${conn.to.id}-${idx}`}>
                {/* Glow effect */}
                <path
                  d={`M ${conn.fromX} ${conn.fromY} C ${cp1X} ${conn.fromY}, ${cp2X} ${conn.toY}, ${conn.toX} ${conn.toY}`}
                  stroke={arrowColor}
                  strokeWidth="3"
                  fill="none"
                  opacity="0.12"
                />
                {/* Main arrow */}
                <path
                  d={`M ${conn.fromX} ${conn.fromY} C ${cp1X} ${conn.fromY}, ${cp2X} ${conn.toY}, ${conn.toX} ${conn.toY}`}
                  stroke={arrowColor}
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.6"
                  markerEnd={`url(#arrowhead-blue-slate)`}
                  strokeLinecap="round"
                />
              </g>
            );
          })}
        </svg>

        {/* Nodes positioned in columns */}
        <Box
          data-kx="world"
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'inline-flex',
            gap: `${LANE_GAP}em`,
            alignItems: 'flex-start',
            flexWrap: 'nowrap',
            p: 3,
            width: 'max-content', // ✅ Expands to ~1648px, triggers scrollbar in parent
          }}
        >
          {columns.map((colIndex) => {
            const nodesInColumn = nodesByColumn.get(colIndex) || [];
            
            // Green zone appears below ALL columns that have nodes
            const showGreenZone = nodesInColumn.length > 0;
            
            return (
              <Lane
                key={`col-${colIndex}`}
                colIndex={colIndex}
                nodes={nodesInColumn}
                activeId={activeId}
                selection={selection}
                handleNodeClick={handleNodeClick}
                getNodeHeight={getNodeHeight}
                registerNodeRef={registerNodeRef}
                showGreenZone={showGreenZone}
                allNodes={flow.nodes}
                nodeVerticalPositions={nodeVerticalPositions}
              />
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
