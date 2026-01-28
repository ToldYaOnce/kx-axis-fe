/**
 * KxAxis Simulator API Client
 * 
 * NEW API: /agent/simulations (matches SIMULATION_API_INTEGRATION.md)
 * 
 * Auth modes:
 * - Dev/Staging: x-service-key header (gateway resolves tenantId)
 * - Production: Authorization: Bearer <jwt> header
 */

import { getAuthHeaders, AuthError } from '../auth/authHeaders';
import type {
  StartSimulationRequest,
  StartSimulationResponse,
  StepSimulationRequest,
  StepSimulationResponse,
  ListSimulationsRequest,
  ListSimulationsResponse,
  GetSimulationResponse,
  ApiFlowNode,
} from '../types/simulator';
import type { FlowNode } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Handle auth errors
 */
function handleAuthError(error: AuthError): never {
  console.error('[Simulator API Auth Error]', error.message, `(mode: ${error.mode})`);
  throw new Error(error.message);
}

/**
 * Transform FlowNode to API format
 */
export function transformFlowNodeForAPI(node: FlowNode): ApiFlowNode {
  return {
    id: node.id,
    title: node.title,
    type: node.type,
    producesFacts: node.produces || [],
  };
}

/**
 * Transform array of FlowNodes to API format
 */
export function transformFlowNodesForAPI(nodes: FlowNode[]): ApiFlowNode[] {
  return nodes.map(transformFlowNodeForAPI);
}

class SimulatorAPIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Get common headers (content-type + auth)
   */
  private getHeaders(): HeadersInit {
    try {
      const authHeaders = getAuthHeaders();
      
      return {
        'Content-Type': 'application/json',
        ...authHeaders,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        handleAuthError(error);
      }
      throw error;
    }
  }

  /**
   * GET /agent/simulations - List simulations for a flow
   */
  async listSimulations(request: ListSimulationsRequest): Promise<ListSimulationsResponse> {
    const params = new URLSearchParams();
    params.append('flowId', request.flowId);
    if (request.tenantId) params.append('tenantId', request.tenantId);
    if (request.limit) params.append('limit', request.limit.toString());
    if (request.offset) params.append('offset', request.offset.toString());

    console.log('📋 Listing simulations for flow:', request.flowId);
    
    const response = await fetch(`${this.baseURL}/agent/simulations?${params.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to list simulations:', response.status, errorText);
      throw new Error(`Failed to list simulations: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Backend returns: {simulations: [], count: 0}
    // Normalize to our expected format
    if (result.simulations !== undefined) {
      const normalized = {
        success: true,
        data: {
          simulations: result.simulations,
          total: result.count || 0,
        }
      };
      console.log('✅ Simulations listed:', normalized.data.total, 'found');
      return normalized;
    }
    
    // Already in expected format
    console.log('✅ Simulations listed:', result.data?.total || 0, 'found');
    return result;
  }

  /**
   * GET /agent/simulations?simulationId=xxx - Get simulation details
   */
  async getSimulation(simulationId: string): Promise<GetSimulationResponse> {
    console.log('🔍 Getting simulation:', simulationId);
    
    const response = await fetch(`${this.baseURL}/agent/simulations?simulationId=${simulationId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to get simulation:', response.status, errorText);
      throw new Error(`Failed to get simulation: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Simulation retrieved:', result.name);
    return result;
  }

  /**
   * POST /agent/simulations - Create a new simulation
   */
  async startSimulation(request: StartSimulationRequest): Promise<StartSimulationResponse> {
    console.log('🚀 Starting simulation:', request);
    
    const response = await fetch(`${this.baseURL}/agent/simulations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to start simulation:', response.status, errorText);
      throw new Error(`Failed to start simulation: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Simulation started:', result);
    return result;
  }

  /**
   * PATCH /agent/simulations?simulationId=xxx - Continue conversation
   */
  async stepSimulation(
    simulationId: string,
    request: StepSimulationRequest
  ): Promise<StepSimulationResponse> {
    console.log('💬 Stepping simulation:', simulationId, request);
    
    const response = await fetch(`${this.baseURL}/agent/simulations?simulationId=${simulationId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to step simulation:', response.status, errorText);
      throw new Error(`Failed to step simulation: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Step completed:', result);
    return result;
  }

  /**
   * DELETE /agent/simulations?simulationId=xxx - Delete simulation
   */
  async deleteSimulation(simulationId: string): Promise<void> {
    console.log('🗑️ Deleting simulation:', simulationId);
    
    const response = await fetch(`${this.baseURL}/agent/simulations?simulationId=${simulationId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete simulation: ${response.status} ${response.statusText}`);
    }
    
    console.log('✅ Simulation deleted');
  }
}

export const simulatorAPI = new SimulatorAPIClient();

