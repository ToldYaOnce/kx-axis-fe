/**
 * Conversation Item Template Types
 * 
 * Templates define runtime behavior for conversation transitions,
 * including message phrasing, variable substitution, and LLM configuration.
 */

export interface ConversationTemplate {
  // Identity
  id?: string;
  tenantId?: string;              // Provided via x-tenant-id header
  nodeId?: string;                // Specific node instance
  nodeType?: string;              // Reusable across similar nodes
  description?: string;
  
  // Message Components
  ack?: string;                   // Acknowledgment: "Got it - {{lastStatement}}"
  explanation?: string;           // Main bridge message
  permission?: string;            // Trailing clause: "if that works for you"
  
  // Behavior Flags
  isSpecialNode?: boolean;        // Requires this template
  suppressAck?: boolean;          // Skip acknowledgment on next turn
  skipLLM?: boolean;              // Use template directly without LLM
  
  // Context & Metadata
  producesFacts?: string[];       // Facts this conversation item produces (required)
  optionalFacts?: string[];       // Facts that are nice to have but not required
  targetFactId?: string;          // Primary fact being collected
  variables?: string[];           // Variables used: ["lastStatement", "userName"]
  metadata?: Record<string, any>; // Additional custom data
  
  // Timestamps (from backend)
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTemplateRequest {
  tenantId?: string;              // Optional - provided via x-tenant-id header
  nodeType?: string;
  description?: string;
  isSpecialNode?: boolean;
  skipLLM?: boolean;
}

export interface UpdateTemplateRequest {
  ack?: string;
  explanation?: string;
  permission?: string;
  description?: string;
  nodeType?: string;
  isSpecialNode?: boolean;
  suppressAck?: boolean;
  skipLLM?: boolean;
  producesFacts?: string[];
  optionalFacts?: string[];
  targetFactId?: string;
  variables?: string[];
  metadata?: Record<string, any>;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
}

export const AVAILABLE_VARIABLES: TemplateVariable[] = [
  {
    name: 'lastStatement',
    description: "User's last statement (cleaned)",
    example: 'no cardio right now'
  },
  {
    name: 'userName',
    description: "User's name (if collected)",
    example: 'David'
  },
  {
    name: 'goalType',
    description: "User's goal category",
    example: 'weight loss'
  },
  {
    name: 'currentNode',
    description: 'Current node title',
    example: 'Reflective Question'
  },
  {
    name: 'targetNode',
    description: 'Target node title',
    example: 'Contact Capture'
  },
];

