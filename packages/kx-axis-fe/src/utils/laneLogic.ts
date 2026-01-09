import type { FlowNode, EligibilityLane } from '../types';

/**
 * Special gate identifiers used in requires
 * These are HARD GATES that control eligibility
 */
export const GATES = {
  CONTACT: 'CONTACT',
  BOOKING: 'BOOKING',
  HANDOFF: 'HANDOFF',
} as const;

/**
 * Lane configuration for visual layout
 */
export const LANE_CONFIG: Record<
  EligibilityLane,
  {
    label: string;
    description: string;
    color: string;
    order: number;
  }
> = {
  BEFORE_CONTACT: {
    label: 'Before Contact',
    description: 'No contact required - casual conversation',
    color: '#E8F5E9',
    order: 0,
  },
  CONTACT_GATE: {
    label: 'Contact Gate',
    description: 'Captures contact information',
    color: '#FFF9C4',
    order: 1,
  },
  AFTER_CONTACT: {
    label: 'After Contact',
    description: 'Requires contact',
    color: '#E3F2FD',
    order: 2,
  },
  AFTER_BOOKING: {
    label: 'After Booking',
    description: 'Requires booking',
    color: '#F3E5F5',
    order: 3,
  },
};

/**
 * Calculate which lane a node belongs to based on its requires/satisfies
 */
export function calculateNodeLane(node: FlowNode): EligibilityLane {
  // If manually set, respect it
  if (node.ui?.lane) {
    return node.ui.lane;
  }

  const requires = node.requires || [];
  const satisfiesGates = node.satisfies?.gates || [];

  // Priority 1: If node satisfies CONTACT, it IS the contact gate
  if (satisfiesGates.includes('CONTACT')) {
    return 'CONTACT_GATE';
  }

  // Priority 2: If node requires BOOKING, it's after booking
  if (requires.includes(GATES.BOOKING)) {
    return 'AFTER_BOOKING';
  }

  // Priority 3: If node requires CONTACT, it's after contact
  if (requires.includes(GATES.CONTACT)) {
    return 'AFTER_CONTACT';
  }

  // Default: Before contact
  return 'BEFORE_CONTACT';
}

/**
 * Get all gates that a node requires (for display)
 */
export function getNodeGateRequirements(node: FlowNode): string[] {
  const requires = node.requires || [];
  return requires.filter((req) => Object.values(GATES).includes(req as any));
}

/**
 * Get all gates that a node satisfies (for display)
 */
export function getNodeGateSatisfactions(node: FlowNode): string[] {
  return node.satisfies?.gates || [];
}

/**
 * Validate if a node can be placed in a specific lane
 */
export function validateNodeInLane(node: FlowNode, targetLane: EligibilityLane): string | null {
  const requires = node.requires || [];
  const satisfiesGates = node.satisfies?.gates || [];

  switch (targetLane) {
    case 'BEFORE_CONTACT':
      if (requires.includes(GATES.CONTACT)) {
        return 'Cannot place in BEFORE_CONTACT: node requires contact';
      }
      if (requires.includes(GATES.BOOKING)) {
        return 'Cannot place in BEFORE_CONTACT: node requires booking';
      }
      break;

    case 'CONTACT_GATE':
      if (!satisfiesGates.includes('CONTACT')) {
        return 'Only nodes that satisfy CONTACT can be in CONTACT_GATE';
      }
      break;

    case 'AFTER_CONTACT':
      if (!requires.includes(GATES.CONTACT)) {
        return 'Nodes in AFTER_CONTACT should require CONTACT';
      }
      if (requires.includes(GATES.BOOKING)) {
        return 'Node requires BOOKING - should be in AFTER_BOOKING';
      }
      break;

    case 'AFTER_BOOKING':
      if (!requires.includes(GATES.BOOKING)) {
        return 'Nodes in AFTER_BOOKING should require BOOKING';
      }
      break;
  }

  return null;
}

/**
 * Update node requirements when moved to a new lane
 * This is the semantic action of drag-and-drop
 */
export function updateNodeForLane(node: FlowNode, targetLane: EligibilityLane): FlowNode {
  const requires = new Set(node.requires || []);
  const satisfiesGates = new Set(node.satisfies?.gates || []);
  const satisfiesMetrics = node.satisfies?.metrics || [];
  const satisfiesStates = node.satisfies?.states || [];

  switch (targetLane) {
    case 'BEFORE_CONTACT':
      // Remove all gate requirements and satisfactions
      requires.delete(GATES.CONTACT);
      requires.delete(GATES.BOOKING);
      satisfiesGates.delete('CONTACT');
      satisfiesGates.delete('BOOKING');
      break;

    case 'CONTACT_GATE':
      // Add CONTACT to satisfies, remove from requires
      satisfiesGates.add('CONTACT');
      requires.delete(GATES.CONTACT);
      requires.delete(GATES.BOOKING);
      break;

    case 'AFTER_CONTACT':
      // Add CONTACT to requires, remove from satisfies
      requires.add(GATES.CONTACT);
      requires.delete(GATES.BOOKING);
      satisfiesGates.delete('CONTACT');
      break;

    case 'AFTER_BOOKING':
      // Add both CONTACT and BOOKING to requires
      requires.add(GATES.CONTACT);
      requires.add(GATES.BOOKING);
      satisfiesGates.delete('CONTACT');
      satisfiesGates.delete('BOOKING');
      break;
  }

  return {
    ...node,
    requires: Array.from(requires),
    satisfies: {
      gates: Array.from(satisfiesGates),
      metrics: satisfiesMetrics,
      states: satisfiesStates,
    },
    ui: {
      ...node.ui,
      x: node.ui?.x || 0,
      y: node.ui?.y || 0,
      lane: targetLane,
    },
  };
}

/**
 * Get lane position (x coordinate) for horizontal layout
 */
export function getLaneXPosition(lane: EligibilityLane, canvasWidth: number): number {
  const laneWidth = canvasWidth / 4;
  return LANE_CONFIG[lane].order * laneWidth + 20;
}

/**
 * Determine which lane a point (x, y) is in
 */
export function getLaneAtPosition(x: number, canvasWidth: number): EligibilityLane {
  const laneWidth = canvasWidth / 4;
  const laneIndex = Math.floor(x / laneWidth);

  const lanes: EligibilityLane[] = ['BEFORE_CONTACT', 'CONTACT_GATE', 'AFTER_CONTACT', 'AFTER_BOOKING'];
  return lanes[Math.min(laneIndex, 3)];
}
