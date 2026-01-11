import type { FlowNode } from '../types';

export interface DerivedLane {
  index: number;
  label: string;
  description: string;
  nodes: FlowNode[];
  hasExternalPrereqs: boolean;
}

/**
 * Extract facts that a node needs before it can run
 */
function getNodeNeedsBefore(node: FlowNode): string[] {
  const needs: string[] = [];
  
  // Gates from requires (CONTACT, BOOKING, etc.)
  if (node.requires) {
    node.requires.forEach(req => {
      // Filter out node IDs (they typically have hyphens)
      if (!req.includes('-') && req.length < 20) {
        needs.push(req.toLowerCase());
      }
    });
  }
  
  return needs;
}

/**
 * Extract facts that a node produces
 */
function getNodeProduces(node: FlowNode): string[] {
  const produces: string[] = [];
  
  // Gates from satisfies
  if (node.satisfies?.gates) {
    produces.push(...node.satisfies.gates.map(g => g.toLowerCase()));
  }
  
  // Metrics from satisfies (treat as facts)
  if (node.satisfies?.metrics) {
    produces.push(...node.satisfies.metrics);
  }
  
  return produces;
}

/**
 * Compute derived lanes based on node prerequisites
 */
export function computeDerivedLanes(nodes: FlowNode[]): DerivedLane[] {
  const lanes: DerivedLane[] = [];
  const placedNodes = new Set<string>();
  const availableFacts = new Set<string>();
  
  // Track all facts that will eventually be produced
  const allProducedFacts = new Set<string>();
  nodes.forEach(node => {
    getNodeProduces(node).forEach(fact => allProducedFacts.add(fact));
  });
  
  let laneIndex = 0;
  let remainingNodes = [...nodes];
  
  // Keep iterating until all nodes are placed
  while (remainingNodes.length > 0 && laneIndex < 10) { // safety limit
    const nodesInThisLane: FlowNode[] = [];
    const hasExternalPrereqs = false;
    
    // Find nodes that can be placed in this lane
    remainingNodes.forEach(node => {
      const needsBefore = getNodeNeedsBefore(node);
      
      // Lane 0: no prerequisites
      if (laneIndex === 0 && needsBefore.length === 0) {
        nodesInThisLane.push(node);
        return;
      }
      
      // Later lanes: all prerequisites must be available
      const allPrereqsMet = needsBefore.every(fact => availableFacts.has(fact));
      if (allPrereqsMet && needsBefore.length > 0) {
        nodesInThisLane.push(node);
      }
    });
    
    // If no nodes can be placed, try to place nodes with external prereqs
    if (nodesInThisLane.length === 0 && remainingNodes.length > 0) {
      // Place remaining nodes in subsequent lanes based on unfulfilled prereqs
      const nodeWithLeastUnmetPrereqs = remainingNodes.reduce((best, node) => {
        const needsBefore = getNodeNeedsBefore(node);
        const unmetCount = needsBefore.filter(f => !availableFacts.has(f)).length;
        const bestUnmetCount = getNodeNeedsBefore(best).filter(f => !availableFacts.has(f)).length;
        return unmetCount < bestUnmetCount ? node : best;
      });
      
      nodesInThisLane.push(nodeWithLeastUnmetPrereqs);
    }
    
    if (nodesInThisLane.length === 0) break;
    
    // Mark these nodes as placed
    nodesInThisLane.forEach(node => {
      placedNodes.add(node.id);
      // Add facts this node produces to available facts
      getNodeProduces(node).forEach(fact => availableFacts.add(fact));
    });
    
    // Remove placed nodes from remaining
    remainingNodes = remainingNodes.filter(n => !placedNodes.has(n.id));
    
    // Determine lane label
    let label: string;
    let description: string;
    
    if (laneIndex === 0) {
      label = 'No prerequisites';
      description = 'Can run immediately';
    } else {
      // Find most common prerequisites in this lane
      const prereqCounts = new Map<string, number>();
      nodesInThisLane.forEach(node => {
        getNodeNeedsBefore(node).forEach(fact => {
          prereqCounts.set(fact, (prereqCounts.get(fact) || 0) + 1);
        });
      });
      
      const topPrereqs = Array.from(prereqCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([fact]) => fact);
      
      if (topPrereqs.length === 0) {
        label = `Lane ${laneIndex}`;
        description = 'External prerequisites';
      } else if (topPrereqs.length === 1) {
        label = `Needs: ${topPrereqs[0]}`;
        description = `Requires ${topPrereqs[0]} to be captured`;
      } else {
        label = `Needs: ${topPrereqs.join(', ')}`;
        description = `Requires multiple facts`;
      }
    }
    
    lanes.push({
      index: laneIndex,
      label,
      description,
      nodes: nodesInThisLane,
      hasExternalPrereqs,
    });
    
    laneIndex++;
  }
  
  return lanes;
}

/**
 * Find which lane a node should be in
 */
export function computeNodeLane(node: FlowNode, allNodes: FlowNode[]): number {
  const lanes = computeDerivedLanes(allNodes);
  const lane = lanes.find(l => l.nodes.some(n => n.id === node.id));
  return lane?.index ?? lanes.length;
}

