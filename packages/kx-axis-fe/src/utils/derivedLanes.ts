import type { FlowNode } from '../types';
import { computeNodeDepths } from './dependencyDepth';

export interface NodeWithPosition {
  node: FlowNode;
  verticalPosition: number; // Vertical position within the lane for alignment
}

export interface DerivedLane {
  index: number;
  label: string;
  description: string;
  nodes: NodeWithPosition[]; // Changed to include position info
  hasExternalPrereqs: boolean;
}

/**
 * Compute derived lanes based on dependency depth
 * All nodes at the same depth go in the same lane (vertical column)
 */
export function computeDerivedLanes(nodes: FlowNode[]): DerivedLane[] {
  if (nodes.length === 0) return [];
  
  // Compute depth for all nodes
  const depths = computeNodeDepths(nodes);
  const maxDepth = Math.max(...Array.from(depths.values()), 0);
  
  // Group nodes by depth
  const nodesByDepth = new Map<number, FlowNode[]>();
  for (let depth = 0; depth <= maxDepth; depth++) {
    nodesByDepth.set(depth, []);
  }
  
  nodes.forEach(node => {
    const depth = depths.get(node.id) ?? 0;
    nodesByDepth.get(depth)!.push(node);
  });
  
  // Track node positions within each lane for vertical alignment
  const nodePositions = new Map<string, number>(); // nodeId -> vertical position
  
  // Create lanes for each depth
  const lanes: DerivedLane[] = [];
  
  for (let depth = 0; depth <= maxDepth; depth++) {
    const nodesAtThisDepth = nodesByDepth.get(depth) || [];
    if (nodesAtThisDepth.length === 0) continue;
    
    const laneIndex = lanes.length;
    
    // Assign vertical positions based on dependencies from previous depth
    const nodesWithPositions: NodeWithPosition[] = [];
    
    if (depth === 0) {
      // First lane: just stack nodes sequentially
      nodesAtThisDepth.forEach((node, index) => {
        nodePositions.set(node.id, index);
        nodesWithPositions.push({ node, verticalPosition: index });
      });
    } else {
      // Later lanes: align with nodes from previous depth (causal bands)
      // Group nodes by their PRIMARY unlocking node to create causal bands
      const causalBands = new Map<string, FlowNode[]>(); // producerId -> unlocked nodes
      const orphanNodes: FlowNode[] = [];
      
      nodesAtThisDepth.forEach(node => {
        // Find which node from previous depth unlocks this node
        let primaryUnlocker: FlowNode | null = null;
        
        if (node.requires) {
          for (const req of node.requires) {
            // Find producing node from previous depth
            const producer = nodes.find(n => 
              ((n.produces && n.produces.includes(req)) || n.id === req) &&
              depths.get(n.id) === depth - 1
            );
            if (producer) {
              primaryUnlocker = producer;
              break; // Use first found as primary
            }
          }
        }
        
        if (primaryUnlocker) {
          // Add to the causal band of the unlocker
          if (!causalBands.has(primaryUnlocker.id)) {
            causalBands.set(primaryUnlocker.id, []);
          }
          causalBands.get(primaryUnlocker.id)!.push(node);
        } else {
          // No clear unlocker from previous depth
          orphanNodes.push(node);
        }
      });
      
      // Build the final list with positions
      // Each causal band starts at the position of its unlocker and expands vertically
      let nextAvailablePosition = 0;
      
      // First, place nodes in causal bands (aligned with their unlockers)
      const sortedUnlockers = Array.from(causalBands.keys()).sort((a, b) => {
        const posA = nodePositions.get(a) ?? 0;
        const posB = nodePositions.get(b) ?? 0;
        return posA - posB;
      });
      
      sortedUnlockers.forEach(unlockerId => {
        const unlockerPosition = nodePositions.get(unlockerId) ?? 0;
        const unlockedNodes = causalBands.get(unlockerId)!;
        
        // Ensure we don't overlap with previous bands
        const bandStartPosition = Math.max(unlockerPosition, nextAvailablePosition);
        
        // Place all unlocked nodes in this band
        unlockedNodes.forEach((node, index) => {
          const position = bandStartPosition + index;
          nodePositions.set(node.id, position);
          nodesWithPositions.push({ node, verticalPosition: position });
          nextAvailablePosition = Math.max(nextAvailablePosition, position + 1);
        });
      });
      
      // Then place orphan nodes at the end
      orphanNodes.forEach(node => {
        nodePositions.set(node.id, nextAvailablePosition);
        nodesWithPositions.push({ node, verticalPosition: nextAvailablePosition });
        nextAvailablePosition++;
      });
    }
    
    const nodesInThisLane = nodesWithPositions;
    
    // Determine lane label - purely structural, no dependency semantics
    let label: string;
    let description: string;
    
    if (depth === 0) {
      label = 'Initially Available';
      description = 'No prerequisites';
    } else {
      label = 'Next';
      description = 'Unlocked by previous capabilities';
    }
    
    lanes.push({
      index: laneIndex,
      label,
      description,
      nodes: nodesInThisLane,
      hasExternalPrereqs: false,
    });
  }
  
  return lanes;
}

/**
 * Find which lane a node should be in
 */
export function computeNodeLane(node: FlowNode, allNodes: FlowNode[]): number {
  const lanes = computeDerivedLanes(allNodes);
  const lane = lanes.find(l => l.nodes.some(np => np.node.id === node.id));
  return lane?.index ?? lanes.length;
}

