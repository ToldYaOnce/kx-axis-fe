# Gateway Auth Migration - Complete ✅

## Summary

Successfully implemented dual auth mode support to match the `kx-aws` gateway-level auth strategy. All API clients now use centralized auth headers that automatically switch between **Service Key** (dev/staging) and **Cognito JWT** (production) modes.

## What Changed

### 🆕 New Files

1. **`src/auth/authHeaders.ts`**
   - Centralized auth logic
   - Exports: `getAuthHeaders()`, `getAuthMode()`, `validateAuthConfig()`, `AuthError`
   - Handles mode detection and header injection

2. **`AUTH_SETUP.md`**
   - Complete auth setup guide
   - Environment configuration
   - Error handling examples
   - Troubleshooting

3. **`ENV_TEMPLATE.md`**
   - Quick reference for environment variables
   - Copy-paste templates for dev/staging/prod

### ✏️ Modified Files

1. **`src/api/flowClient.ts`**
   - Removed `getTenantId()` and `x-tenant-id` header
   - Updated `getHeaders()` to use `getAuthHeaders()`
   - Added `handleAuthError()` for auth-specific error handling

2. **`src/api/simulatorClient.ts`**
   - Added `getHeaders()` method
   - Updated all API calls to use centralized headers
   - Added auth error handling

3. **`vite-env.d.ts`**
   - Added `VITE_KX_SERVICE_KEY` type definition
   - Added `MODE` to `ImportMetaEnv` interface

4. **`tsconfig.json`**
   - Added `vite-env.d.ts` to includes array

5. **`src/index.ts`**
   - Exported auth utilities for external use

## Auth Modes

### Mode 1: Service Key (Dev/Staging)

```typescript
// Environment
VITE_KX_SERVICE_KEY=dev-service-key-123
MODE=development

// Headers sent
{
  "Content-Type": "application/json",
  "x-service-key": "dev-service-key-123"
}

// Gateway behavior
- Authenticates via Service Key authorizer
- Injects tenantId/callerId into requestContext
- No Cognito required
```

### Mode 2: Cognito JWT (Production)

```typescript
// Environment
MODE=production
// VITE_KX_SERVICE_KEY NOT SET

// Headers sent
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Gateway behavior
- Validates JWT via Cognito
- Extracts tenantId from token claims
- Requires user authentication
```

## How It Works

### Before (Old)

```typescript
// flowClient.ts
private getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-tenant-id': getTenantId(),  // Manual tenant injection
  };
}
```

### After (New)

```typescript
// flowClient.ts
import { getAuthHeaders } from '../auth/authHeaders';

private getHeaders(): HeadersInit {
  const authHeaders = getAuthHeaders();  // Auto-detects mode
  
  return {
    'Content-Type': 'application/json',
    ...authHeaders,  // Injects x-service-key OR Authorization
  };
}
```

## Key Benefits

1. **Single Source of Truth**
   - All auth logic in one place (`authHeaders.ts`)
   - No scattered auth code across API clients

2. **Environment-Aware**
   - Automatically switches modes based on env
   - Dev/staging: service key
   - Production: Cognito JWT

3. **Better Error Handling**
   - `AuthError` class for auth-specific errors
   - Clear error messages for missing credentials
   - Console warnings for misconfiguration

4. **No More x-tenant-id**
   - Gateway resolves tenant server-side
   - Simplifies frontend code
   - Reduces coupling

5. **Type-Safe**
   - Full TypeScript support
   - Env variables typed in `vite-env.d.ts`

## Usage Examples

### Check Auth Mode

```typescript
import { getAuthMode, getAuthModeDescription } from 'kx-axis-fe';

console.log(getAuthMode());
// => 'service-key' | 'cognito-jwt' | 'none'

console.log(getAuthModeDescription());
// => "Dev/Staging Mode (development) - Service Key Auth"
```

### Validate Config

```typescript
import { validateAuthConfig } from 'kx-axis-fe';

const error = validateAuthConfig();
if (error) {
  alert(error);  // Show to user
}
```

### Handle Auth Errors

```typescript
import { flowAPI } from './api/flowClient';

try {
  await flowAPI.getFlow('flow_123');
} catch (error) {
  if (error.code === 'MISSING_SERVICE_KEY') {
    console.error('Set VITE_KX_SERVICE_KEY in .env.local');
  } else if (error.code === 'MISSING_TOKEN') {
    console.error('User not logged in');
  }
}
```

