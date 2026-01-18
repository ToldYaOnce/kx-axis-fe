/**
 * Centralized Auth Headers Provider
 * 
 * Supports two authentication modes:
 * 
 * 1. DEV/STAGING (Service Key Mode):
 *    - Uses x-service-key header
 *    - Enabled when VITE_KX_SERVICE_KEY is set
 *    - No Cognito login required
 *    - Gateway resolves tenantId/callerId from service key
 * 
 * 2. PRODUCTION (Cognito JWT Mode):
 *    - Uses Authorization: Bearer <jwt> header
 *    - Requires user authentication via Cognito
 *    - Token retrieved from auth provider
 * 
 * Reference: kx-aws gateway-auth-strategy.md
 */

/**
 * Auth mode detection
 */
export type AuthMode = 'service-key' | 'cognito-jwt' | 'none';

/**
 * Determine current auth mode based on environment
 */
export function getAuthMode(): AuthMode {
  const serviceKey = import.meta.env.VITE_KX_SERVICE_KEY;
  const env = import.meta.env.MODE || 'development';
  const isProduction = env === 'production';

  // Service key mode: dev/staging with service key set
  if (serviceKey && !isProduction) {
    return 'service-key';
  }

  // Cognito JWT mode: production or no service key
  if (isProduction || !serviceKey) {
    return 'cognito-jwt';
  }

  return 'none';
}

/**
 * Get ID token from Cognito (stub for now)
 * 
 * TODO: Integrate with actual Cognito auth provider when implemented
 * For now, check localStorage for token
 */
function getIdToken(): string | null {
  // Stub: Look for token in localStorage
  // Real implementation should use Cognito SDK or auth context
  return localStorage.getItem('kx-id-token') || null;
}

/**
 * Auth error class for better error handling
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public mode: AuthMode,
    public code: 'MISSING_SERVICE_KEY' | 'MISSING_TOKEN' | 'INVALID_CONFIG'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Get auth headers based on current mode
 * 
 * @throws {AuthError} If required auth credentials are missing
 */
export function getAuthHeaders(): Record<string, string> {
  const mode = getAuthMode();
  const tenantId = import.meta.env.VITE_TENANT_ID;
  
  // Base headers object
  const headers: Record<string, string> = {};
  
  // Add tenant ID if available
  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }

  switch (mode) {
    case 'service-key': {
      const serviceKey = import.meta.env.VITE_KX_SERVICE_KEY;
      
      if (!serviceKey) {
        throw new AuthError(
          'Missing service key for dev auth. Set VITE_KX_SERVICE_KEY environment variable.',
          'service-key',
          'MISSING_SERVICE_KEY'
        );
      }

      headers['x-service-key'] = serviceKey;
      return headers;
    }

    case 'cognito-jwt': {
      const token = getIdToken();
      
      if (!token) {
        // In production, this is a critical error
        // In dev without service key, this is expected until user logs in
        const isProd = import.meta.env.MODE === 'production';
        
        if (isProd) {
          throw new AuthError(
            'Not authenticated. Please log in.',
            'cognito-jwt',
            'MISSING_TOKEN'
          );
        }
        
        // Dev mode without service key - return empty headers (with tenant if available)
        console.warn('No auth token available. API calls will require authentication.');
        return headers;
      }

      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    }

    case 'none':
    default:
      // No auth configured - return headers (with tenant if available)
      return headers;
  }
}

/**
 * Check if auth is properly configured
 * 
 * Returns error message if misconfigured, null if OK
 */
export function validateAuthConfig(): string | null {
  const mode = getAuthMode();

  switch (mode) {
    case 'service-key': {
      const serviceKey = import.meta.env.VITE_KX_SERVICE_KEY;
      if (!serviceKey) {
        return 'Missing service key for dev auth. Set VITE_KX_SERVICE_KEY environment variable.';
      }
      return null;
    }

    case 'cognito-jwt': {
      const token = getIdToken();
      if (!token) {
        return 'Not authenticated. Please log in.';
      }
      return null;
    }

    case 'none':
    default:
      return 'No authentication configured.';
  }
}

/**
 * Get human-readable auth mode description
 */
export function getAuthModeDescription(): string {
  const mode = getAuthMode();
  const env = import.meta.env.MODE || 'development';

  switch (mode) {
    case 'service-key':
      return `Dev/Staging Mode (${env}) - Service Key Auth`;
    case 'cognito-jwt':
      return `Production Mode (${env}) - Cognito JWT Auth`;
    case 'none':
    default:
      return `No Auth (${env})`;
  }
}

