/**
 * KxAxis Simulator API Client
 * 
 * Typed client for simulator endpoints.
 * Backend validation is handled server-side with Zod.
 */

import type {
  StartSimulationRequest,
  StartSimulationResponse,
  StepSimulationRequest,
  StepSimulationResponse,
  ForkSimulationRequest,
  ForkSimulationResponse,
} from '../types/simulator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class SimulatorAPIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Start a new simulation run
   */
  async startSimulation(request: StartSimulationRequest): Promise<StartSimulationResponse> {
    const response = await fetch(`${this.baseURL}/simulator/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to start simulation: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Execute a single step in the simulation
   */
  async stepSimulation(request: StepSimulationRequest): Promise<StepSimulationResponse> {
    const response = await fetch(`${this.baseURL}/simulator/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to step simulation: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fork a simulation from a specific node
   */
  async forkSimulation(request: ForkSimulationRequest): Promise<ForkSimulationResponse> {
    const response = await fetch(`${this.baseURL}/simulator/fork`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to fork simulation: ${response.statusText}`);
    }

    return response.json();
  }
}

export const simulatorAPI = new SimulatorAPIClient();

