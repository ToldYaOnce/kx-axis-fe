/**
 * KxAxis Grid Layout Computation
 * 
 * Computes deterministic grid coordinates for nodes based on:
 * - Dependency depth (column)
 * - Causal band anchoring (row)
 */

import type { FlowNode } from '../types';
import { computeNodeDepths } from './dependencyDepth';

export interface NodeGridPosition {
  nodeId: string;
  gridCol: number;  // Column (dependency depth)
  gridRow: number;  // Row (causal band position)
}

/**
 * Compute grid positions for all nodes
 * 
 * Rules:
 * 1. Column = dependency depth (0 = no prereqs, 1+ = requires earlier nodes)
 * 2. Row = causal band position (aligned with unlocking node)
 * 3. Multi-prerequisite nodes placed in column of LATEST prerequisite
 * 4. Nodes unlocked by same parent stack vertically in that parent's causal band
 */
export function computeGridLayout(nodes: FlowNode[]): Map<string, NodeGridPosition> {
  const positions = new Map<string, NodeGridPosition>();
  
  if (nodes.length === 0) return positions;
  
  // Step 1: Compute dependency depth for each node (determines column)
  const depths = computeNodeDepths(nodes);
  const maxDepth = Math.max(...Array.from(depths.values()), 0);
  
  // Step 2: Group nodes by depth (column)
  const nodesByDepth = new Map<number, FlowNode[]>();
  for (let depth = 0; depth <= maxDepth; depth++) {
    nodesByDepth.set(depth, []);
  }
  
  nodes.forEach(node => {
    const depth = depths.get(node.id) ?? 0;
    nodesByDepth.get(depth)!.push(node);
  });
  
  // Step 3: Assign grid coordinates, processing columns left to right
  const nodeGridRows = new Map<string, number>(); // Track assigned rows
  
  for (let col = 0; col <= maxDepth; col++) {
    const nodesInColumn = nodesByDepth.get(col) || [];
    if (nodesInColumn.length === 0) continue;
    
    if (col === 0) {
      // First column (Initially Available): stack sequentially from row 0
      nodesInColumn.forEach((node, index) => {
        positions.set(node.id, {
          nodeId: node.id,
          gridCol: col,
          gridRow: index,
        });
        nodeGridRows.set(node.id, index);
      });
    } else {
      // Later columns: align with causal bands from previous column
      // Group by primary unlocking node to create causal bands
      const causalBands = new Map<string, FlowNode[]>(); // unlockerId -> unlocked nodes
      const orphanNodes: FlowNode[] = [];
      
      nodesInColumn.forEach(node => {
        // Find which node from previous column unlocks this node
        let primaryUnlocker: FlowNode | null = null;
        
        if (node.requires && node.requires.length > 0) {
          for (const req of node.requires) {
            // Find the producing node from previous column
            const producer = nodes.find(n => 
              ((n.produces && n.produces.includes(req)) || n.id === req) &&
              depths.get(n.id) === col - 1
            );
            if (producer) {
              primaryUnlocker = producer;
              break; // Use first found as primary
            }
          }
        }
        
        if (primaryUnlocker) {
          // Add to the causal band of this unlocker
          if (!causalBands.has(primaryUnlocker.id)) {
            causalBands.set(primaryUnlocker.id, []);
          }
          causalBands.get(primaryUnlocker.id)!.push(node);
        } else {
          // No clear unlocker from previous column
          orphanNodes.push(node);
        }
      });
      
      // Assign row positions based on causal bands
      let nextAvailableRow = 0;
      
      // First, process nodes in causal bands (sorted by unlocker row)
      const sortedUnlockers = Array.from(causalBands.keys()).sort((a, b) => {
        const rowA = nodeGridRows.get(a) ?? 0;
        const rowB = nodeGridRows.get(b) ?? 0;
        return rowA - rowB;
      });
      
      sortedUnlockers.forEach(unlockerId => {
        const unlockerRow = nodeGridRows.get(unlockerId) ?? 0;
        const unlockedNodes = causalBands.get(unlockerId)!;
        
        // Causal band starts at unlocker's row (or next available, whichever is higher)
        const bandStartRow = Math.max(unlockerRow, nextAvailableRow);
        
        // Place all nodes in this causal band, stacking vertically
        unlockedNodes.forEach((node, index) => {
          const row = bandStartRow + index;
          positions.set(node.id, {
            nodeId: node.id,
            gridCol: col,
            gridRow: row,
          });
          nodeGridRows.set(node.id, row);
          nextAvailableRow = Math.max(nextAvailableRow, row + 1);
        });
      });
      
      // Then place orphan nodes at the end
      orphanNodes.forEach(node => {
        positions.set(node.id, {
          nodeId: node.id,
          gridCol: col,
          gridRow: nextAvailableRow,
        });
        nodeGridRows.set(node.id, nextAvailableRow);
        nextAvailableRow++;
      });
    }
  }
  
  return positions;
}

/**
 * Helper to find which nodes are unlocked by a given node
 */
export function findUnlockedNodes(node: FlowNode, allNodes: FlowNode[]): FlowNode[] {
  const produces = node.produces || [];
  
  return allNodes.filter(n => {
    if (!n.requires || n.requires.length === 0) return false;
    
    // Check if this node requires any fact produced by the source node
    return n.requires.some(req => produces.includes(req) || req === node.id);
  });
}

/**
 * Get the maximum row used in a given column
 */
export function getMaxRowInColumn(positions: Map<string, NodeGridPosition>, col: number): number {
  let maxRow = -1;
  
  positions.forEach(pos => {
    if (pos.gridCol === col) {
      maxRow = Math.max(maxRow, pos.gridRow);
    }
  });
  
  return maxRow;
}

