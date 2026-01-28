/**
 * Personas API Client
 * 
 * Handles fetching and managing personas for simulations
 */

export interface PersonaPersonality {
  communicationStyle?: string;
  nickname?: string;
  personalityQuirks?: string;
  traits?: string;
  expertise?: string;
  terminology?: string;
}

export interface Persona {
  personaId: string;
  name: string;
  role: string;
  personality: PersonaPersonality;
  tenantId: string;
  createdAt: string;
}

export interface ListPersonasResponse {
  success: boolean;
  data: Persona[];
}

export class PersonasAPIClient {
  private baseURL: string;
  private serviceKey: string;
  private tenantId: string;

  constructor(baseURL?: string, serviceKey?: string, tenantId?: string) {
    this.baseURL = baseURL || 'https://i41zn9fza8.execute-api.us-east-1.amazonaws.com/prod';
    this.serviceKey = serviceKey || 'qhO4JD5yBBjVZbzRxnL-BhbapFTvPaSTYNVVu97JxzU';
    this.tenantId = tenantId || 'tenant_1757418497028_g9o6mnb4m';
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-service-key': this.serviceKey,
      'x-tenant-id': this.tenantId,
    };
  }

  /**
   * GET /agent/personas?tenantId=xxx - List all personas for tenant
   */
  async listPersonas(): Promise<Persona[]> {
    console.log('🔍 Fetching personas for tenant:', this.tenantId);
    
    const response = await fetch(`${this.baseURL}/agent/personas?tenantId=${this.tenantId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch personas:', response.status, errorText);
      throw new Error(`Failed to fetch personas: ${response.status} ${response.statusText}`);
    }

    const result: ListPersonasResponse = await response.json();
    console.log('✅ Personas fetched:', result.data?.length || 0);
    
    return result.success ? result.data : [];
  }
}

// Export singleton instance
export const personasAPI = new PersonasAPIClient();