## Environment Setup

### Dev (.env.local)

```bash
VITE_API_BASE_URL=https://dev-gateway.example.com
VITE_KX_SERVICE_KEY=dev-service-key-123
```

### Staging (.env.staging)

```bash
VITE_API_BASE_URL=https://staging-gateway.example.com
VITE_KX_SERVICE_KEY=staging-service-key-456
```

### Production (.env.production)

```bash
VITE_API_BASE_URL=https://api.example.com
# DO NOT SET VITE_KX_SERVICE_KEY
```

## Testing

### Test Service Key Auth

```bash
# 1. Set env
export VITE_KX_SERVICE_KEY=dev-key-123

# 2. Start dev server
npm run dev

# 3. Check headers in network tab
# Should see: x-service-key: dev-key-123
```

### Test Cognito JWT Auth

```bash
# 1. Build production
npm run build
npm run preview

# 2. Set token in console
localStorage.setItem('kx-id-token', 'your-jwt-token');

# 3. Check headers in network tab
# Should see: Authorization: Bearer your-jwt-token
```

## Error Scenarios

| Scenario | Error | Resolution |
|----------|-------|------------|
| Dev without service key | `MISSING_SERVICE_KEY` | Set `VITE_KX_SERVICE_KEY` |
| Prod without token | `MISSING_TOKEN` | Implement Cognito login |
| Invalid service key | `401 Unauthorized` | Get new key from backend team |
| Expired JWT | `401 Unauthorized` | Refresh token or re-login |

## Migration Checklist

- [x] Created `src/auth/authHeaders.ts`
- [x] Updated `src/api/flowClient.ts`
- [x] Updated `src/api/simulatorClient.ts`
- [x] Removed `x-tenant-id` header logic
- [x] Added type definitions for env vars
- [x] Exported auth utilities from `src/index.ts`
- [x] Created documentation (`AUTH_SETUP.md`)
- [x] Created env template (`ENV_TEMPLATE.md`)
- [x] Zero linter errors

## Next Steps

1. **Get Service Key**
   - Contact backend team for dev/staging service keys
   - Store in `.env.local` (git-ignored)

2. **Test Dev Mode**
   - Set `VITE_KX_SERVICE_KEY`
   - Verify API calls work without Cognito

3. **Implement Cognito (Future)**
   - Replace `getIdToken()` stub with real Cognito SDK
   - Use `aws-amplify` or `amazon-cognito-identity-js`
   - Store tokens securely (httpOnly cookies preferred)

4. **Add Auth UI (Future)**
   - Login page
   - Token refresh logic
   - Auth error boundary

## File Diffs

### Created: `src/auth/authHeaders.ts`

```typescript
export type AuthMode = 'service-key' | 'cognito-jwt' | 'none';

export function getAuthMode(): AuthMode { ... }
export function getAuthHeaders(): Record<string, string> { ... }
export function validateAuthConfig(): string | null { ... }
export class AuthError extends Error { ... }
```

### Modified: `src/api/flowClient.ts`

```diff
- import getTenantId from ...
+ import { getAuthHeaders, AuthError } from '../auth/authHeaders';

  private getHeaders(): HeadersInit {
+   const authHeaders = getAuthHeaders();
    return {
      'Content-Type': 'application/json',
-     'x-tenant-id': getTenantId(),
+     ...authHeaders,
    };
  }
```

### Modified: `src/api/simulatorClient.ts`

```diff
+ import { getAuthHeaders, AuthError } from '../auth/authHeaders';

+ private getHeaders(): HeadersInit {
+   const authHeaders = getAuthHeaders();
+   return {
+     'Content-Type': 'application/json',
+     ...authHeaders,
+   };
+ }

  async startSimulation(...) {
-   headers: { 'Content-Type': 'application/json' },
+   headers: this.getHeaders(),
  }
```

### Modified: `vite-env.d.ts`

```diff
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
+   readonly VITE_KX_SERVICE_KEY?: string;
+   readonly MODE: string;
  }
```

### Modified: `tsconfig.json`

```diff
- "include": ["src"],
+ "include": ["src", "vite-env.d.ts"],
```

---

## ✅ **Migration Complete!**

The frontend now supports dual auth modes matching `kx-aws` gateway auth strategy. All API clients use centralized auth headers with zero duplication.

**Reference:** `kx-aws/gateway-auth-strategy.md` for backend implementation details.

