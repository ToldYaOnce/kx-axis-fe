/**
 * API Client for Conversation Item Templates
 * 
 * Base: /agent/conversation-item-templates
 * 
 * Auth modes:
 * - Dev/Staging: x-service-key header (gateway resolves tenantId)
 * - Production: Authorization: Bearer <jwt> header
 */

import { getAuthHeaders, AuthError } from '../auth/authHeaders';
import type { 
  ConversationTemplate, 
  CreateTemplateRequest, 
  UpdateTemplateRequest 
} from '../types/templates';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Get headers with auth credentials
 */
function getHeaders(): HeadersInit {
  try {
    const authHeaders = getAuthHeaders();
    
    return {
      'Content-Type': 'application/json',
      ...authHeaders,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      console.error('[Templates API Auth Error]', error.message, `(mode: ${error.mode})`);
      throw new Error(error.message);
    }
    throw error;
  }
}

export const templatesAPI = {
  /**
   * Get all templates for a tenant
   */
  async list(): Promise<ConversationTemplate[]> {
    const response = await fetch(`${API_BASE}/agent/conversation-item-templates`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Handle different response formats
    // If API returns { templates: [...] }, extract the array
    if (result.templates && Array.isArray(result.templates)) {
      return result.templates;
    }
    
    // If API returns array directly
    if (Array.isArray(result)) {
      return result;
    }
    
    // If API returns { data: { templates: [...] } }
    if (result.data?.templates && Array.isArray(result.data.templates)) {
      return result.data.templates;
    }
    
    // Fallback: return empty array
    console.warn('Unexpected API response format:', result);
    return [];
  },

  /**
   * Get a single template by ID
   */
  async get(templateId: string): Promise<ConversationTemplate> {
    const response = await fetch(`${API_BASE}/agent/conversation-item-templates/${templateId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }
    
    return response.json();
  },

  /**
   * Create a new template
   */
  async create(data: CreateTemplateRequest): Promise<ConversationTemplate> {
    const response = await fetch(`${API_BASE}/agent/conversation-item-templates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create template: ${response.statusText}`);
    }
    
    return response.json();
  },

  /**
   * Update an existing template
   */
  async update(templateId: string, data: UpdateTemplateRequest): Promise<ConversationTemplate> {
    const response = await fetch(`${API_BASE}/agent/conversation-item-templates/${templateId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update template: ${response.statusText}`);
    }
    
    return response.json();
  },

  /**
   * Delete a template
   */
  async delete(templateId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/agent/conversation-item-templates/${templateId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete template: ${response.statusText}`);
    }
  },
};

