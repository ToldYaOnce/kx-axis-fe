/**
 * KxAxis Flow API Client
 * 
 * MATCHES BACKEND API EXACTLY
 * Base: https://<api-gateway>/agent/flows
 * 
 * URL Format: Uses query params, NOT path params
 * - /agent/flows?flowId={flowId} (NOT /agent/flows/{flowId})
 * 
 * Auth modes:
 * - Dev/Staging: x-service-key header (gateway resolves tenantId)
 * - Production: Authorization: Bearer <jwt> header
 * 
 * ID Cleaning:
 * - Automatically strips DynamoDB prefixes (TENANT#, FLOW#, etc.) from responses
 * - Backend should handle this, but we clean as a defensive measure
 */

import { getAuthHeaders, AuthError } from '../auth/authHeaders';
import type {
  ListFlowsResponse,
  CreateFlowRequest,
  CreateFlowResponse,
  GetFlowOptions,
  GetFlowResponse,
  PatchFlowMetadataRequest,
  PatchFlowMetadataResponse,
  ReplaceDraftRequest,
  ReplaceDraftResponse,
  ValidateFlowResponse,
  PublishFlowRequest,
  PublishFlowResponse,
  FlowApiError,
} from '../types/flow-api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Strip DynamoDB composite key prefixes from IDs
 * 
 * WORKAROUND: Backend should strip these before returning responses,
 * but we handle it here as a defensive measure.
 * 
 * Removes: TENANT#, FLOW#, DRAFT#, VERSION# prefixes
 * 
 * Example: "FLOW#flow_123" → "flow_123"
 */
function cleanId(id: string | undefined): string | undefined {
  if (!id) return id;
  return id.replace(/^(TENANT#|FLOW#|DRAFT#|VERSION#)/, '');
}

/**
 * Recursively clean all ID fields in an object
 */
function cleanResponse<T>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanResponse(item)) as any;
  }
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Clean ID fields
    if ((key === 'flowId' || key === 'tenantId' || key === 'draftId' || key === 'versionId' || key === 'PK' || key === 'SK') && typeof value === 'string') {
      cleaned[key] = cleanId(value);
    }
    // Recursively clean nested objects
    else if (value && typeof value === 'object') {
      cleaned[key] = cleanResponse(value);
    }
    else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * Normalize API errors into consistent format
 */
async function handleApiError(response: Response): Promise<never> {
  let errorBody: any;
  try {
    errorBody = await response.json();
  } catch {
    errorBody = { message: response.statusText };
  }

  const error: FlowApiError = {
    status: response.status,
    code: errorBody.code || 'UNKNOWN_ERROR',
    message: errorBody.message || `Request failed with status ${response.status}`,
    details: errorBody.details || errorBody,
  };

  throw error;
}

/**
 * Handle auth errors with user-friendly messages
 */
function handleAuthError(error: AuthError): never {
  const apiError: FlowApiError = {
    status: error.code === 'MISSING_TOKEN' ? 401 : 403,
    code: error.code,
    message: error.message,
    details: { authMode: error.mode },
  };

  // Log to console for dev debugging
  console.error('[Flow API Auth Error]', error.message, `(mode: ${error.mode})`);

  throw apiError;
}

/**
 * Flow API Client
 */
class FlowAPIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Get common headers (content-type + auth)
   * 
   * Auth headers injected based on environment:
   * - Dev/Staging: x-service-key
   * - Production: Authorization: Bearer <jwt>
   * 
   * Note: x-tenant-id NOT included - gateway resolves tenant from auth
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
   * GET /agent/flows - List all flows for tenant
   */
  async listFlows(): Promise<ListFlowsResponse> {
    const response = await fetch(`${this.baseURL}/agent/flows`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      return handleApiError(response);
    }

    const data = await response.json();
    return cleanResponse<ListFlowsResponse>(data);
  }

  /**
   * POST /agent/flows - Create a new flow
   */
  async createFlow(request: CreateFlowRequest): Promise<CreateFlowResponse> {
    const response = await fetch(`${this.baseURL}/agent/flows`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return handleApiError(response);
    }

    const data = await response.json();
    return cleanResponse<CreateFlowResponse>(data);
  }

  /**
   * GET /agent/flows?flowId={flowId} - Get flow + draft or version
   * 
   * Options:
   * - includeVersions: add &include=versions to get versions list
   * - versionId: add &versionId=xxx to get specific version instead of draft
   */
  async getFlow(flowId: string, options?: GetFlowOptions): Promise<GetFlowResponse> {
    const params = new URLSearchParams();
    params.append('flowId', flowId);
    
    if (options?.includeVersions) {
      params.append('include', 'versions');
    }
    if (options?.versionId) {
      params.append('versionId', options.versionId);
    }

    const url = `${this.baseURL}/agent/flows?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      return handleApiError(response);
    }

    const data = await response.json();
    return cleanResponse<GetFlowResponse>(data);
  }

  /**
   * PATCH /agent/flows?flowId={flowId} - Update flow metadata
   * 
   * IMPORTANT: Only sends name/description/primaryGoal (no draftGraph)
   */
  async patchFlowMetadata(flowId: string, request: PatchFlowMetadataRequest): Promise<PatchFlowMetadataResponse> {
    const response = await fetch(`${this.baseURL}/agent/flows?flowId=${flowId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return handleApiError(response);
    }

    const data = await response.json();
    return cleanResponse<PatchFlowMetadataResponse>(data);
  }

  /**
   * PATCH /agent/flows?flowId={flowId} - Replace draft
   * 
   * IMPORTANT: Sends draftGraph/uiLayout (NOT metadata fields)
   */
  async replaceDraft(flowId: string, request: ReplaceDraftRequest): Promise<ReplaceDraftResponse> {
    const response = await fetch(`${this.baseURL}/agent/flows?flowId=${flowId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return handleApiError(response);
    }

    const data = await response.json();
    return cleanResponse<ReplaceDraftResponse>(data);
  }

  /**
   * PATCH /agent/flows?flowId={flowId}&action=validate - Validate current draft
   */
  async validateDraft(flowId: string): Promise<ValidateFlowResponse> {
    const response = await fetch(`${this.baseURL}/agent/flows?flowId=${flowId}&action=validate`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({}),  // Empty body ok
    });

    if (!response.ok) {
      return handleApiError(response);
    }

    const data = await response.json();
    return cleanResponse<ValidateFlowResponse>(data);
  }

  /**
   * PATCH /agent/flows?flowId={flowId}&action=publish - Publish current draft as new version
   * 
   * IMPORTANT: Must include sourceDraftHash from current draft
   */
  async publishFlow(flowId: string, request: PublishFlowRequest): Promise<PublishFlowResponse> {
    const response = await fetch(`${this.baseURL}/agent/flows?flowId=${flowId}&action=publish`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return handleApiError(response);
    }

    const data = await response.json();
    return cleanResponse<PublishFlowResponse>(data);
  }

  /**
   * DELETE /agent/flows?flowId={flowId} - Delete a flow and all its versions
   */
  async deleteFlow(flowId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/agent/flows?flowId=${flowId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      return handleApiError(response);
    }

    // DELETE typically returns 204 No Content
    if (response.status !== 204) {
      await response.json(); // Consume response if any
    }
  }
}

export const flowAPI = new FlowAPIClient();
