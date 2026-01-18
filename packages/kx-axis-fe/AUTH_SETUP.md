# Auth Setup Guide

## Overview

The KxAxis frontend supports **two authentication modes** to match the gateway-level auth strategy in `kx-aws`:

1. **Service Key Mode** (Dev/Staging)
   - Uses `x-service-key` header
   - No Cognito login required
   - Gateway resolves `tenantId`/`callerId` from service key
   - Enabled when `VITE_KX_SERVICE_KEY` is set

2. **Cognito JWT Mode** (Production)
   - Uses `Authorization: Bearer <jwt>` header
   - Requires user authentication via Cognito
   - Token managed by auth provider

## Environment Setup

### Dev/Staging (Service Key)

```bash
# .env.local or .env.development
VITE_API_BASE_URL=https://dev-api.example.com
VITE_KX_SERVICE_KEY=your-service-key-here
```

**How to get service key:**
1. Contact your backend team for the dev service key
2. Or retrieve from AWS Secrets Manager: `kx-service-keys/dev`

**Important:**
- Service key auth ONLY works in non-production modes (`development`, `staging`)
- If `MODE=production`, service key will be ignored and JWT auth is required

### Production (Cognito JWT)

```bash
# .env.production
VITE_API_BASE_URL=https://api.example.com
# DO NOT SET VITE_KX_SERVICE_KEY
```

**Token Management:**
Currently, the frontend looks for the JWT token in:
```typescript
localStorage.getItem('kx-id-token')
```

**TODO:** Integrate with Cognito SDK or auth provider.

## How It Works

### Centralized Auth Headers

All API calls use a single function:

```typescript
import { getAuthHeaders } from './auth/authHeaders';

const headers = {
  'Content-Type': 'application/json',
  ...getAuthHeaders(),  // Injects auth based on mode
};
```

### Auth Mode Detection

```typescript
import { getAuthMode, getAuthModeDescription } from './auth/authHeaders';

const mode = getAuthMode();
// => 'service-key' | 'cognito-jwt' | 'none'

const description = getAuthModeDescription();
// => "Dev/Staging Mode (development) - Service Key Auth"
```

### Auth Validation

```typescript
import { validateAuthConfig } from './auth/authHeaders';

const error = validateAuthConfig();
if (error) {
  console.error('Auth config error:', error);
  // Show error to user
}
```

## Error Handling

### Missing Service Key (Dev)

```
Missing service key for dev auth. Set VITE_KX_SERVICE_KEY environment variable.
```

**Resolution:**
1. Add `VITE_KX_SERVICE_KEY` to `.env.local`
2. Restart dev server

### Missing Token (Production)

```
Not authenticated. Please log in.
```

**Resolution:**
1. Implement Cognito login flow
2. Store token in `localStorage` or auth context

### 401 Unauthorized

API will return 401 if:
- Service key is invalid or expired
- JWT token is invalid or expired
- No auth credentials provided

## Integration Examples

### Using in Components

```tsx
import { useEffect } from 'react';
import { validateAuthConfig, getAuthModeDescription } from 'kx-axis-fe';

function MyComponent() {
  useEffect(() => {
    const error = validateAuthConfig();
    if (error) {
      console.error('Auth error:', error);
    }
    
    console.log('Auth mode:', getAuthModeDescription());
  }, []);
  
  // ...
}
```

### Handling Auth Errors in API Calls

```typescript
import { flowAPI } from './api/flowClient';

try {
  const flow = await flowAPI.getFlow('flow_123');
} catch (error) {
  if (error.status === 401 || error.status === 403) {
    // Auth error
    console.error('Auth failed:', error.message);
    // Redirect to login or show error
  } else {
    // Other error
    console.error('API error:', error);
  }
}
```

## Migration from Old Auth

### Before (with x-tenant-id)

```typescript
const headers = {
  'Content-Type': 'application/json',
  'x-tenant-id': getTenantId(),
};
```

### After (with centralized auth)

```typescript
import { getAuthHeaders } from './auth/authHeaders';

const headers = {
  'Content-Type': 'application/json',
  ...getAuthHeaders(),  // Auto-detects mode and injects correct headers
};
```

**Note:** `x-tenant-id` is NO LONGER required. The gateway resolves tenant from auth credentials.

## Testing

### Test Service Key Auth (Dev)

```bash
# Set service key
export VITE_KX_SERVICE_KEY=dev-service-key-123

# Start dev server
npm run dev

# Open browser console and check:
import { getAuthMode, validateAuthConfig } from 'kx-axis-fe';
console.log(getAuthMode()); // Should be 'service-key'
console.log(validateAuthConfig()); // Should be null (no errors)
```

### Test Cognito JWT Auth (Production Build)

```bash
# Build for production
npm run build

# Serve production build
npm run preview

# In browser, set token:
localStorage.setItem('kx-id-token', 'your-jwt-token');

# API calls should now include Authorization header
```

## Security Notes

1. **Never commit service keys** to git
2. **Never use service key in production** - it will be ignored anyway
3. **Store JWT tokens securely** - use httpOnly cookies if possible
4. **Rotate service keys regularly** - coordinate with backend team

## Troubleshooting

### "Missing service key" in dev

- Check `.env.local` has `VITE_KX_SERVICE_KEY` set
- Restart dev server after adding env var
- Verify env var is not commented out

### "Not authenticated" in production

- Check if JWT token is in localStorage: `kx-id-token`
- Verify token is valid (not expired)
- Implement proper Cognito login flow

### API returns 403 Forbidden

- Service key might be invalid or expired
- Contact backend team for new service key

### Changes not taking effect

- Restart dev server after changing `.env` files
- Clear browser cache and localStorage
- Check browser console for auth errors

## Next Steps

1. **Implement Cognito Integration**
   - Replace localStorage stub with Cognito SDK
   - Use `aws-amplify` or `amazon-cognito-identity-js`
   - Store tokens securely

2. **Add Auth Context Provider**
   - Centralize auth state (isAuthenticated, user, token)
   - Provide login/logout methods
   - Auto-refresh tokens

3. **Add UI Components**
   - Login page
   - Auth error boundary
   - Token expiration warnings

---

**Reference:** `kx-aws/gateway-auth-strategy.md` for backend auth implementation.


