import type { FlowNode } from '../types';

/**
 * Compute the dependency depth of each node
 * Depth = longest chain of prerequisites to reach this node
 * 
 * Depth 0 = no prerequisites (always available)
 * Depth 1 = depends on depth 0 nodes
 * Depth 2 = depends on depth 1 nodes, etc.
 */
export function computeNodeDepths(nodes: FlowNode[]): Map<string, number> {
  const depths = new Map<string, number>();
  const visited = new Set<string>();
  
  // Helper to get all prerequisite node IDs
  function getPrerequisiteNodes(node: FlowNode): string[] {
    const prereqs: string[] = [];
    
    if (node.requires) {
      node.requires.forEach(req => {
        // Check if this is a node ID (contains hyphen and is long)
        if (req.includes('-') && req.length > 20) {
          prereqs.push(req);
        } else {
          // This is a fact name - find which node produces it
          const producingNode = nodes.find(n => 
            n.produces && n.produces.includes(req)
          );
          if (producingNode) {
            prereqs.push(producingNode.id);
          }
        }
      });
    }
    
    return prereqs;
  }
  
  // Recursive depth computation with cycle detection
  function computeDepth(nodeId: string): number {
    // Already computed
    if (depths.has(nodeId)) {
      return depths.get(nodeId)!;
    }
    
    // Cycle detection
    if (visited.has(nodeId)) {
      return 0; // Break cycle, treat as depth 0
    }
    
    visited.add(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      return 0;
    }
    
    const prereqNodes = getPrerequisiteNodes(node);
    
    // No prerequisites = depth 0
    if (prereqNodes.length === 0) {
      depths.set(nodeId, 0);
      visited.delete(nodeId);
      return 0;
    }
    
    // Depth = 1 + max depth of prerequisites
    const prereqDepths = prereqNodes.map(prereqId => computeDepth(prereqId));
    const maxPrereqDepth = Math.max(...prereqDepths, -1);
    const depth = maxPrereqDepth + 1;
    
    depths.set(nodeId, depth);
    visited.delete(nodeId);
    return depth;
  }
  
  // Compute depth for all nodes
  nodes.forEach(node => {
    if (!depths.has(node.id)) {
      computeDepth(node.id);
    }
  });
  
  return depths;
}

/**
 * Get the dependency depth for a specific node
 */
export function getNodeDepth(node: FlowNode, allNodes: FlowNode[]): number {
  const depths = computeNodeDepths(allNodes);
  return depths.get(node.id) ?? 0;
}

/**
 * Group nodes into a 2D grid: [prerequisiteRow][depthColumn]
 */
export interface GridCell {
  nodes: FlowNode[];
}

export interface DependencyGrid {
  rows: {
    label: string;
    description: string;
    columns: GridCell[];
    maxDepth: number;
  }[];
  maxDepth: number; // Global max depth across all rows
}

/**
 * Create a 2D grid of nodes organized by prerequisite row (Y) and depth (X)
 * Ensures each node gets its own column by using a sub-positioning strategy
 */
export function createDependencyGrid(
  lanes: Array<{ label: string; description: string; nodes: FlowNode[] }>,
  allNodes: FlowNode[]
): DependencyGrid {
  const depths = computeNodeDepths(allNodes);
  let globalMaxDepth = 0;
  
  const rows = lanes.map(lane => {
    // Group nodes by depth
    const nodesByDepth = new Map<number, FlowNode[]>();
    
    lane.nodes.forEach(node => {
      const depth = depths.get(node.id) ?? 0;
      if (!nodesByDepth.has(depth)) {
        nodesByDepth.set(depth, []);
      }
      nodesByDepth.get(depth)!.push(node);
    });
    
    // Find max depth in this row
    const rowMaxDepth = Math.max(...Array.from(nodesByDepth.keys()), 0);
    globalMaxDepth = Math.max(globalMaxDepth, rowMaxDepth);
    
    // Create columns - each node with the same depth gets its own sub-column
    const columns: GridCell[] = [];
    
    for (let depth = 0; depth <= rowMaxDepth; depth++) {
      const nodesAtDepth = nodesByDepth.get(depth) || [];
      
      if (nodesAtDepth.length === 0) {
        // Empty column
        columns.push({ nodes: [] });
      } else if (nodesAtDepth.length === 1) {
        // Single node - gets its own column
        columns.push({ nodes: nodesAtDepth });
      } else {
        // Multiple nodes at same depth - give each its own column
        // This prevents vertical stacking that implies sequence
        nodesAtDepth.forEach(node => {
          columns.push({ nodes: [node] });
        });
      }
    }
    
    return {
      label: lane.label,
      description: lane.description,
      columns,
      maxDepth: rowMaxDepth,
    };
  });
  
  return {
    rows,
    maxDepth: globalMaxDepth,
  };
}

